import { describe, it, expect, vi } from 'vitest';
import {
  createActivityLog,
  getActivityLogs,
  getActivityLogsByUser,
  getActivityLogsByEntity,
  deleteOldActivityLogs,
  type ActivityLog,
  type CreateActivityLogData
} from './activity-logs';

describe('Activity Logs Repository', () => {
  const siteId = 'test-site';

  describe('createActivityLog', () => {
    it('should create a new activity log', async () => {
      const mockLog: ActivityLog = {
        id: 'log-1',
        site_id: siteId,
        user_id: 'user-1',
        action: 'order.created',
        entity_type: 'order',
        entity_id: 'order-123',
        entity_name: 'Order #123',
        description: 'Created a new order',
        metadata: '{}',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        severity: 'info',
        created_at: 1234567890
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockFirst = vi.fn().mockResolvedValue(mockLog);
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

      const result = await createActivityLog(mockDB, siteId, {
        user_id: 'user-1',
        action: 'order.created',
        entity_type: 'order',
        entity_id: 'order-123',
        entity_name: 'Order #123',
        description: 'Created a new order',
        metadata: {},
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        severity: 'info'
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('getActivityLogs', () => {
    it('should get activity logs with filters', async () => {
      const mockLogs: ActivityLog[] = [
        {
          id: 'log-1',
          site_id: siteId,
          user_id: 'user-1',
          action: 'order.created',
          entity_type: 'order',
          entity_id: 'order-123',
          entity_name: 'Order #123',
          description: 'Created a new order',
          metadata: null,
          ip_address: null,
          user_agent: null,
          severity: 'info',
          created_at: 1234567890
        }
      ];
      const mockResults = { results: mockLogs, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getActivityLogs(mockDB, siteId, {
        limit: 50,
        offset: 0
      });

      expect(mockPrepare).toHaveBeenCalled();
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getActivityLogsByUser', () => {
    it('should get activity logs for a specific user', async () => {
      const mockLogs: ActivityLog[] = [
        {
          id: 'log-1',
          site_id: siteId,
          user_id: 'user-1',
          action: 'order.created',
          entity_type: 'order',
          entity_id: 'order-123',
          entity_name: null,
          description: null,
          metadata: null,
          ip_address: null,
          user_agent: null,
          severity: 'info',
          created_at: 1234567890
        }
      ];
      const mockResults = { results: mockLogs, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getActivityLogsByUser(mockDB, siteId, 'user-1', 50, 0);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND user_id = ?')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'user-1', 50, 0);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getActivityLogsByEntity', () => {
    it('should get activity logs for a specific entity', async () => {
      const mockLogs: ActivityLog[] = [
        {
          id: 'log-1',
          site_id: siteId,
          user_id: 'user-1',
          action: 'order.created',
          entity_type: 'order',
          entity_id: 'order-123',
          entity_name: null,
          description: null,
          metadata: null,
          ip_address: null,
          user_agent: null,
          severity: 'info',
          created_at: 1234567890
        }
      ];
      const mockResults = { results: mockLogs, success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getActivityLogsByEntity(mockDB, siteId, 'order', 'order-123', 50, 0);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND entity_type = ? AND entity_id = ?')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'order', 'order-123', 50, 0);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('deleteOldActivityLogs', () => {
    it('should delete old activity logs', async () => {
      const mockResult = { meta: { changes: 10 }, success: true };
      const mockRun = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteOldActivityLogs(mockDB, siteId, 90);

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM activity_logs WHERE site_id = ? AND created_at < ?'
      );
      expect(result).toBe(10);
    });
  });
});
