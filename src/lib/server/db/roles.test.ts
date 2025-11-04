import { describe, it, expect, vi } from 'vitest';
import {
  getAllPermissions,
  getPermissionsByCategory,
  getRoleById,
  getRoleWithPermissions,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  type Permission,
  type Role,
  type RoleWithPermissions
} from './roles';

describe('Roles Repository', () => {
  const siteId = 'test-site';

  describe('getAllPermissions', () => {
    it('should get all permissions', async () => {
      const mockPermissions: Permission[] = [
        {
          id: 'perm-1',
          name: 'orders:read',
          description: 'View orders',
          category: 'orders',
          created_at: 1234567890
        }
      ];
      const mockResults = { results: mockPermissions, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockPrepare = vi.fn().mockReturnValue({ all: mockAll });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getAllPermissions(mockDB);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM permissions ORDER BY category, name'
      );
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('getPermissionsByCategory', () => {
    it('should get permissions filtered by category', async () => {
      const mockPermissions: Permission[] = [
        {
          id: 'perm-1',
          name: 'orders:read',
          description: 'View orders',
          category: 'orders',
          created_at: 1234567890
        }
      ];
      const mockResults = { results: mockPermissions, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getPermissionsByCategory(mockDB, 'orders');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM permissions WHERE category = ? ORDER BY name'
      );
      expect(mockBind).toHaveBeenCalledWith('orders');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('getRoleById', () => {
    it('should get role by ID scoped by site', async () => {
      const mockRole: Role = {
        id: 'role-1',
        site_id: siteId,
        name: 'Manager',
        description: 'Store manager',
        is_system_role: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };
      const mockFirst = vi.fn().mockResolvedValue(mockRole);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getRoleById(mockDB, siteId, 'role-1');

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM roles WHERE id = ? AND site_id = ?');
      expect(mockBind).toHaveBeenCalledWith('role-1', siteId);
      expect(result).toEqual(mockRole);
    });

    it('should return null when role not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getRoleById(mockDB, siteId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllRoles', () => {
    it('should get all roles for a site', async () => {
      const mockRoles: Role[] = [
        {
          id: 'role-1',
          site_id: siteId,
          name: 'Manager',
          description: 'Store manager',
          is_system_role: 0,
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];
      const mockResults = { results: mockRoles, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getAllRoles(mockDB, siteId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM roles WHERE site_id = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockRoles);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole: Role = {
        id: 'role-1',
        site_id: siteId,
        name: 'Manager',
        description: 'Store manager',
        is_system_role: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockFirst = vi.fn().mockResolvedValue(mockRole);
      const mockBindSelect = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepareSelect = vi.fn().mockReturnValue({ bind: mockBindSelect });

      const mockDB = {
        prepare: vi.fn((sql: string) => {
          if (sql.startsWith('INSERT')) {
            return mockPrepare(sql);
          }
          return mockPrepareSelect(sql);
        })
      } as unknown as D1Database;

      const result = await createRole(mockDB, siteId, {
        name: 'Manager',
        description: 'Store manager'
      });

      expect(result).toEqual(mockRole);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const mockResult = { meta: { changes: 1 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteRole(mockDB, siteId, 'role-1');

      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM roles WHERE id = ? AND site_id = ?');
      expect(mockBind).toHaveBeenCalledWith('role-1', siteId);
      expect(result).toBe(true);
    });
  });

  describe('addPermissionToRole', () => {
    it('should add a permission to a role', async () => {
      const mockResult = { success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await addPermissionToRole(mockDB, 'role-1', 'perm-1', 'user-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES (?, ?, ?)'
      );
      expect(mockBind).toHaveBeenCalledWith('role-1', 'perm-1', 'user-1');
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove a permission from a role', async () => {
      const mockResult = { meta: { changes: 1 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await removePermissionFromRole(mockDB, 'role-1', 'perm-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('role-1', 'perm-1');
      expect(result).toBe(true);
    });
  });
});
