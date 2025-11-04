/**
 * User Expiration Check API
 * Endpoint to manually trigger expiration checks
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { canPerformAction } from '$lib/server/permissions';
import { runExpirationCheck } from '$lib/server/user-expiration-scheduler';

/**
 * POST /api/admin/check-expirations
 * Manually trigger expiration check and notifications
 */
export const POST: RequestHandler = async ({ platform, cookies, locals }) => {
  try {
    // Check authentication
    const userSession = cookies.get('user_session');
    if (!userSession) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = JSON.parse(decodeURIComponent(userSession));

    // Check permission (only platform engineers and admins can trigger this)
    if (!canPerformAction(currentUser, 'users:write')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    // Run the expiration check
    const result = await runExpirationCheck(db, siteId, 7);

    return json({
      success: true,
      result: {
        notified: result.notified,
        deactivated: result.deactivated,
        expiring_users: result.expiringUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          expiration_date: u.expiration_date
        })),
        expired_users: result.expiredUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          expiration_date: u.expiration_date
        }))
      },
      message: `Sent ${result.notified} expiration notifications and deactivated ${result.deactivated} expired accounts`
    });
  } catch (error) {
    console.error('Error running expiration check:', error);
    return json({ success: false, error: 'Failed to run expiration check' }, { status: 500 });
  }
};
