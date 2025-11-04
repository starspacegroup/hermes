import type { PageServerLoad } from './$types';
import { getDB, getAllUsers } from '$lib/server/db';
import { canPerformAction, isUserAccountActive } from '$lib/server/permissions';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, cookies, locals }) => {
  // Check authentication
  const userSession = cookies.get('user_session');
  if (!userSession) {
    throw error(401, 'Not authenticated');
  }

  const currentUser = JSON.parse(decodeURIComponent(userSession));

  // Check permission
  if (!canPerformAction(currentUser, 'users:read')) {
    throw error(403, 'Insufficient permissions to view users');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  // Get all users
  const users = await getAllUsers(db, siteId);

  // Sanitize users (remove password hashes) and add computed fields
  const sanitizedUsers = users.map((user) => {
    const { password_hash: _password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      isActive: isUserAccountActive(user),
      permissions: JSON.parse(user.permissions)
    };
  });

  return {
    users: sanitizedUsers,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
      canWrite: canPerformAction(currentUser, 'users:write'),
      canDelete: canPerformAction(currentUser, 'users:delete'),
      canManageRoles: canPerformAction(currentUser, 'users:roles')
    }
  };
};
