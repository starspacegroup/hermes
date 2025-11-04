/**
 * Roles and Permissions repository with multi-tenant support
 * Handles RBAC (Role-Based Access Control) functionality
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: number;
}

export interface Role {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  is_system_role: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted_at: number;
  granted_by: string | null;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateRoleData {
  name: string;
  description?: string;
  is_system_role?: boolean;
  permission_ids?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

/**
 * Get all permissions (not scoped by site - permissions are global)
 */
export async function getAllPermissions(db: D1Database): Promise<Permission[]> {
  const result = await db.prepare('SELECT * FROM permissions ORDER BY category, name').all();
  return (result.results as unknown as Permission[]) || [];
}

/**
 * Get permissions by category
 */
export async function getPermissionsByCategory(
  db: D1Database,
  category: string
): Promise<Permission[]> {
  const result = await execute<Permission>(
    db,
    'SELECT * FROM permissions WHERE category = ? ORDER BY name',
    [category]
  );
  return result.results || [];
}

/**
 * Get a permission by ID
 */
export async function getPermissionById(
  db: D1Database,
  permissionId: string
): Promise<Permission | null> {
  return await executeOne<Permission>(db, 'SELECT * FROM permissions WHERE id = ?', [permissionId]);
}

/**
 * Get a role by ID (scoped by site)
 */
export async function getRoleById(
  db: D1Database,
  siteId: string,
  roleId: string
): Promise<Role | null> {
  return await executeOne<Role>(db, 'SELECT * FROM roles WHERE id = ? AND site_id = ?', [
    roleId,
    siteId
  ]);
}

/**
 * Get a role by name (scoped by site)
 */
export async function getRoleByName(
  db: D1Database,
  siteId: string,
  name: string
): Promise<Role | null> {
  return await executeOne<Role>(db, 'SELECT * FROM roles WHERE name = ? AND site_id = ?', [
    name,
    siteId
  ]);
}

/**
 * Get all roles for a site
 */
export async function getAllRoles(db: D1Database, siteId: string): Promise<Role[]> {
  const result = await execute<Role>(
    db,
    'SELECT * FROM roles WHERE site_id = ? ORDER BY created_at DESC',
    [siteId]
  );
  return result.results || [];
}

/**
 * Get role with its permissions
 */
export async function getRoleWithPermissions(
  db: D1Database,
  siteId: string,
  roleId: string
): Promise<RoleWithPermissions | null> {
  const role = await getRoleById(db, siteId, roleId);
  if (!role) {
    return null;
  }

  const permissions = await getRolePermissions(db, roleId);

  return {
    ...role,
    permissions
  };
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(db: D1Database, roleId: string): Promise<Permission[]> {
  const result = await db
    .prepare(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.category, p.name`
    )
    .bind(roleId)
    .all();

  return (result.results as unknown as Permission[]) || [];
}

/**
 * Create a new role (scoped by site)
 */
export async function createRole(
  db: D1Database,
  siteId: string,
  data: CreateRoleData
): Promise<Role> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  await db
    .prepare(
      `INSERT INTO roles (id, site_id, name, description, is_system_role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.name,
      data.description || null,
      data.is_system_role ? 1 : 0,
      timestamp,
      timestamp
    )
    .run();

  // Add permissions if provided
  if (data.permission_ids && data.permission_ids.length > 0) {
    for (const permissionId of data.permission_ids) {
      await addPermissionToRole(db, id, permissionId, null);
    }
  }

  const role = await getRoleById(db, siteId, id);
  if (!role) {
    throw new Error('Failed to create role');
  }
  return role;
}

/**
 * Update a role (scoped by site)
 */
export async function updateRole(
  db: D1Database,
  siteId: string,
  roleId: string,
  data: UpdateRoleData
): Promise<Role | null> {
  const role = await getRoleById(db, siteId, roleId);
  if (!role) {
    return null;
  }

  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }

  if (updates.length === 0) {
    return role;
  }

  updates.push('updated_at = ?');
  params.push(timestamp);
  params.push(roleId);
  params.push(siteId);

  await db
    .prepare(`UPDATE roles SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`)
    .bind(...params)
    .run();

  return await getRoleById(db, siteId, roleId);
}

/**
 * Delete a role (scoped by site)
 */
export async function deleteRole(db: D1Database, siteId: string, roleId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM roles WHERE id = ? AND site_id = ?')
    .bind(roleId, siteId)
    .run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Add a permission to a role
 */
export async function addPermissionToRole(
  db: D1Database,
  roleId: string,
  permissionId: string,
  grantedBy: string | null
): Promise<void> {
  await db
    .prepare('INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES (?, ?, ?)')
    .bind(roleId, permissionId, grantedBy)
    .run();
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(
  db: D1Database,
  roleId: string,
  permissionId: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?')
    .bind(roleId, permissionId)
    .run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Set all permissions for a role (replaces existing)
 */
export async function setRolePermissions(
  db: D1Database,
  roleId: string,
  permissionIds: string[],
  grantedBy: string | null
): Promise<void> {
  // Remove all existing permissions
  await db.prepare('DELETE FROM role_permissions WHERE role_id = ?').bind(roleId).run();

  // Add new permissions
  for (const permissionId of permissionIds) {
    await addPermissionToRole(db, roleId, permissionId, grantedBy);
  }
}

/**
 * Check if a role has a specific permission
 */
export async function roleHasPermission(
  db: D1Database,
  roleId: string,
  permissionName: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM role_permissions rp
       INNER JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.name = ?`
    )
    .bind(roleId, permissionName)
    .first<{ count: number }>();

  return (result?.count || 0) > 0;
}
