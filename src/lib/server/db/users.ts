/**
 * Users repository with multi-tenant support
 * All queries are scoped by site_id
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';

export interface DBUser {
  id: string;
  site_id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'user' | 'customer';
  created_at: number;
  updated_at: number;
}

export interface CreateUserData {
  email: string;
  name: string;
  password_hash: string;
  role?: 'admin' | 'user' | 'customer';
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password_hash?: string;
  role?: 'admin' | 'user' | 'customer';
}

/**
 * Get a user by ID (scoped by site)
 */
export async function getUserById(
  db: D1Database,
  siteId: string,
  userId: string
): Promise<DBUser | null> {
  return await executeOne<DBUser>(db, 'SELECT * FROM users WHERE id = ? AND site_id = ?', [
    userId,
    siteId
  ]);
}

/**
 * Get a user by email (scoped by site)
 */
export async function getUserByEmail(
  db: D1Database,
  siteId: string,
  email: string
): Promise<DBUser | null> {
  return await executeOne<DBUser>(db, 'SELECT * FROM users WHERE email = ? AND site_id = ?', [
    email,
    siteId
  ]);
}

/**
 * Get all users for a site
 */
export async function getAllUsers(db: D1Database, siteId: string): Promise<DBUser[]> {
  const result = await execute<DBUser>(
    db,
    'SELECT * FROM users WHERE site_id = ? ORDER BY created_at DESC',
    [siteId]
  );
  return result.results || [];
}

/**
 * Get users by role (scoped by site)
 */
export async function getUsersByRole(
  db: D1Database,
  siteId: string,
  role: 'admin' | 'user' | 'customer'
): Promise<DBUser[]> {
  const result = await execute<DBUser>(
    db,
    'SELECT * FROM users WHERE site_id = ? AND role = ? ORDER BY created_at DESC',
    [siteId, role]
  );
  return result.results || [];
}

/**
 * Create a new user (scoped by site)
 */
export async function createUser(
  db: D1Database,
  siteId: string,
  data: CreateUserData
): Promise<DBUser> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  await db
    .prepare(
      `INSERT INTO users (id, site_id, email, name, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.email,
      data.name,
      data.password_hash,
      data.role || 'customer',
      timestamp,
      timestamp
    )
    .run();

  const user = await getUserById(db, siteId, id);
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}

/**
 * Update a user (scoped by site)
 */
export async function updateUser(
  db: D1Database,
  siteId: string,
  userId: string,
  data: UpdateUserData
): Promise<DBUser | null> {
  const user = await getUserById(db, siteId, userId);
  if (!user) {
    return null;
  }

  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email);
  }
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.password_hash !== undefined) {
    updates.push('password_hash = ?');
    params.push(data.password_hash);
  }
  if (data.role !== undefined) {
    updates.push('role = ?');
    params.push(data.role);
  }

  if (updates.length === 0) {
    return user;
  }

  updates.push('updated_at = ?');
  params.push(timestamp);
  params.push(userId);
  params.push(siteId);

  await db
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`)
    .bind(...params)
    .run();

  return await getUserById(db, siteId, userId);
}

/**
 * Delete a user (scoped by site)
 */
export async function deleteUser(db: D1Database, siteId: string, userId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM users WHERE id = ? AND site_id = ?')
    .bind(userId, siteId)
    .run();
  return (result.meta?.changes || 0) > 0;
}
