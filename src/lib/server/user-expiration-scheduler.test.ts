import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deactivateExpiredAccounts,
  notifyExpiringAccounts,
  runExpirationCheck
} from './user-expiration-scheduler';
import * as usersModule from './db/users';
import * as notificationsModule from './db/notifications';
import * as activityLogsModule from './db/activity-logs';
import type { DBUser } from './db/users';

// Mock the dependencies
vi.mock('./db/users');
vi.mock('./db/notifications');
vi.mock('./db/activity-logs');

describe('User Expiration Scheduler', () => {
  let mockDb: D1Database;
  const siteId = '1';
  const now = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('deactivateExpiredAccounts', () => {
    it('should deactivate expired users and create notifications', async () => {
      const expiredUser: DBUser = {
        id: '1',
        site_id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 100,
        last_login_at: now - 86400 * 10,
        last_login_ip: '127.0.0.1',
        expiration_date: now - 86400 * 5,
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getExpiredUsers).mockResolvedValue([expiredUser]);
      vi.mocked(usersModule.deactivateExpiredUsers).mockResolvedValue(1);
      vi.mocked(notificationsModule.createNotification).mockResolvedValue({
        id: '1',
        user_id: '1',
        site_id: '1',
        type: 'account_expired',
        title: 'Account Expired',
        message: 'Test',
        is_read: 0,
        read_at: null,
        created_at: now,
        priority: 'urgent',
        metadata: null,
        action_url: null,
        expires_at: null
      });
      vi.mocked(activityLogsModule.createActivityLog).mockResolvedValue({
        id: '1',
        site_id: '1',
        user_id: null,
        action: 'user.expired',
        entity_type: 'user',
        entity_id: '1',
        entity_name: 'John Doe',
        description: 'Test',
        metadata: null,
        severity: 'warning',
        created_at: now,
        ip_address: null,
        user_agent: null
      });

      const result = await deactivateExpiredAccounts(mockDb, siteId);

      expect(result.deactivated).toBe(1);
      expect(result.users).toEqual([expiredUser]);
      expect(usersModule.getExpiredUsers).toHaveBeenCalledWith(mockDb, siteId);
      expect(usersModule.deactivateExpiredUsers).toHaveBeenCalledWith(mockDb, siteId);
      expect(notificationsModule.createNotification).toHaveBeenCalledWith(
        mockDb,
        siteId,
        expect.objectContaining({
          user_id: expiredUser.id,
          type: 'account_expired',
          title: 'Account Expired',
          priority: 'urgent'
        })
      );
      expect(activityLogsModule.createActivityLog).toHaveBeenCalledWith(
        mockDb,
        siteId,
        expect.objectContaining({
          user_id: null,
          action: 'user.expired',
          entity_type: 'user',
          entity_id: expiredUser.id
        })
      );
    });

    it('should handle no expired users', async () => {
      vi.mocked(usersModule.getExpiredUsers).mockResolvedValue([]);
      vi.mocked(usersModule.deactivateExpiredUsers).mockResolvedValue(0);

      const result = await deactivateExpiredAccounts(mockDb, siteId);

      expect(result.deactivated).toBe(0);
      expect(result.users).toEqual([]);
      expect(notificationsModule.createNotification).not.toHaveBeenCalled();
      expect(activityLogsModule.createActivityLog).not.toHaveBeenCalled();
    });
  });

  describe('notifyExpiringAccounts', () => {
    it('should notify users whose accounts are expiring soon', async () => {
      const expiringUser: DBUser = {
        id: '2',
        site_id: '1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 50,
        last_login_at: now - 86400,
        last_login_ip: '127.0.0.1',
        expiration_date: now + 86400 * 5, // Expires in 5 days
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([expiringUser]);
      vi.mocked(notificationsModule.createNotification).mockResolvedValue({
        id: '2',
        user_id: '2',
        site_id: '1',
        type: 'account_expiring',
        title: 'Account Expiring Soon',
        message: 'Test',
        is_read: 0,
        read_at: null,
        created_at: now,
        priority: 'normal',
        metadata: null,
        action_url: null,
        expires_at: null
      });

      const result = await notifyExpiringAccounts(mockDb, siteId, 7);

      expect(result.notified).toBe(1);
      expect(result.users).toEqual([expiringUser]);
      expect(usersModule.getUsersExpiringSoon).toHaveBeenCalledWith(mockDb, siteId, 7);
      expect(notificationsModule.createNotification).toHaveBeenCalledWith(
        mockDb,
        siteId,
        expect.objectContaining({
          user_id: expiringUser.id,
          type: 'account_expiring',
          title: 'Account Expiring Soon',
          priority: 'normal'
        })
      );
    });

    it('should use high priority for users expiring in 3 days or less', async () => {
      const urgentExpiringUser: DBUser = {
        id: '3',
        site_id: '1',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 50,
        last_login_at: now - 86400,
        last_login_ip: '127.0.0.1',
        expiration_date: now + 86400 * 2, // Expires in 2 days
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([urgentExpiringUser]);
      vi.mocked(notificationsModule.createNotification).mockResolvedValue({
        id: '3',
        user_id: '3',
        site_id: '1',
        type: 'account_expiring',
        title: 'Account Expiring Soon',
        message: 'Test',
        is_read: 0,
        read_at: null,
        created_at: now,
        priority: 'high',
        metadata: null,
        action_url: null,
        expires_at: null
      });

      await notifyExpiringAccounts(mockDb, siteId, 7);

      expect(notificationsModule.createNotification).toHaveBeenCalledWith(
        mockDb,
        siteId,
        expect.objectContaining({
          priority: 'high'
        })
      );
    });

    it('should skip users without expiration dates', async () => {
      const userWithoutExpiration: DBUser = {
        id: '4',
        site_id: '1',
        name: 'Alice Brown',
        email: 'alice@example.com',
        password_hash: 'hashed',
        role: 'admin',
        status: 'active',
        created_at: now - 86400 * 50,
        last_login_at: now - 86400,
        last_login_ip: '127.0.0.1',
        expiration_date: null, // No expiration
        grace_period_days: 0,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([userWithoutExpiration]);

      const result = await notifyExpiringAccounts(mockDb, siteId, 7);

      expect(result.notified).toBe(0);
      expect(result.users).toEqual([userWithoutExpiration]);
      expect(notificationsModule.createNotification).not.toHaveBeenCalled();
    });

    it('should handle no expiring users', async () => {
      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([]);

      const result = await notifyExpiringAccounts(mockDb, siteId, 7);

      expect(result.notified).toBe(0);
      expect(result.users).toEqual([]);
      expect(notificationsModule.createNotification).not.toHaveBeenCalled();
    });

    it('should format message correctly for singular day', async () => {
      const expiringInOneDay: DBUser = {
        id: '5',
        site_id: '1',
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 50,
        last_login_at: now - 86400,
        last_login_ip: '127.0.0.1',
        expiration_date: now + 86400, // Expires in 1 day
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([expiringInOneDay]);
      vi.mocked(notificationsModule.createNotification).mockResolvedValue({
        id: '5',
        user_id: '5',
        site_id: '1',
        type: 'account_expiring',
        title: 'Account Expiring Soon',
        message: 'Test',
        is_read: 0,
        read_at: null,
        created_at: now,
        priority: 'high',
        metadata: null,
        action_url: null,
        expires_at: null
      });

      await notifyExpiringAccounts(mockDb, siteId, 7);

      expect(notificationsModule.createNotification).toHaveBeenCalledWith(
        mockDb,
        siteId,
        expect.objectContaining({
          message: expect.stringContaining('1 day')
        })
      );
    });
  });

  describe('runExpirationCheck', () => {
    it('should run complete expiration check process', async () => {
      const expiringUser: DBUser = {
        id: '6',
        site_id: '1',
        name: 'Eve Wilson',
        email: 'eve@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 50,
        last_login_at: now - 86400,
        last_login_ip: '127.0.0.1',
        expiration_date: now + 86400 * 5,
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      const expiredUser: DBUser = {
        id: '7',
        site_id: '1',
        name: 'Frank Miller',
        email: 'frank@example.com',
        password_hash: 'hashed',
        role: 'customer',
        status: 'active',
        created_at: now - 86400 * 100,
        last_login_at: now - 86400 * 10,
        last_login_ip: '127.0.0.1',
        expiration_date: now - 86400 * 5,
        grace_period_days: 3,
        permissions: '[]',
        updated_at: now,
        created_by: null,
        updated_by: null
      };

      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([expiringUser]);
      vi.mocked(usersModule.getExpiredUsers).mockResolvedValue([expiredUser]);
      vi.mocked(usersModule.deactivateExpiredUsers).mockResolvedValue(1);
      vi.mocked(notificationsModule.createNotification).mockResolvedValue({
        id: '8',
        user_id: '1',
        site_id: '1',
        type: 'account_expiring',
        title: 'Test',
        message: 'Test',
        is_read: 0,
        read_at: null,
        created_at: now,
        priority: 'normal',
        metadata: null,
        action_url: null,
        expires_at: null
      });
      vi.mocked(activityLogsModule.createActivityLog).mockResolvedValue({
        id: '9',
        site_id: '1',
        user_id: null,
        action: 'user.expired',
        entity_type: 'user',
        entity_id: '1',
        entity_name: 'Test',
        description: 'Test',
        metadata: null,
        severity: 'warning',
        created_at: now,
        ip_address: null,
        user_agent: null
      });

      const result = await runExpirationCheck(mockDb, siteId, 7);

      expect(result.notified).toBe(1);
      expect(result.deactivated).toBe(1);
      expect(result.expiringUsers).toEqual([expiringUser]);
      expect(result.expiredUsers).toEqual([expiredUser]);
      expect(usersModule.getUsersExpiringSoon).toHaveBeenCalledWith(mockDb, siteId, 7);
      expect(usersModule.getExpiredUsers).toHaveBeenCalledWith(mockDb, siteId);
      expect(usersModule.deactivateExpiredUsers).toHaveBeenCalledWith(mockDb, siteId);
    });

    it('should use default notification days ahead if not provided', async () => {
      vi.mocked(usersModule.getUsersExpiringSoon).mockResolvedValue([]);
      vi.mocked(usersModule.getExpiredUsers).mockResolvedValue([]);
      vi.mocked(usersModule.deactivateExpiredUsers).mockResolvedValue(0);

      await runExpirationCheck(mockDb, siteId);

      expect(usersModule.getUsersExpiringSoon).toHaveBeenCalledWith(mockDb, siteId, 7);
    });
  });
});
