/**
 * User Management API
 * Endpoints for CRUD operations on users with permission checking
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getAllUsers, getUsersByRole, createUser, type CreateUserData } from '$lib/server/db';
import { canPerformAction, isUserAccountActive } from '$lib/server/permissions';

/**
 * GET /api/admin/users
 * List all users with optional filtering by role or status
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
    if (!canPerformAction(currentUser, 'users:read')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    // Get query parameters for filtering
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');

    let users;
    if (role) {
      users = await getUsersByRole(db, siteId, role as any);
    } else {
      users = await getAllUsers(db, siteId);
    }

    // Filter by status if provided
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    // Remove password hashes from response
    const sanitizedUsers = users.map((user) => {
      const { password_hash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        isActive: isUserAccountActive(user)
      };
    });

    return json({
      success: true,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
};

/**
 * POST /api/admin/users
 * Create a new user
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
    if (!canPerformAction(currentUser, 'users:write')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    const data = (await request.json()) as CreateUserData & {
      expiration_date?: string | number | null;
    };

    // Validate required fields
    if (!data.email || !data.name || !data.password_hash) {
      return json(
        { success: false, error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Convert expiration_date to timestamp if it's a date string
    let expirationTimestamp: number | null = null;
    if (data.expiration_date) {
      if (typeof data.expiration_date === 'string') {
        expirationTimestamp = Math.floor(new Date(data.expiration_date).getTime() / 1000);
      } else {
        expirationTimestamp = data.expiration_date;
      }
    }

    // Create user
    const user = await createUser(db, siteId, {
      ...data,
      expiration_date: expirationTimestamp,
      created_by: currentUser.id
    });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
};
