import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  // Delete admin session cookie
  cookies.delete('admin_session', { path: '/' });

  return json({ success: true });
};
