/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User } from '$lib/stores/auth';
import { POST } from '../src/routes/api/auth/login/+server';

interface MockDB {
  prepare: ReturnType<typeof vi.fn>;
}

interface MockPlatform {
  env: {
    DB: MockDB;
  };
}

interface MockLocals {
  siteId: string;
}

interface MockCookies {
  set: ReturnType<typeof vi.fn>;
}

interface MockRequest {
  json: ReturnType<typeof vi.fn>;
  headers: {
    get: ReturnType<typeof vi.fn>;
  };
}

interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

describe('Login API', () => {
  let mockDB: MockDB;
  let mockPlatform: MockPlatform;
  let mockLocals: MockLocals;
  let mockCookies: MockCookies;
  let mockRequest: MockRequest;

  beforeEach(() => {
    // Mock database
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn(),
          run: vi.fn()
        })
      })
    };

    // Mock platform
    mockPlatform = {
      env: {
        DB: mockDB
      }
    };

    // Mock locals
    mockLocals = {
      siteId: 'test-site'
    };

    // Mock cookies
    mockCookies = {
      set: vi.fn()
    };

    // Mock getUserByEmail to return null by default
    vi.mock('$lib/server/db', () => ({
      getDB: () => mockDB,
      getUserByEmail: vi.fn().mockResolvedValue(null)
    }));

    // Mock activity logger
    vi.mock('$lib/server/activity-logger', () => ({
      logActivity: vi.fn().mockResolvedValue(undefined)
    }));
  });

  describe('password validation', () => {
    it('should authenticate user with correct password', async () => {
      const { getUserByEmail } = await import('$lib/server/db');

      // Mock user in database with hashed password "123123123"
      // SHA-256 hash of "123123123"
      const encoder = new TextEncoder();
      const data = encoder.encode('123123123');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      vi.mocked(getUserByEmail).mockResolvedValue({
        id: 'user-test',
        site_id: 'test-site',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: passwordHash,
        role: 'user',
        permissions: '[]',
        status: 'active',
        expiration_date: null,
        grace_period_days: 0,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        created_by: null,
        updated_by: null
      });

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: '123123123'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(mockCookies.set).toHaveBeenCalledWith(
        'user_session',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should reject user with incorrect password', async () => {
      const { getUserByEmail } = await import('$lib/server/db');

      // Mock user with different password
      const encoder = new TextEncoder();
      const data = encoder.encode('different-password');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      vi.mocked(getUserByEmail).mockResolvedValue({
        id: 'user-test',
        site_id: 'test-site',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: passwordHash,
        role: 'user',
        permissions: '[]',
        status: 'active',
        expiration_date: null,
        grace_period_days: 0,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        created_by: null,
        updated_by: null
      });

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: '123123123'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(response.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const { getUserByEmail } = await import('$lib/server/db');

      vi.mocked(getUserByEmail).mockResolvedValue(null);

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'nonexistent@example.com',
          password: 'password123'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(response.status).toBe(401);
    });
  });

  describe('account status validation', () => {
    it('should reject inactive user', async () => {
      const { getUserByEmail } = await import('$lib/server/db');

      const encoder = new TextEncoder();
      const data = encoder.encode('password');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      vi.mocked(getUserByEmail).mockResolvedValue({
        id: 'user-test',
        site_id: 'test-site',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: passwordHash,
        role: 'user',
        permissions: '[]',
        status: 'inactive',
        expiration_date: null,
        grace_period_days: 0,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        created_by: null,
        updated_by: null
      });

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toContain('inactive');
      expect(response.status).toBe(403);
    });

    it('should reject expired user', async () => {
      const { getUserByEmail } = await import('$lib/server/db');

      const encoder = new TextEncoder();
      const data = encoder.encode('password');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Set expiration date to past
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday

      vi.mocked(getUserByEmail).mockResolvedValue({
        id: 'user-test',
        site_id: 'test-site',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: passwordHash,
        role: 'user',
        permissions: '[]',
        status: 'active',
        expiration_date: pastDate,
        grace_period_days: 0,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        created_by: null,
        updated_by: null
      });

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
      expect(response.status).toBe(403);
    });
  });

  describe('input validation', () => {
    it('should require email', async () => {
      mockRequest = {
        json: vi.fn().mockResolvedValue({
          password: 'password123'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
      expect(response.status).toBe(400);
    });

    it('should require password', async () => {
      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com'
        }),
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      };

      const response = await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      const result = (await response.json()) as LoginResponse;

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
      expect(response.status).toBe(400);
    });
  });

  describe('activity logging', () => {
    it('should log successful login', async () => {
      const { getUserByEmail } = await import('$lib/server/db');
      const { logActivity } = await import('$lib/server/activity-logger');

      // Mock user in database
      const encoder = new TextEncoder();
      const data = encoder.encode('password123');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      vi.mocked(getUserByEmail).mockResolvedValue({
        id: 'user-123',
        site_id: 'test-site',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: passwordHash,
        role: 'customer',
        permissions: '[]',
        status: 'active',
        expiration_date: null,
        grace_period_days: 0,
        last_login_at: null,
        last_login_ip: null,
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        created_by: null,
        updated_by: null
      });

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'cf-connecting-ip') return '192.168.1.1';
            if (header === 'user-agent') return 'Mozilla/5.0';
            return null;
          })
        }
      };

      await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      expect(logActivity).toHaveBeenCalledWith(mockDB, {
        siteId: 'test-site',
        userId: 'user-123',
        action: 'user.login',
        entityType: 'user',
        entityId: 'user-123',
        entityName: 'Test User',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { method: 'password' }
      });
    });

    it('should log failed login attempt', async () => {
      const { getUserByEmail } = await import('$lib/server/db');
      const { logActivity } = await import('$lib/server/activity-logger');

      vi.mocked(getUserByEmail).mockResolvedValue(null);

      mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'cf-connecting-ip') return '192.168.1.100';
            if (header === 'user-agent') return 'Mozilla/5.0';
            return null;
          })
        }
      };

      await POST({
        request: mockRequest,
        cookies: mockCookies,
        platform: mockPlatform,
        locals: mockLocals
      } as any);

      expect(logActivity).toHaveBeenCalledWith(mockDB, {
        siteId: 'test-site',
        userId: null,
        action: 'user.login_failed',
        entityType: 'user',
        entityId: null,
        entityName: null,
        description: 'Failed login attempt for nonexistent@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        metadata: { email: 'nonexistent@example.com', reason: 'invalid_credentials' },
        severity: 'warning'
      });
    });
  });
});
