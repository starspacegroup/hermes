import type { PageServerLoad } from './$types';
import { getDB, getActivityLogs, type ActivityLogFilter } from '$lib/server/db';
import { canPerformAction } from '$lib/server/permissions';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, cookies, locals, url }) => {
  // Check authentication
  const userSession = cookies.get('user_session');
  if (!userSession) {
    throw error(401, 'Not authenticated');
  }

  const currentUser = JSON.parse(decodeURIComponent(userSession));

  // Check permission
  if (!canPerformAction(currentUser, 'logs:read')) {
    throw error(403, 'Insufficient permissions to view activity logs');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  // Parse filter parameters from URL
  const filters: ActivityLogFilter = {
    user_id: url.searchParams.get('user_id') || undefined,
    action: url.searchParams.get('action') || undefined,
    entity_type: url.searchParams.get('entity_type') || undefined,
    entity_id: url.searchParams.get('entity_id') || undefined,
    severity: (url.searchParams.get('severity') as any) || undefined,
    limit: parseInt(url.searchParams.get('limit') || '100'),
    offset: parseInt(url.searchParams.get('offset') || '0')
  };

  // Parse date filters
  const startDate = url.searchParams.get('start_date');
  if (startDate) {
    filters.start_date = Math.floor(new Date(startDate).getTime() / 1000);
  }

  const endDate = url.searchParams.get('end_date');
  if (endDate) {
    filters.end_date = Math.floor(new Date(endDate).getTime() / 1000);
  }

  // Get activity logs
  const logs = await getActivityLogs(db, siteId, filters);

  // Parse metadata JSON strings
  const parsedLogs = logs.map((log) => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null
  }));

  return {
    logs: parsedLogs,
    filters,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
      canExport: canPerformAction(currentUser, 'logs:export')
    }
  };
};
