import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { logActivity } from '$lib/server/activity-logger';

export const POST: RequestHandler = async ({ cookies, request, platform, locals }) => {
  // Get user session before deleting cookies
  const userSessionCookie = cookies.get('user_session');
  let user: { id: string; name: string } | null = null;

  if (userSessionCookie) {
    try {
      const sessionData = JSON.parse(userSessionCookie);
      user = { id: sessionData.id, name: sessionData.name };
    } catch (error) {
      console.error('Failed to parse user session:', error);
    }
  } else if (locals.currentUser) {
    user = { id: locals.currentUser.id, name: locals.currentUser.name };
  }

  // Log logout if user was logged in
  if (user) {
    const db = getDB(platform);
    const ipAddress =
      request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await logActivity(db, {
      siteId: locals.siteId,
      userId: user.id,
      action: 'user.logout',
      entityType: 'user',
      entityId: user.id,
      entityName: user.name,
      description: 'User logged out',
      ipAddress,
      userAgent
    });
  }

  // Delete all session cookies
  cookies.delete('user_session', { path: '/' });
  cookies.delete('admin_session', { path: '/' });
  cookies.delete('engineer_session', { path: '/' });

  return json({ success: true });
};
