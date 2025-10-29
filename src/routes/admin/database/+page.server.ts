import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const userSession = cookies.get('user_session');

  if (!userSession) {
    throw redirect(303, '/auth/login');
  }

  try {
    const user = JSON.parse(decodeURIComponent(userSession));

    // Only platform engineers can access the database navigator
    if (user.role !== 'platform_engineer') {
      throw redirect(303, '/admin/dashboard');
    }

    return {
      user
    };
  } catch (error) {
    console.error('Failed to parse user session:', error);
    throw redirect(303, '/auth/login');
  }
};
