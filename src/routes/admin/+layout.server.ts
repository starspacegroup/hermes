import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
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

    return {
      user
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
