import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

describe('Activity Logs Page Server', () => {
  let mockPlatform: any;
  let mockCookies: any;
  let mockLocals: any;

  beforeEach(() => {
    mockPlatform = {
      env: {
        DB: {
          prepare: vi.fn().mockReturnValue({
            bind: vi.fn().mockReturnValue({
              all: vi.fn().mockResolvedValue({
                results: [
                  {
                    id: 'log-1',
                    site_id: 'site-1',
                    user_id: 'user-1',
                    action: 'user.created',
                    entity_type: 'user',
                    entity_id: 'user-2',
                    entity_name: 'Test User',
                    description: 'Created a new user',
                    metadata: '{"email":"test@example.com"}',
                    ip_address: '192.168.1.1',
                    user_agent: 'Mozilla/5.0',
                    severity: 'info',
                    created_at: 1234567890
                  }
                ]
              })
            })
          })
        }
      }
    };

    mockCookies = {
      get: vi.fn().mockReturnValue(
        encodeURIComponent(
          JSON.stringify({
            id: 'user-1',
            role: 'admin',
            permissions: '["logs:read", "logs:export"]',
            status: 'active',
            expiration_date: null
          })
        )
      )
    };

    mockLocals = {
      siteId: 'site-1'
    };
  });

  it('should load activity logs for users with logs:read permission', async () => {
    const result = await load({
      platform: mockPlatform,
      cookies: mockCookies,
      locals: mockLocals,
      url: new URL('http://localhost/admin/activity-logs')
    } as any);

    expect(result.logs).toBeDefined();
    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.logs[0].action).toBe('user.created');
  });

  it('should throw 401 error when not authenticated', async () => {
    mockCookies.get.mockReturnValue(null);

    await expect(
      load({
        platform: mockPlatform,
        cookies: mockCookies,
        locals: mockLocals,
        url: new URL('http://localhost/admin/activity-logs')
      } as any)
    ).rejects.toThrow();
  });

  it('should parse filter parameters from URL', async () => {
    const url = new URL('http://localhost/admin/activity-logs?user_id=user-123&action=user.updated');
    
    const result = await load({
      platform: mockPlatform,
      cookies: mockCookies,
      locals: mockLocals,
      url
    } as any);

    expect(result.filters).toBeDefined();
    expect(result.filters.user_id).toBe('user-123');
    expect(result.filters.action).toBe('user.updated');
  });

  it('should parse metadata from JSON strings', async () => {
    const result = await load({
      platform: mockPlatform,
      cookies: mockCookies,
      locals: mockLocals,
      url: new URL('http://localhost/admin/activity-logs')
    } as any);

    expect(result.logs[0].metadata).toEqual({ email: 'test@example.com' });
  });
});
