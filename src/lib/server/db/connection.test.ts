import { describe, it, expect, vi } from 'vitest';
import {
  getDB,
  execute,
  executeOne,
  executeRow,
  executeBatch,
  runMigrations,
  generateId,
  getCurrentTimestamp
} from './connection';

describe('Database Connection Utilities', () => {
  describe('getDB', () => {
    it('should return database from platform', () => {
      const mockDB = {} as D1Database;
      const platform = {
        env: { DB: mockDB },
        context: {} as ExecutionContext,
        caches: {} as CacheStorage & { default: Cache }
      };

      const db = getDB(platform);
      expect(db).toBe(mockDB);
    });

    it('should throw error when DB is not available', () => {
      expect(() => getDB(undefined)).toThrow('D1 database is not available');
    });

    it('should throw error when platform.env.DB is undefined', () => {
      const platform = {
        env: {} as { DB: D1Database },
        context: {} as ExecutionContext,
        caches: {} as CacheStorage & { default: Cache }
      };

      expect(() => getDB(platform)).toThrow('D1 database is not available');
    });
  });

  describe('execute', () => {
    it('should execute SQL query with parameters', async () => {
      const mockResult = { results: [{ id: '1' }], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await execute(mockDB, 'SELECT * FROM users WHERE id = ?', ['1']);

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?');
      expect(mockBind).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });

    it('should execute SQL query without parameters', async () => {
      const mockResult = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResult);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await execute(mockDB, 'SELECT * FROM users');

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM users');
      expect(mockBind).toHaveBeenCalledWith();
    });
  });

  describe('executeOne', () => {
    it('should return first result from query', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await executeOne(mockDB, 'SELECT * FROM users WHERE id = ?', ['1']);

      expect(result).toEqual(mockUser);
    });

    it('should return null when no result found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await executeOne(mockDB, 'SELECT * FROM users WHERE id = ?', ['999']);

      expect(result).toBeNull();
    });
  });

  describe('executeRow', () => {
    it('should return first result from query', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await executeRow(mockDB, 'SELECT * FROM users WHERE id = ?', ['1']);

      expect(result).toEqual(mockUser);
    });

    it('should return null when no result found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await executeRow(mockDB, 'SELECT * FROM users WHERE id = ?', ['999']);

      expect(result).toBeNull();
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple statements', async () => {
      const mockResults = [
        { results: [], success: true },
        { results: [], success: true }
      ];
      const mockBatch = vi.fn().mockResolvedValue(mockResults);
      const mockBind1 = vi.fn().mockReturnThis();
      const mockBind2 = vi.fn().mockReturnThis();
      const mockPrepare = vi
        .fn()
        .mockReturnValueOnce({ bind: mockBind1 })
        .mockReturnValueOnce({ bind: mockBind2 });
      const mockDB = { prepare: mockPrepare, batch: mockBatch } as unknown as D1Database;

      const statements = [
        { sql: 'INSERT INTO users (id, name) VALUES (?, ?)', params: ['1', 'User 1'] },
        { sql: 'INSERT INTO users (id, name) VALUES (?, ?)', params: ['2', 'User 2'] }
      ];

      const results = await executeBatch(mockDB, statements);

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockBind1).toHaveBeenCalledWith('1', 'User 1');
      expect(mockBind2).toHaveBeenCalledWith('2', 'User 2');
      expect(results).toEqual(mockResults);
    });

    it('should handle statements without parameters', async () => {
      const mockResults = [{ results: [], success: true }];
      const mockBatch = vi.fn().mockResolvedValue(mockResults);
      const mockPrepare = vi.fn().mockReturnThis();
      const mockDB = { prepare: mockPrepare, batch: mockBatch } as unknown as D1Database;

      const statements = [{ sql: 'DELETE FROM users' }];

      await executeBatch(mockDB, statements);

      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM users');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of reasonable length', () => {
      const id = generateId();

      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return Unix timestamp in seconds', () => {
      const timestamp = getCurrentTimestamp();
      const now = Math.floor(Date.now() / 1000);

      expect(timestamp).toBeGreaterThanOrEqual(now - 1);
      expect(timestamp).toBeLessThanOrEqual(now + 1);
    });
  });

  describe('runMigrations', () => {
    it('should run single migration', async () => {
      const migration = 'CREATE TABLE test (id TEXT);';
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await runMigrations(mockDB, [migration]);

      expect(mockPrepare).toHaveBeenCalledWith('CREATE TABLE test (id TEXT)');
      expect(mockRun).toHaveBeenCalled();
    });

    it('should run multiple migrations', async () => {
      const migrations = ['CREATE TABLE test1 (id TEXT);', 'CREATE TABLE test2 (id TEXT);'];
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await runMigrations(mockDB, migrations);

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should split migration into multiple statements', async () => {
      const migration = 'CREATE TABLE test1 (id TEXT); CREATE TABLE test2 (id TEXT);';
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await runMigrations(mockDB, [migration]);

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockPrepare).toHaveBeenCalledWith('CREATE TABLE test1 (id TEXT)');
      expect(mockPrepare).toHaveBeenCalledWith('CREATE TABLE test2 (id TEXT)');
    });

    it('should filter empty statements', async () => {
      const migration = 'CREATE TABLE test (id TEXT);;;';
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await runMigrations(mockDB, [migration]);

      expect(mockPrepare).toHaveBeenCalledTimes(1);
      expect(mockPrepare).toHaveBeenCalledWith('CREATE TABLE test (id TEXT)');
    });

    it('should handle migration with newlines and spacing', async () => {
      const migration = `
        CREATE TABLE test (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
      `;
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await runMigrations(mockDB, [migration]);

      expect(mockPrepare).toHaveBeenCalledTimes(1);
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
