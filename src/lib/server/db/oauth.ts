/**
 * OAuth provider accounts repository
 * Manages OAuth provider linkage for multi-provider SSO
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';
import type {
  ProviderAccount,
  OAuthSession,
  AuthAuditLog,
  OAuthProvider,
  AuthEventType
} from '$lib/types/oauth.js';

/**
 * Get a provider account by user ID and provider
 */
export async function getProviderAccount(
  db: D1Database,
  siteId: string,
  userId: string,
  provider: OAuthProvider
): Promise<ProviderAccount | null> {
  return await executeOne<ProviderAccount>(
    db,
    'SELECT * FROM provider_accounts WHERE site_id = ? AND user_id = ? AND provider = ?',
    [siteId, userId, provider]
  );
}

/**
 * Get all provider accounts for a user
 */
export async function getUserProviderAccounts(
  db: D1Database,
  siteId: string,
  userId: string
): Promise<ProviderAccount[]> {
  const result = await execute<ProviderAccount>(
    db,
    'SELECT * FROM provider_accounts WHERE site_id = ? AND user_id = ? ORDER BY last_used_at DESC',
    [siteId, userId]
  );
  return result.results || [];
}

/**
 * Get a provider account by provider account ID
 */
export async function getProviderAccountByProviderId(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider,
  providerAccountId: string
): Promise<ProviderAccount | null> {
  return await executeOne<ProviderAccount>(
    db,
    'SELECT * FROM provider_accounts WHERE site_id = ? AND provider = ? AND provider_account_id = ?',
    [siteId, provider, providerAccountId]
  );
}

/**
 * Find provider accounts by email (for account linking)
 */
export async function findProviderAccountsByEmail(
  db: D1Database,
  siteId: string,
  email: string
): Promise<ProviderAccount[]> {
  const result = await execute<ProviderAccount>(
    db,
    'SELECT * FROM provider_accounts WHERE site_id = ? AND email = ?',
    [siteId, email]
  );
  return result.results || [];
}

/**
 * Create a new provider account
 */
export async function createProviderAccount(
  db: D1Database,
  siteId: string,
  userId: string,
  provider: OAuthProvider,
  data: {
    provider_account_id: string;
    email: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: number;
    scope?: string;
    id_token?: string;
    profile_data?: Record<string, unknown>;
  }
): Promise<ProviderAccount> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const profileData = data.profile_data ? JSON.stringify(data.profile_data) : '{}';

  await db
    .prepare(
      `INSERT INTO provider_accounts 
       (id, user_id, site_id, provider, provider_account_id, email, 
        access_token, refresh_token, token_expires_at, scope, id_token, 
        profile_data, created_at, updated_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      siteId,
      provider,
      data.provider_account_id,
      data.email,
      data.access_token || null,
      data.refresh_token || null,
      data.token_expires_at || null,
      data.scope || null,
      data.id_token || null,
      profileData,
      timestamp,
      timestamp,
      timestamp
    )
    .run();

  const account = await executeOne<ProviderAccount>(
    db,
    'SELECT * FROM provider_accounts WHERE id = ?',
    [id]
  );
  if (!account) {
    throw new Error('Failed to create provider account');
  }
  return account;
}

/**
 * Update provider account tokens
 */
export async function updateProviderAccountTokens(
  db: D1Database,
  accountId: string,
  data: {
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: number;
    scope?: string;
  }
): Promise<void> {
  const timestamp = getCurrentTimestamp();
  const updates: string[] = ['updated_at = ?', 'last_used_at = ?'];
  const params: unknown[] = [timestamp, timestamp];

  if (data.access_token !== undefined) {
    updates.push('access_token = ?');
    params.push(data.access_token);
  }
  if (data.refresh_token !== undefined) {
    updates.push('refresh_token = ?');
    params.push(data.refresh_token);
  }
  if (data.token_expires_at !== undefined) {
    updates.push('token_expires_at = ?');
    params.push(data.token_expires_at);
  }
  if (data.scope !== undefined) {
    updates.push('scope = ?');
    params.push(data.scope);
  }

  params.push(accountId);

  await db
    .prepare(`UPDATE provider_accounts SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();
}

