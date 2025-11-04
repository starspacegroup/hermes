/**
 * Roles Management API
 * Endpoints for managing roles and permissions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getDB,
  getAllRoles,
  getAllPermissions,
  createRole,
  type CreateRoleData
} from '$lib/server/db';
import { canPerformAction } from '$lib/server/permissions';
import { createActivityLog } from '$lib/server/db/activity-logs';

/**
 * GET /api/admin/roles
 * List all roles or all permissions
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
    if (!canPerformAction(currentUser, 'users:roles')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const type = url.searchParams.get('type');

    // Return permissions list if requested
    if (type === 'permissions') {
      const permissions = await getAllPermissions(db);
      return json({
        success: true,
        permissions
      });
    }

    // Otherwise return roles
    const siteId = locals.siteId;
    const roles = await getAllRoles(db, siteId);

    return json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
};

/**
 * POST /api/admin/roles
 * Create a new role
 */
export const POST: RequestHandler = async ({ request, platform, cookies, locals }) => {
  try {
    // Check authentication
    const userSession = cookies.get('user_session');
    if (!userSession) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = JSON.parse(decodeURIComponent(userSession));

    // Check permission
    if (!canPerformAction(currentUser, 'users:roles')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    const data = (await request.json()) as CreateRoleData;

    // Validate required fields
    if (!data.name) {
      return json({ success: false, error: 'Role name is required' }, { status: 400 });
    }

    // Create role
    const role = await createRole(db, siteId, data);

    // Log the activity
    await createActivityLog(db, siteId, {
      user_id: currentUser.id,
      action: 'role.created',
      entity_type: 'role',
      entity_id: role.id,
      entity_name: role.name,
      description: `Created role ${role.name}`,
      metadata: {
        permission_count: data.permission_ids?.length || 0
      },
      severity: 'info'
    });

    return json({
      success: true,
      role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return json({ success: false, error: 'Failed to create role' }, { status: 500 });
  }
};
