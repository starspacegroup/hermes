import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './+server';
import type { AIChatMessage } from '$lib/types/ai-chat';
import type { RequestHandler } from './$types';

type ExtractRequestEvent<T> = T extends (event: infer E) => unknown ? E : never;
type MockRequestEvent = ExtractRequestEvent<RequestHandler>;

interface MockDB {
  prepare: ReturnType<typeof vi.fn>;
}

interface MockPlatform {
  env: {
    DB: MockDB;
  };
}

interface MockLocals {
  currentUser: {
    id: string;
    role: string;
  } | null;
  siteId: string;
}

describe('POST /api/ai-chat/sessions/message', () => {
  let mockDB: MockDB;
  let mockPlatform: MockPlatform;
  let mockLocals: MockLocals;

  beforeEach(() => {
    // Reset mocks
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn(),
          run: vi.fn(),
          all: vi.fn()
        })
      })
    };

    mockPlatform = {
      env: {
        DB: mockDB
      }
    };

    mockLocals = {
      currentUser: {
        id: 'user-123',
        role: 'admin'
      },
      siteId: 'site-456'
    };
  });

  it('adds message to session successfully', async () => {
    // Mock first call to getAISession (check session exists and belongs to user)
    mockDB
      .prepare()
      .bind()
      .first.mockResolvedValueOnce({
        id: 'session-789',
        user_id: 'user-123',
        site_id: 'site-456',
        title: 'Test Session',
        messages: JSON.stringify([]),
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now()
      });

    // Mock second call to getAISession (inside addMessageToSession)
    mockDB
      .prepare()
      .bind()
      .first.mockResolvedValueOnce({
        id: 'session-789',
        user_id: 'user-123',
        site_id: 'site-456',
        title: 'Test Session',
        messages: JSON.stringify([]),
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now()
      });

    // Mock message update
    mockDB.prepare().bind().run.mockResolvedValueOnce({ success: true });

    const message: AIChatMessage = {
      role: 'assistant',
      content: 'Product created successfully!',
      timestamp: Date.now(),
      productLink: {
        productId: 'prod-123',
        productName: 'Test Product'
      }
    };

    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'session-789',
        message
      })
    });

    const response = await POST({
      request,
      platform: mockPlatform,
      locals: mockLocals
    } as unknown as MockRequestEvent);

    expect(response.status).toBe(200);
    const result = (await response.json()) as { success: boolean; };
    expect(result.success).toBe(true);
  });

  it('returns 401 if user is not authenticated', async () => {
    const localsWithNoAuth = {
      currentUser: null,
      siteId: 'site-456'
    };

    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-789', message: {} })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: localsWithNoAuth
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });

  it('returns 403 if user is not admin', async () => {
    const localsNotAdmin = {
      currentUser: { id: 'user-123', role: 'customer' },
      siteId: 'site-456'
    };

    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-789', message: {} })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: localsNotAdmin
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });

  it('returns 400 if sessionId is missing', async () => {
    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: {} })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });

  it('returns 400 if message is missing', async () => {
    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-789' })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });

  it('returns 404 if session does not exist', async () => {
    // Mock session not found
    mockDB.prepare().bind().first.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'nonexistent-session',
        message: { role: 'user', content: 'test', timestamp: Date.now() }
      })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });

  it('returns 403 if session belongs to different user', async () => {
    // Mock session exists but belongs to different user
    mockDB
      .prepare()
      .bind()
      .first.mockResolvedValueOnce({
        id: 'session-789',
        user_id: 'other-user',
        site_id: 'site-456',
        title: 'Test Session',
        messages: JSON.stringify([]),
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now()
      });

    const request = new Request('http://localhost/api/ai-chat/sessions/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-789',
        message: { role: 'user', content: 'test', timestamp: Date.now() }
      })
    });

    await expect(
      POST({
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as MockRequestEvent)
    ).rejects.toThrow();
  });
});
