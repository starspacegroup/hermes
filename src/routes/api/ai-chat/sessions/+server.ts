import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';
import {
  getUserAISessions,
  getAISession,
  createAISession,
  deleteAISession,
  updateAISessionTitle,
  updateAISessionStatus
} from '$lib/server/db/ai-sessions';

/**
 * GET /api/ai-chat/sessions
 * Get all sessions for the current user
 */
export const GET: RequestHandler = async ({ platform, locals, url }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;

  // Get optional status filter
  const status = url.searchParams.get('status') as 'active' | 'completed' | 'archived' | null;

  const sessions = await getUserAISessions(db, siteId, userId, status || undefined);

  return json(sessions);
};

/**
 * POST /api/ai-chat/sessions
 * Create a new session
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;

  const body = (await request.json()) as { title?: string };
  const { title } = body;

  const session = await createAISession(db, siteId, userId, title || 'New Conversation');

  return json(session, { status: 201 });
};

/**
 * DELETE /api/ai-chat/sessions?id=<sessionId>
 * Delete a session
 */
export const DELETE: RequestHandler = async ({ platform, locals, url }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;

  const sessionId = url.searchParams.get('id');
  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  // Verify session belongs to user
  const session = await getAISession(db, siteId, sessionId);
  if (!session) {
    throw error(404, 'Session not found');
  }

  if (session.user_id !== userId) {
    throw error(403, 'Access denied to this session');
  }

  await deleteAISession(db, siteId, sessionId);

  return json({ success: true });
};

/**
 * PATCH /api/ai-chat/sessions?id=<sessionId>
 * Update session title or status
 */
export const PATCH: RequestHandler = async ({ request, platform, locals, url }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;

  const sessionId = url.searchParams.get('id');
  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  // Verify session belongs to user
  const session = await getAISession(db, siteId, sessionId);
  if (!session) {
    throw error(404, 'Session not found');
  }

  if (session.user_id !== userId) {
    throw error(403, 'Access denied to this session');
  }

  const body = (await request.json()) as {
    title?: string;
    status?: 'active' | 'completed' | 'archived';
  };
  const { title, status } = body;

  if (title !== undefined) {
    await updateAISessionTitle(db, siteId, sessionId, title);
  }

  if (status !== undefined) {
    await updateAISessionStatus(db, siteId, sessionId, status);
  }

  const updatedSession = await getAISession(db, siteId, sessionId);

  return json(updatedSession);
};
