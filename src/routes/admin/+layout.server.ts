import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getUserAISessions } from '$lib/server/db/ai-sessions';
import type { AISession } from '$lib/types/ai-chat';

export const load: LayoutServerLoad = async ({ cookies, url, platform, locals }) => {
  // Allow login page to be accessed without authentication
  if (url.pathname === '/auth/login') {
    return {};
  }

  // Check if user has a valid session
  const userSession = cookies.get('user_session');

  if (!userSession) {
    // No session, redirect to login
    throw redirect(303, '/auth/login');
  }

  try {
    const user = JSON.parse(decodeURIComponent(userSession));

    // Check if user has admin or platform_engineer role
    if (user.role !== 'admin' && user.role !== 'platform_engineer') {
      // Regular users cannot access admin panel
      // Clear the admin/engineer session cookies if they exist
      cookies.delete('admin_session', { path: '/' });
      cookies.delete('engineer_session', { path: '/' });

      // Redirect to main site
      throw redirect(303, '/');
    }

    // Load user's chat sessions if they're an admin
    let sessions: AISession[] = [];
    let archivedSessions: AISession[] = [];
    if (locals.currentUser && platform?.env?.DB) {
      const db = getDB(platform);
      const siteId = locals.siteId;
      const userId = locals.currentUser.id;
      try {
        // Load active sessions
        sessions = await getUserAISessions(db, siteId, userId, 'active');
        // Load archived sessions
        archivedSessions = await getUserAISessions(db, siteId, userId, 'archived');
      } catch (error) {
        console.error('Failed to load AI sessions:', error);
      }
    }

    return {
      user,
      sessions,
      archivedSessions
    };
  } catch (error) {
    // Check if it's a redirect error (which we want to throw)
    if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
      throw error;
    }

    // Invalid session data, redirect to login
    cookies.delete('user_session', { path: '/' });
    cookies.delete('admin_session', { path: '/' });
    cookies.delete('engineer_session', { path: '/' });
    throw redirect(303, '/auth/login');
  }
};
