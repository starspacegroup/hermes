import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock authentication - in production, this would validate against a database
const mockLogin = (email: string, password: string): boolean => {
  // Mock admin credentials
  return email === 'admin@hermes.local' && password === 'admin123';
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!data.email || !data.password) {
      return json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const isValid = mockLogin(data.email, data.password);

    if (isValid) {
      // Set admin session cookie
      cookies.set('admin_session', 'authenticated', {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return json({
        success: true,
        user: {
          id: '1',
          email: 'admin@hermes.local',
          name: 'Admin User',
          role: 'admin'
        }
      });
    } else {
      return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return json({ success: false, error: 'An error occurred during login' }, { status: 500 });
  }
};