/**
 * Delete a provider account (unlink)
 */
export async function deleteProviderAccount(
  db: D1Database,
  siteId: string,
  userId: string,
  provider: OAuthProvider
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM provider_accounts WHERE site_id = ? AND user_id = ? AND provider = ?')
    .bind(siteId, userId, provider)
    .run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Create an OAuth session
 */
export async function createOAuthSession(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider,
  data: {
    state: string;
    code_verifier: string;
    code_challenge: string;
    nonce?: string;
    redirect_uri: string;
  }
): Promise<OAuthSession> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const expiresAt = timestamp + 600; // 10 minutes

  await db
    .prepare(
      `INSERT INTO oauth_sessions 
       (id, site_id, state, code_verifier, code_challenge, nonce, provider, redirect_uri, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.state,
      data.code_verifier,
      data.code_challenge,
      data.nonce || null,
      provider,
      data.redirect_uri,
      timestamp,
      expiresAt
    )
    .run();

  const session = await executeOne<OAuthSession>(
    db,
    'SELECT * FROM oauth_sessions WHERE id = ?',
    [id]
  );
  if (!session) {
    throw new Error('Failed to create OAuth session');
  }
  return session;
}

/**
 * Get OAuth session by state
 */
export async function getOAuthSession(
  db: D1Database,
  state: string
): Promise<OAuthSession | null> {
  const session = await executeOne<OAuthSession>(
    db,
    'SELECT * FROM oauth_sessions WHERE state = ?',
    [state]
  );

  // Check if session is expired
  if (session && session.expires_at < getCurrentTimestamp()) {
    await deleteOAuthSession(db, state);
    return null;
  }

  return session;
}

/**
 * Delete an OAuth session
 */
export async function deleteOAuthSession(db: D1Database, state: string): Promise<void> {
  await db.prepare('DELETE FROM oauth_sessions WHERE state = ?').bind(state).run();
}

/**
 * Clean up expired OAuth sessions
 */
export async function cleanupExpiredOAuthSessions(db: D1Database): Promise<number> {
  const timestamp = getCurrentTimestamp();
  const result = await db
    .prepare('DELETE FROM oauth_sessions WHERE expires_at < ?')
    .bind(timestamp)
    .run();
  return result.meta?.changes || 0;
}

/**
 * Create an auth audit log entry
 */
export async function createAuthAuditLog(
  db: D1Database,
  siteId: string,
  data: {
    user_id?: string;
    event_type: AuthEventType;
    provider?: OAuthProvider;
    ip_address?: string;
    user_agent?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const details = data.details ? JSON.stringify(data.details) : '{}';

  await db
    .prepare(
      `INSERT INTO auth_audit_logs 
       (id, site_id, user_id, event_type, provider, ip_address, user_agent, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.user_id || null,
      data.event_type,
      data.provider || null,
      data.ip_address || null,
      data.user_agent || null,
      details,
      timestamp
    )
    .run();
}

/**
 * Get auth audit logs for a user
 */
export async function getUserAuthLogs(
  db: D1Database,
  siteId: string,
  userId: string,
  limit = 50
): Promise<AuthAuditLog[]> {
  const result = await execute<AuthAuditLog>(
    db,
    `SELECT * FROM auth_audit_logs 
     WHERE site_id = ? AND user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [siteId, userId, limit]
  );
  return result.results || [];
}

/**
 * Get recent auth audit logs by event type
 */
export async function getAuthLogsByEvent(
  db: D1Database,
  siteId: string,
  eventType: AuthEventType,
  limit = 100
): Promise<AuthAuditLog[]> {
  const result = await execute<AuthAuditLog>(
    db,
    `SELECT * FROM auth_audit_logs 
     WHERE site_id = ? AND event_type = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [siteId, eventType, limit]
  );
  return result.results || [];
}
