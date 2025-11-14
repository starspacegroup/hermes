import { describe, it, expect } from 'vitest';
import {
  parseUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  isUserAccountActive,
  canPerformAction,
  isSystemUser,
  getUserAllPermissions
} from './permissions';
import type { DBUser } from './db/users';

describe('Permission Utilities', () => {
  const baseUser: DBUser = {
    id: 'user-1',
    site_id: 'site-1',
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hash',
    role: 'customer',
    permissions: '[]',
    status: 'active',
    expiration_date: null,
    grace_period_days: 0,
    last_login_at: null,
    last_login_ip: null,
    created_at: 1234567890,
    updated_at: 1234567890,
    created_by: null,
    updated_by: null
  };

  describe('parseUserPermissions', () => {
    it('should parse valid JSON permissions', () => {
      const user = { ...baseUser, permissions: '["orders:read","products:write"]' };
      const result = parseUserPermissions(user);
      expect(result).toEqual(['orders:read', 'products:write']);
    });

    it('should return empty array for invalid JSON', () => {
      const user = { ...baseUser, permissions: 'invalid json' };
      const result = parseUserPermissions(user);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty JSON array', () => {
      const user = { ...baseUser, permissions: '[]' };
      const result = parseUserPermissions(user);
      expect(result).toEqual([]);
    });
  });

  describe('userHasPermission', () => {
    it('should return true for platform_engineer with any permission', () => {
      const user = { ...baseUser, role: 'platform_engineer' as const };
      expect(userHasPermission(user, 'orders:read')).toBe(true);
      expect(userHasPermission(user, 'users:delete')).toBe(true);
      expect(userHasPermission(user, 'any:permission')).toBe(true);
    });

    it('should return true for admin with most permissions', () => {
      const user = { ...baseUser, role: 'admin' as const };
      expect(userHasPermission(user, 'orders:read')).toBe(true);
      expect(userHasPermission(user, 'products:write')).toBe(true);
    });

    it('should return false for admin trying to delete users without explicit permission', () => {
      const user = { ...baseUser, role: 'admin' as const };
      expect(userHasPermission(user, 'users:delete')).toBe(false);
    });

    it('should return true for admin with explicit permission', () => {
      const user = { ...baseUser, role: 'admin' as const, permissions: '["users:delete"]' };
      expect(userHasPermission(user, 'users:delete')).toBe(true);
    });

    it('should return true for user with specific permission', () => {
      const user = { ...baseUser, permissions: '["orders:read"]' };
      expect(userHasPermission(user, 'orders:read')).toBe(true);
    });

    it('should return false for user without specific permission', () => {
      const user = { ...baseUser, permissions: '["orders:read"]' };
      expect(userHasPermission(user, 'orders:write')).toBe(false);
    });

    it('should return false for customer without permissions', () => {
      const user = { ...baseUser, role: 'customer' as const };
      expect(userHasPermission(user, 'orders:read')).toBe(false);
    });
  });

  describe('userHasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      const user = { ...baseUser, permissions: '["orders:read"]' };
      expect(userHasAnyPermission(user, ['orders:read', 'products:write'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      const user = { ...baseUser, permissions: '["orders:read"]' };
      expect(userHasAnyPermission(user, ['products:write', 'users:delete'])).toBe(false);
    });
  });

  describe('userHasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const user = { ...baseUser, permissions: '["orders:read","orders:write"]' };
      expect(userHasAllPermissions(user, ['orders:read', 'orders:write'])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      const user = { ...baseUser, permissions: '["orders:read"]' };
      expect(userHasAllPermissions(user, ['orders:read', 'orders:write'])).toBe(false);
    });
  });

  describe('isUserAccountActive', () => {
    it('should return true for active user without expiration', () => {
      const user = { ...baseUser, status: 'active' as const };
      expect(isUserAccountActive(user)).toBe(true);
    });

    it('should return false for inactive user', () => {
      const user = { ...baseUser, status: 'inactive' as const };
      expect(isUserAccountActive(user)).toBe(false);
    });

    it('should return false for expired user', () => {
      const user = { ...baseUser, status: 'expired' as const };
      expect(isUserAccountActive(user)).toBe(false);
    });

    it('should return false for suspended user', () => {
      const user = { ...baseUser, status: 'suspended' as const };
      expect(isUserAccountActive(user)).toBe(false);
    });

    it('should return true for user within expiration date', () => {
      const now = 1000000;
      const future = now + 86400; // 1 day in future
      const user = { ...baseUser, status: 'active' as const, expiration_date: future };
      expect(isUserAccountActive(user, now)).toBe(true);
    });

    it('should return false for user past expiration date', () => {
      const now = 1000000;
      const past = now - 86400; // 1 day in past
      const user = { ...baseUser, status: 'active' as const, expiration_date: past };
      expect(isUserAccountActive(user, now)).toBe(false);
    });

    it('should return true for user within grace period', () => {
      const now = 1000000;
      const expiredYesterday = now - 86400;
      const user = {
        ...baseUser,
        status: 'active' as const,
        expiration_date: expiredYesterday,
        grace_period_days: 7
      };
      expect(isUserAccountActive(user, now)).toBe(true);
    });

    it('should return false for user past grace period', () => {
      const now = 1000000;
      const expiredEightDaysAgo = now - 8 * 86400;
      const user = {
        ...baseUser,
        status: 'active' as const,
        expiration_date: expiredEightDaysAgo,
        grace_period_days: 7
      };
      expect(isUserAccountActive(user, now)).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    it('should return true for active user with permission', () => {
      const user = {
        ...baseUser,
        status: 'active' as const,
        permissions: '["orders:read"]'
      };
      expect(canPerformAction(user, 'orders:read')).toBe(true);
    });

    it('should return false for inactive user even with permission', () => {
      const user = {
        ...baseUser,
        status: 'inactive' as const,
        permissions: '["orders:read"]'
      };
      expect(canPerformAction(user, 'orders:read')).toBe(false);
    });

    it('should return false for active user without permission', () => {
      const user = { ...baseUser, status: 'active' as const };
      expect(canPerformAction(user, 'orders:read')).toBe(false);
    });

    it('should return false for expired user even with permission', () => {
      const now = 1000000;
      const pastExpiration = now - 86400;
      const user = {
        ...baseUser,
        status: 'active' as const,
        expiration_date: pastExpiration,
        permissions: '["orders:read"]'
      };
      expect(canPerformAction(user, 'orders:read', now)).toBe(false);
    });
  });

  describe('isSystemUser', () => {
    it('should return true for admin-1', () => {
      expect(isSystemUser('admin-1')).toBe(true);
    });

    it('should return true for engineer-1', () => {
      expect(isSystemUser('engineer-1')).toBe(true);
    });

    it('should return false for regular user IDs', () => {
      expect(isSystemUser('user-123')).toBe(false);
      expect(isSystemUser('customer-456')).toBe(false);
      expect(isSystemUser('admin')).toBe(false);
    });
  });

  describe('getUserAllPermissions', () => {
    const mockDb = {} as D1Database;

    it('should return custom permissions for regular user', async () => {
      const user = { ...baseUser, permissions: '["orders:read","products:write"]' };
      const result = await getUserAllPermissions(mockDb, user);
      expect(result).toEqual(['orders:read', 'products:write']);
    });

    it('should return all permissions for platform engineer', async () => {
      const user = { ...baseUser, role: 'platform_engineer' as const };
      const result = await getUserAllPermissions(mockDb, user);
      expect(result.length).toBeGreaterThan(20);
      expect(result).toContain('users:delete');
      expect(result).toContain('products:delete');
      expect(result).toContain('orders:delete');
    });

    it('should return default admin permissions when admin has no custom permissions', async () => {
      const user = { ...baseUser, role: 'admin' as const, permissions: '[]' };
      const result = await getUserAllPermissions(mockDb, user);
      expect(result).toContain('orders:read');
      expect(result).toContain('products:write');
      expect(result).toContain('users:write');
      expect(result).not.toContain('users:delete');
    });

    it('should return custom permissions when admin has them set', async () => {
      const user = {
        ...baseUser,
        role: 'admin' as const,
        permissions: '["custom:permission"]'
      };
      const result = await getUserAllPermissions(mockDb, user);
      expect(result).toEqual(['custom:permission']);
    });

    it('should return empty array for customer with no permissions', async () => {
      const user = { ...baseUser, role: 'customer' as const, permissions: '[]' };
      const result = await getUserAllPermissions(mockDb, user);
      expect(result).toEqual([]);
    });
  });
});
