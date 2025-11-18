/**
 * AI Sessions repository with multi-tenant support
 * All queries are scoped by site_id
 */

import type { D1Database } from '@cloudflare/workers-types';
import { generateId, getCurrentTimestamp } from './connection.js';
import type { AISession, AIChatMessage, AISessionContext } from '$lib/types/ai-chat';

export interface DBAISession {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  messages: string; // JSON string
  context: string | null; // JSON string
  status: 'active' | 'completed' | 'archived';
  created_at: number;
  updated_at: number;
  expires_at: number | null;
}

/**
 * Create a new AI session
 */
export async function createAISession(
  db: D1Database,
  siteId: string,
  userId: string,
  title?: string
): Promise<AISession> {
  const id = generateId();
  const now = getCurrentTimestamp();
  const expiresAt = now + 7 * 24 * 60 * 60; // 7 days from now

  await db
    .prepare(
      `INSERT INTO ai_sessions (id, user_id, site_id, title, messages, status, created_at, updated_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      siteId,
      title || 'New Conversation',
      JSON.stringify([]),
      'active',
      now,
      now,
      expiresAt
    )
    .run();

  return {
    id,
    user_id: userId,
    site_id: siteId,
    title: title || 'New Conversation',
    messages: [],
    status: 'active',
    created_at: now,
    updated_at: now,
    expires_at: expiresAt
  };
}

/**
 * Get an AI session by ID (scoped by site)
 */
export async function getAISession(
  db: D1Database,
  siteId: string,
  sessionId: string
): Promise<AISession | null> {
  const result = await db
    .prepare('SELECT * FROM ai_sessions WHERE id = ? AND site_id = ?')
    .bind(sessionId, siteId)
    .first<DBAISession>();

  if (!result) {
    return null;
  }

  return dbSessionToAISession(result);
}

/**
 * Get all AI sessions for a user (scoped by site)
 */
export async function getUserAISessions(
  db: D1Database,
  siteId: string,
  userId: string,
  status?: 'active' | 'completed' | 'archived'
): Promise<AISession[]> {
  let query = 'SELECT * FROM ai_sessions WHERE site_id = ? AND user_id = ?';
  const params: (string | number)[] = [siteId, userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY updated_at DESC';

  const result = await db.prepare(query).bind(...params).all<DBAISession>();

  return (result.results || []).map(dbSessionToAISession);
}

/**
 * Update AI session messages
 */
export async function updateAISessionMessages(
  db: D1Database,
  siteId: string,
  sessionId: string,
  messages: AIChatMessage[]
): Promise<void> {
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `UPDATE ai_sessions 
       SET messages = ?, updated_at = ?
       WHERE id = ? AND site_id = ?`
    )
    .bind(JSON.stringify(messages), now, sessionId, siteId)
    .run();
}

/**
 * Add a message to an AI session
 */
export async function addMessageToSession(
  db: D1Database,
  siteId: string,
  sessionId: string,
  message: AIChatMessage
): Promise<void> {
  const session = await getAISession(db, siteId, sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const messages = [...session.messages, message];
  await updateAISessionMessages(db, siteId, sessionId, messages);
}

/**
 * Update AI session title
 */
export async function updateAISessionTitle(
  db: D1Database,
  siteId: string,
  sessionId: string,
  title: string
): Promise<void> {
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `UPDATE ai_sessions 
       SET title = ?, updated_at = ?
       WHERE id = ? AND site_id = ?`
    )
    .bind(title, now, sessionId, siteId)
    .run();
}

/**
 * Update AI session context
 */
export async function updateAISessionContext(
  db: D1Database,
  siteId: string,
  sessionId: string,
  context: AISessionContext
): Promise<void> {
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `UPDATE ai_sessions 
       SET context = ?, updated_at = ?
       WHERE id = ? AND site_id = ?`
    )
    .bind(JSON.stringify(context), now, sessionId, siteId)
    .run();
}

/**
 * Update AI session status
 */
export async function updateAISessionStatus(
  db: D1Database,
  siteId: string,
  sessionId: string,
  status: 'active' | 'completed' | 'archived'
): Promise<void> {
  const now = getCurrentTimestamp();

  await db
    .prepare(
      `UPDATE ai_sessions 
       SET status = ?, updated_at = ?
       WHERE id = ? AND site_id = ?`
    )
    .bind(status, now, sessionId, siteId)
    .run();
}

/**
 * Delete an AI session
 */
export async function deleteAISession(
  db: D1Database,
  siteId: string,
  sessionId: string
): Promise<void> {
  await db
    .prepare('DELETE FROM ai_sessions WHERE id = ? AND site_id = ?')
    .bind(sessionId, siteId)
    .run();
}

/**
 * Delete expired AI sessions
 */
export async function deleteExpiredAISessions(db: D1Database): Promise<number> {
  const now = getCurrentTimestamp();

  const result = await db
    .prepare('DELETE FROM ai_sessions WHERE expires_at IS NOT NULL AND expires_at < ?')
    .bind(now)
    .run();

  return result.meta.changes || 0;
}

/**
 * Convert database session to AISession type
 */
function dbSessionToAISession(dbSession: DBAISession): AISession {
  return {
    id: dbSession.id,
    user_id: dbSession.user_id,
    site_id: dbSession.site_id,
    title: dbSession.title,
    messages: JSON.parse(dbSession.messages) as AIChatMessage[],
    context: dbSession.context ? (JSON.parse(dbSession.context) as AISessionContext) : undefined,
    status: dbSession.status,
    created_at: dbSession.created_at,
    updated_at: dbSession.updated_at,
    expires_at: dbSession.expires_at || undefined
  };
}
