import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import {
  createAISession,
  getAISession,
  getUserAISessions,
  updateAISessionMessages,
  addMessageToSession,
  updateAISessionTitle,
  updateAISessionContext,
  updateAISessionStatus,
  deleteAISession,
  deleteExpiredAISessions
} from './ai-sessions';
import type { AIChatMessage, AISessionContext } from '$lib/types/ai-chat';

describe('AI Sessions Database Operations', () => {
  let mockDb: D1Database;
  let mockPrepare: ReturnType<typeof vi.fn>;
  let mockBind: ReturnType<typeof vi.fn>;
  let mockRun: ReturnType<typeof vi.fn>;
  let mockFirst: ReturnType<typeof vi.fn>;
  let mockAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRun = vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } });
    mockFirst = vi.fn();
    mockAll = vi.fn();
    mockBind = vi.fn().mockReturnValue({
      run: mockRun,
      first: mockFirst,
      all: mockAll
    });
    mockPrepare = vi.fn().mockReturnValue({
      bind: mockBind
    });
    mockDb = {
      prepare: mockPrepare
    } as unknown as D1Database;
  });

  describe('createAISession', () => {
    it('should create a new AI session with default title', async () => {
      const session = await createAISession(mockDb, 'site-1', 'user-1');

      expect(session).toMatchObject({
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'New Conversation',
        messages: [],
        status: 'active'
      });
      expect(session.id).toBeDefined();
      expect(session.created_at).toBeDefined();
      expect(session.expires_at).toBeDefined();
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ai_sessions'));
    });

    it('should create a new AI session with custom title', async () => {
      const session = await createAISession(mockDb, 'site-1', 'user-1', 'Product Discussion');

      expect(session.title).toBe('Product Discussion');
    });
  });

  describe('getAISession', () => {
    it('should return AI session when found', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'Test Session',
        messages: '[]',
        context: null,
        status: 'active',
        created_at: 1000000,
        updated_at: 1000000,
        expires_at: 2000000
      };
      mockFirst.mockResolvedValue(mockSession);

      const session = await getAISession(mockDb, 'site-1', 'session-1');

      expect(session).toMatchObject({
        id: 'session-1',
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'Test Session',
        messages: [],
        status: 'active'
      });
      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM ai_sessions WHERE id = ? AND site_id = ?'
      );
    });

    it('should return null when session not found', async () => {
      mockFirst.mockResolvedValue(null);

      const session = await getAISession(mockDb, 'site-1', 'nonexistent');

      expect(session).toBeNull();
    });

    it('should parse messages JSON correctly', async () => {
      const messages: AIChatMessage[] = [
        { role: 'user', content: 'Hello', timestamp: 1000 },
        { role: 'assistant', content: 'Hi there!', timestamp: 1001 }
      ];
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'Test',
        messages: JSON.stringify(messages),
        context: null,
        status: 'active',
        created_at: 1000000,
        updated_at: 1000000,
        expires_at: null
      };
      mockFirst.mockResolvedValue(mockSession);

      const session = await getAISession(mockDb, 'site-1', 'session-1');

      expect(session?.messages).toEqual(messages);
    });

    it('should parse context JSON correctly', async () => {
      const context: AISessionContext = {
        draft_product_id: 'product-1',
        draft_revision_id: 'rev-1'
      };
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'Test',
        messages: '[]',
        context: JSON.stringify(context),
        status: 'active',
        created_at: 1000000,
        updated_at: 1000000,
        expires_at: null
      };
      mockFirst.mockResolvedValue(mockSession);

      const session = await getAISession(mockDb, 'site-1', 'session-1');

      expect(session?.context).toEqual(context);
    });
  });

  describe('getUserAISessions', () => {
    it('should return all sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          site_id: 'site-1',
          title: 'Session 1',
          messages: '[]',
          context: null,
          status: 'active',
          created_at: 1000000,
          updated_at: 1000000,
          expires_at: null
        },
        {
          id: 'session-2',
          user_id: 'user-1',
          site_id: 'site-1',
          title: 'Session 2',
          messages: '[]',
          context: null,
          status: 'completed',
          created_at: 1000001,
          updated_at: 1000001,
          expires_at: null
        }
      ];
      mockAll.mockResolvedValue({ results: mockSessions });

      const sessions = await getUserAISessions(mockDb, 'site-1', 'user-1');

      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[1].id).toBe('session-2');
    });

    it('should filter sessions by status', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          site_id: 'site-1',
          title: 'Active Session',
          messages: '[]',
          context: null,
          status: 'active',
          created_at: 1000000,
          updated_at: 1000000,
          expires_at: null
        }
      ];
      mockAll.mockResolvedValue({ results: mockSessions });

      await getUserAISessions(mockDb, 'site-1', 'user-1', 'active');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('AND status = ?')
      );
    });

    it('should return empty array when no sessions found', async () => {
      mockAll.mockResolvedValue({ results: [] });

      const sessions = await getUserAISessions(mockDb, 'site-1', 'user-1');

      expect(sessions).toEqual([]);
    });
  });

  describe('updateAISessionMessages', () => {
    it('should update session messages', async () => {
      const messages: AIChatMessage[] = [
        { role: 'user', content: 'Test message', timestamp: 1000 }
      ];

      await updateAISessionMessages(mockDb, 'site-1', 'session-1', messages);

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ai_sessions')
      );
      expect(mockBind).toHaveBeenCalledWith(
        JSON.stringify(messages),
        expect.any(Number),
        'session-1',
        'site-1'
      );
    });
  });

  describe('addMessageToSession', () => {
    it('should add a message to existing session', async () => {
      const existingSession = {
        id: 'session-1',
        user_id: 'user-1',
        site_id: 'site-1',
        title: 'Test',
        messages: JSON.stringify([{ role: 'user', content: 'First', timestamp: 1000 }]),
        context: null,
        status: 'active',
        created_at: 1000000,
        updated_at: 1000000,
        expires_at: null
      };
      mockFirst.mockResolvedValue(existingSession);

      const newMessage: AIChatMessage = {
        role: 'assistant',
        content: 'Second',
        timestamp: 1001
      };

      await addMessageToSession(mockDb, 'site-1', 'session-1', newMessage);

      // Should have been called twice: once for get, once for update
      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockBind).toHaveBeenLastCalledWith(
        expect.stringContaining('Second'),
        expect.any(Number),
        'session-1',
        'site-1'
      );
    });

    it('should throw error when session not found', async () => {
      mockFirst.mockResolvedValue(null);

      const message: AIChatMessage = {
        role: 'user',
        content: 'Test',
        timestamp: 1000
      };

      await expect(
        addMessageToSession(mockDb, 'site-1', 'nonexistent', message)
      ).rejects.toThrow('Session not found');
    });
  });

  describe('updateAISessionTitle', () => {
    it('should update session title', async () => {
      await updateAISessionTitle(mockDb, 'site-1', 'session-1', 'New Title');

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ai_sessions')
      );
      expect(mockBind).toHaveBeenCalledWith(
        'New Title',
        expect.any(Number),
        'session-1',
        'site-1'
      );
    });
  });

  describe('updateAISessionContext', () => {
    it('should update session context', async () => {
      const context: AISessionContext = {
        draft_product_id: 'product-1',
        product_id: 'published-1'
      };

      await updateAISessionContext(mockDb, 'site-1', 'session-1', context);

      expect(mockBind).toHaveBeenCalledWith(
        JSON.stringify(context),
        expect.any(Number),
        'session-1',
        'site-1'
      );
    });
  });

  describe('updateAISessionStatus', () => {
    it('should update session status', async () => {
      await updateAISessionStatus(mockDb, 'site-1', 'session-1', 'completed');

      expect(mockBind).toHaveBeenCalledWith(
        'completed',
        expect.any(Number),
        'session-1',
        'site-1'
      );
    });
  });

  describe('deleteAISession', () => {
    it('should delete a session', async () => {
      await deleteAISession(mockDb, 'site-1', 'session-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM ai_sessions WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('session-1', 'site-1');
    });
  });

  describe('deleteExpiredAISessions', () => {
    it('should delete expired sessions', async () => {
      mockRun.mockResolvedValue({ success: true, meta: { changes: 3 } });

      const deletedCount = await deleteExpiredAISessions(mockDb);

      expect(deletedCount).toBe(3);
      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM ai_sessions WHERE expires_at IS NOT NULL AND expires_at < ?'
      );
    });

    it('should return 0 when no sessions deleted', async () => {
      mockRun.mockResolvedValue({ success: true, meta: { changes: 0 } });

      const deletedCount = await deleteExpiredAISessions(mockDb);

      expect(deletedCount).toBe(0);
    });
  });
});
