/**
 * Notifications API
 * Endpoints for managing user notifications
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getDB,
  getUserNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '$lib/server/db';

/**
 * GET /api/admin/notifications
 * Get notifications for the current user
 */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  try {
    // Check authentication
    if (!locals.currentUser) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = locals.currentUser;

    const db = getDB(platform);
    const siteId = locals.siteId;

    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let notifications;
    if (unreadOnly) {
      notifications = await getUnreadNotifications(db, siteId, currentUser.id);
    } else {
      notifications = await getUserNotifications(db, siteId, currentUser.id, limit, offset);
    }

    // Parse metadata JSON strings
    const parsedNotifications = notifications.map((notif) => ({
      ...notif,
      metadata: notif.metadata ? JSON.parse(notif.metadata) : null
    }));

    const unreadCount = await getUnreadNotificationCount(db, siteId, currentUser.id);

    return json({
      success: true,
      notifications: parsedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
};

/**
 * POST /api/admin/notifications/mark-read
 * Mark notifications as read
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  try {
    // Check authentication
    if (!locals.currentUser) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = locals.currentUser;

    const db = getDB(platform);
    const siteId = locals.siteId;

    const data = (await request.json()) as {
      notification_id?: string;
      mark_all?: boolean;
    };

    if (data.mark_all) {
      const count = await markAllNotificationsAsRead(db, siteId, currentUser.id);
      return json({
        success: true,
        message: `Marked ${count} notifications as read`
      });
    } else if (data.notification_id) {
      const success = await markNotificationAsRead(db, siteId, data.notification_id);
      if (success) {
        return json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        return json({ success: false, error: 'Notification not found' }, { status: 404 });
      }
    } else {
      return json(
        { success: false, error: 'Either notification_id or mark_all is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return json({ success: false, error: 'Failed to mark notifications as read' }, { status: 500 });
  }
};
