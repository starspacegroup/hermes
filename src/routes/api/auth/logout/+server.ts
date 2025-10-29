import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  // Delete all session cookies
  cookies.delete('user_session', { path: '/' });
  cookies.delete('admin_session', { path: '/' });
  cookies.delete('engineer_session', { path: '/' });

  return json({ success: true });
};
