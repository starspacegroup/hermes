import { describe, it, expect, vi } from 'vitest';
import {
  getUserById,
  getUserByEmail,
  getAllUsers,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  type DBUser,
  type CreateUserData,
  type UpdateUserData
} from './users';

describe('Users Repository', () => {
  const siteId = 'test-site';
  const mockUser: DBUser = {
    id: 'user-1',
    site_id: siteId,
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hashed_password',
    role: 'customer',
    created_at: 1234567890,
    updated_at: 1234567890
  };

  describe('getUserById', () => {
    it('should get user by ID scoped by site', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUserById(mockDB, siteId, 'user-1');

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ? AND site_id = ?');
      expect(mockBind).toHaveBeenCalledWith('user-1', siteId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUserById(mockDB, siteId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email scoped by site', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUserByEmail(mockDB, siteId, 'test@example.com');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('test@example.com', siteId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUserByEmail(mockDB, siteId, 'nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should get all users for a site', async () => {
      const mockResults = { results: [mockUser], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getAllUsers(mockDB, siteId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE site_id = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual([mockUser]);
    });

    it('should return empty array when no users found', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getAllUsers(mockDB, siteId);

      expect(result).toEqual([]);
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role scoped by site', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      const mockResults = { results: [adminUser], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUsersByRole(mockDB, siteId, 'admin');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE site_id = ? AND role = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'admin');
      expect(result).toEqual([adminUser]);
    });

    it('should return empty array when no users with role found', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getUsersByRole(mockDB, siteId, 'admin');

      expect(result).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create a new user with all fields', async () => {
      const userData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        password_hash: 'hashed_password',
        role: 'admin'
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBindGet = vi.fn().mockReturnValue({ first: mockFirst });

      const mockDB = {
        prepare: vi
          .fn()
          .mockReturnValueOnce({ bind: mockBind })
          .mockReturnValueOnce({ bind: mockBindGet })
      } as unknown as D1Database;

      const result = await createUser(mockDB, siteId, userData);

      expect(result).toEqual(mockUser);
    });

    it('should create user with default role', async () => {
      const userData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        password_hash: 'hashed_password'
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBindGet = vi.fn().mockReturnValue({ first: mockFirst });

      const mockDB = {
        prepare: vi
          .fn()
          .mockReturnValueOnce({ bind: mockBind })
          .mockReturnValueOnce({ bind: mockBindGet })
      } as unknown as D1Database;

      const result = await createUser(mockDB, siteId, userData);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when user creation fails', async () => {
      const userData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User',
        password_hash: 'hashed_password'
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBindGet = vi.fn().mockReturnValue({ first: mockFirst });

      const mockDB = {
        prepare: vi
          .fn()
          .mockReturnValueOnce({ bind: mockBind })
          .mockReturnValueOnce({ bind: mockBindGet })
      } as unknown as D1Database;

      await expect(createUser(mockDB, siteId, userData)).rejects.toThrow('Failed to create user');
    });
  });

  describe('updateUser', () => {
    it('should update user with all fields', async () => {
      const updateData: UpdateUserData = {
        email: 'updated@example.com',
        name: 'Updated User',
        password_hash: 'new_hash',
        role: 'admin'
      };

      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBindGet = vi.fn().mockReturnValue({ first: mockFirst });
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindUpdate = vi.fn().mockReturnValue({ run: mockRun });

      const mockDB = {
        prepare: vi
          .fn()
          .mockReturnValueOnce({ bind: mockBindGet })
          .mockReturnValueOnce({ bind: mockBindUpdate })
          .mockReturnValueOnce({ bind: mockBindGet })
      } as unknown as D1Database;

      const result = await updateUser(mockDB, siteId, 'user-1', updateData);

      expect(result).toEqual(mockUser);
    });

    it('should update user with partial fields', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated User'
      };

      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBindGet = vi.fn().mockReturnValue({ first: mockFirst });
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindUpdate = vi.fn().mockReturnValue({ run: mockRun });

      const mockDB = {
        prepare: vi
          .fn()
          .mockReturnValueOnce({ bind: mockBindGet })
          .mockReturnValueOnce({ bind: mockBindUpdate })
          .mockReturnValueOnce({ bind: mockBindGet })
      } as unknown as D1Database;

      const result = await updateUser(mockDB, siteId, 'user-1', updateData);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockDB = {
        prepare: vi.fn().mockReturnValue({ bind: mockBind })
      } as unknown as D1Database;

      const result = await updateUser(mockDB, siteId, 'nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });

    it('should return user unchanged when no updates provided', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockUser);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockDB = {
        prepare: vi.fn().mockReturnValue({ bind: mockBind })
      } as unknown as D1Database;

      const result = await updateUser(mockDB, siteId, 'user-1', {});

      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user scoped by site', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 }, success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteUser(mockDB, siteId, 'user-1');

      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM users WHERE id = ? AND site_id = ?');
      expect(mockBind).toHaveBeenCalledWith('user-1', siteId);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 }, success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteUser(mockDB, siteId, 'nonexistent');

      expect(result).toBe(false);
    });
  });
});
