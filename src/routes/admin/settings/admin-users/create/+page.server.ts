import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { canPerformAction } from '$lib/server/permissions';

export const load: PageServerLoad = async ({ cookies }) => {
  // Check authentication
  const userSession = cookies.get('user_session');
  if (!userSession) {
    throw error(401, 'Not authenticated');
  }

  const currentUser = JSON.parse(decodeURIComponent(userSession));

  // Check permission
  if (!canPerformAction(currentUser, 'users:write')) {
    throw error(403, 'Insufficient permissions to create users');
  }

  return {
    currentUser: {
      id: currentUser.id,
      role: currentUser.role
    }
  };
};
