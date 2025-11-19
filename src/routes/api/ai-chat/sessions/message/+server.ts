import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getAISession, addMessageToSession } from '$lib/server/db/ai-sessions';
import type { AIChatMessage } from '$lib/types/ai-chat';

/**
 * POST /api/ai-chat/sessions/message
 * Add a message to an existing session
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

  try {
    const body = (await request.json()) as {
      sessionId: string;
      message: AIChatMessage;
    };

    const { sessionId, message } = body;

    if (!sessionId) {
      throw error(400, 'Session ID is required');
    }

    if (!message) {
      throw error(400, 'Message is required');
    }

    // Verify session exists and belongs to user
    const session = await getAISession(db, siteId, sessionId);
    if (!session) {
      throw error(404, 'Session not found');
    }

    if (session.user_id !== userId) {
      throw error(403, 'Access denied to this session');
    }

    // Add message to session
    await addMessageToSession(db, siteId, sessionId, message);

    return json({ success: true });
  } catch (err) {
    console.error('Failed to add message to session:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to add message to session');
  }
};
