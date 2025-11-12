import { describe, it, expect, vi } from 'vitest';
import {
  createNotification,
  getNotificationById,
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteExpiredNotifications,
  type Notification
} from './notifications';

describe('Notifications Repository', () => {
  const siteId = 'test-site';
  const userId = 'user-1';

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        site_id: siteId,
        user_id: userId,
        type: 'account_expiring',
        title: 'Account Expiring Soon',
        message: 'Your account will expire in 7 days',
        metadata: null,
        is_read: 0,
        read_at: null,
        priority: 'normal',
        action_url: null,
        created_at: 1234567890,
        expires_at: null
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockFirst = vi.fn().mockResolvedValue(mockNotification);
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

      const result = await createNotification(mockDB, siteId, {
        user_id: userId,
        type: 'account_expiring',
        title: 'Account Expiring Soon',
        message: 'Your account will expire in 7 days'
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotificationById', () => {
    it('should get a notification by ID', async () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        site_id: siteId,
        user_id: userId,
        type: 'account_expiring',
        title: 'Test',
        message: 'Test message',
        metadata: null,
        is_read: 0,
        read_at: null,
        priority: 'normal',
        action_url: null,
        created_at: 1234567890,
        expires_at: null
      };

      const mockFirst = vi.fn().mockResolvedValue(mockNotification);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getNotificationById(mockDB, siteId, 'notif-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM notifications WHERE id = ? AND site_id = ?'
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUserNotifications', () => {
    it('should get all notifications for a user', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          site_id: siteId,
          user_id: userId,
          type: 'account_expiring',
          title: 'Test',
          message: 'Test message',
          metadata: null,
          is_read: 0,
          read_at: null,
          priority: 'normal',
          action_url: null,
          created_at: 1234567890,
          expires_at: null
        }
      ];

      const mockResults = { results: mockNotifications, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUserNotifications(mockDB, siteId, userId, 50, 0);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND user_id = ?')
      );
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should get unread notifications for a user', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          site_id: siteId,
          user_id: userId,
          type: 'account_expiring',
          title: 'Test',
          message: 'Test message',
          metadata: null,
          is_read: 0,
          read_at: null,
          priority: 'urgent',
          action_url: null,
          created_at: 1234567890,
          expires_at: null
        }
      ];

      const mockResults = { results: mockNotifications, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUnreadNotifications(mockDB, siteId, userId);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND user_id = ? AND is_read = 0')
      );
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockResult = { meta: { changes: 1 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await markNotificationAsRead(mockDB, siteId, 'notif-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND site_id = ?'
      );
      expect(result).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockResult = { meta: { changes: 5 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await markAllNotificationsAsRead(mockDB, siteId, userId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'UPDATE notifications SET is_read = 1, read_at = ? WHERE site_id = ? AND user_id = ? AND is_read = 0'
      );
      expect(result).toBe(5);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const mockResult = { meta: { changes: 1 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteNotification(mockDB, siteId, 'notif-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM notifications WHERE id = ? AND site_id = ?'
      );
      expect(result).toBe(true);
    });
  });

  describe('deleteExpiredNotifications', () => {
    it('should delete expired notifications', async () => {
      const mockResult = { meta: { changes: 3 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteExpiredNotifications(mockDB, siteId);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND expires_at IS NOT NULL AND expires_at < ?')
      );
      expect(result).toBe(3);
    });
  });
});
