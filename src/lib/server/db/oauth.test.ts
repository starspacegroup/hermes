/**
 * Tests for OAuth database functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProviderAccount,
  getProviderAccount,
  getUserProviderAccounts,
  getProviderAccountByProviderId,
  findProviderAccountsByEmail,
  updateProviderAccountTokens,
  deleteProviderAccount,
  createOAuthSession,
  getOAuthSession,
  deleteOAuthSession,
  createAuthAuditLog,
  getUserAuthLogs,
  getAuthLogsByEvent
} from './oauth.js';

// Mock D1Database
function createMockDB() {
  const data = {
    provider_accounts: [] as Array<Record<string, unknown>>,
    oauth_sessions: [] as Array<Record<string, unknown>>,
    auth_audit_logs: [] as Array<Record<string, unknown>>
  };

  return {
    prepare: (sql: string) => ({
      bind: (...params: Array<unknown>) => ({
        run: async () => {
          // Simple mock for INSERT operations
          if (sql.includes('INSERT INTO provider_accounts')) {
            data.provider_accounts.push({
              id: params[0],
              user_id: params[1],
              site_id: params[2],
              provider: params[3],
              provider_account_id: params[4],
              email: params[5],
              access_token: params[6],
              refresh_token: params[7],
              token_expires_at: params[8],
              scope: params[9],
              id_token: params[10],
              profile_data: params[11],
              created_at: params[12],
              updated_at: params[13],
              last_used_at: params[14]
            });
          }
          if (sql.includes('INSERT INTO oauth_sessions')) {
            data.oauth_sessions.push({
              id: params[0],
              site_id: params[1],
              state: params[2],
              code_verifier: params[3],
              code_challenge: params[4],
              nonce: params[5],
              provider: params[6],
              redirect_uri: params[7],
              created_at: params[8],
              expires_at: params[9]
            });
          }
          if (sql.includes('INSERT INTO auth_audit_logs')) {
            data.auth_audit_logs.push({
              id: params[0],
              site_id: params[1],
              user_id: params[2],
              event_type: params[3],
              provider: params[4],
              ip_address: params[5],
              user_agent: params[6],
              details: params[7],
              created_at: params[8]
            });
          }
          return { meta: { changes: 1 } };
        },
        first: async () => {
          if (sql.includes('FROM provider_accounts')) {
            return data.provider_accounts[0] || null;
          }
          if (sql.includes('FROM oauth_sessions')) {
            return data.oauth_sessions[0] || null;
          }
          return null;
        },
        all: async () => {
          if (sql.includes('FROM provider_accounts')) {
            return { results: data.provider_accounts };
          }
          if (sql.includes('FROM auth_audit_logs')) {
            return { results: data.auth_audit_logs };
          }
          return { results: [] };
        }
      })
    })
  } as unknown as D1Database;
}

describe('OAuth Database Functions', () => {
  let mockDB: D1Database;
  const siteId = 'test-site';
  const userId = 'test-user';

  beforeEach(() => {
    mockDB = createMockDB();
  });

  describe('createProviderAccount', () => {
    it('should create a provider account', async () => {
      const account = await createProviderAccount(mockDB, siteId, userId, 'google', {
        provider_account_id: 'google-123',
        email: 'test@example.com',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_expires_at: 1234567890,
        scope: 'email profile',
        profile_data: { name: 'Test User' }
      });

      expect(account).toBeDefined();
      expect(account.provider).toBe('google');
      expect(account.email).toBe('test@example.com');
    });
  });

  describe('getProviderAccount', () => {
    it('should retrieve a provider account', async () => {
      const account = await getProviderAccount(mockDB, siteId, userId, 'google');
      expect(account).toBeDefined();
    });
  });

  describe('getUserProviderAccounts', () => {
    it('should retrieve all provider accounts for a user', async () => {
      const accounts = await getUserProviderAccounts(mockDB, siteId, userId);
      expect(Array.isArray(accounts)).toBe(true);
    });
  });

  describe('getProviderAccountByProviderId', () => {
    it('should retrieve account by provider ID', async () => {
      const account = await getProviderAccountByProviderId(mockDB, siteId, 'google', 'google-123');
      expect(account).toBeDefined();
    });
  });

  describe('findProviderAccountsByEmail', () => {
    it('should find accounts by email', async () => {
      const accounts = await findProviderAccountsByEmail(mockDB, siteId, 'test@example.com');
      expect(Array.isArray(accounts)).toBe(true);
    });
  });

  describe('updateProviderAccountTokens', () => {
    it('should update account tokens', async () => {
      await expect(
        updateProviderAccountTokens(mockDB, 'account-id', {
          access_token: 'new-token',
          token_expires_at: 9876543210
        })
      ).resolves.not.toThrow();
    });
  });

  describe('deleteProviderAccount', () => {
    it('should delete a provider account', async () => {
      const result = await deleteProviderAccount(mockDB, siteId, userId, 'google');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('OAuth Sessions', () => {
    it('should create an OAuth session', async () => {
      const session = await createOAuthSession(mockDB, siteId, 'google', {
        state: 'state-123',
        code_verifier: 'verifier',
        code_challenge: 'challenge',
        nonce: 'nonce-123',
        redirect_uri: 'http://localhost/callback'
      });

      expect(session).toBeDefined();
      expect(session.provider).toBe('google');
      expect(session.state).toBe('state-123');
    });

    it('should retrieve OAuth session by state', async () => {
      const session = await getOAuthSession(mockDB, 'state-123');
      expect(session).toBeDefined();
    });

    it('should delete OAuth session', async () => {
      await expect(deleteOAuthSession(mockDB, 'state-123')).resolves.not.toThrow();
    });
  });

  describe('Auth Audit Logs', () => {
    it('should create an audit log entry', async () => {
      await expect(
        createAuthAuditLog(mockDB, siteId, {
          user_id: userId,
          event_type: 'login_success',
          provider: 'google',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          details: { email: 'test@example.com' }
        })
      ).resolves.not.toThrow();
    });

    it('should retrieve user auth logs', async () => {
      const logs = await getUserAuthLogs(mockDB, siteId, userId);
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should retrieve logs by event type', async () => {
      const logs = await getAuthLogsByEvent(mockDB, siteId, 'login_success');
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
