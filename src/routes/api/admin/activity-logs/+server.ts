/**
 * Activity Logs API
 * Endpoints for querying and exporting activity logs
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getActivityLogs, type ActivityLogFilter } from '$lib/server/db';
import { canPerformAction } from '$lib/server/permissions';

/**
 * GET /api/admin/activity-logs
 * Query activity logs with optional filters
 */
export const GET: RequestHandler = async ({ url, platform, cookies, locals }) => {
  try {
    // Check authentication
    const userSession = cookies.get('user_session');
    if (!userSession) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = JSON.parse(decodeURIComponent(userSession));

    // Check permission
    if (!canPerformAction(currentUser, 'logs:read')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    // Parse query parameters for filtering
    const severityParam = url.searchParams.get('severity');
    const filter: ActivityLogFilter = {
      user_id: url.searchParams.get('user_id') || undefined,
      action: url.searchParams.get('action') || undefined,
      entity_type: url.searchParams.get('entity_type') || undefined,
      entity_id: url.searchParams.get('entity_id') || undefined,
      severity: severityParam
        ? (severityParam as 'info' | 'warning' | 'error' | 'critical')
        : undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0')
    };

    // Parse date filters
    const startDate = url.searchParams.get('start_date');
    if (startDate) {
      filter.start_date = Math.floor(new Date(startDate).getTime() / 1000);
    }

    const endDate = url.searchParams.get('end_date');
    if (endDate) {
      filter.end_date = Math.floor(new Date(endDate).getTime() / 1000);
    }

    const logs = await getActivityLogs(db, siteId, filter);

    // Parse metadata JSON strings
    const parsedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    return json({
      success: true,
      logs: parsedLogs,
      filter
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return json({ success: false, error: 'Failed to fetch activity logs' }, { status: 500 });
  }
};
