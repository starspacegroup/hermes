import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Demo authentication credentials - in production, this would validate against the database with bcrypt
const demoCredentials = [
  {
    email: 'user@hermes.local',
    password: 'user123Pass',
    user: {
      id: 'user-1',
      email: 'user@hermes.local',
      name: 'Demo User',
      role: 'user' as const
    }
  },
  {
    email: 'owner@hermes.local',
    password: 'owner456Pass',
    user: {
      id: 'admin-1',
      email: 'owner@hermes.local',
      name: 'Site Owner',
      role: 'admin' as const
    }
  },
  {
    email: 'engineer@hermes.local',
    password: 'engineer789Pass',
    user: {
      id: 'engineer-1',
      email: 'engineer@hermes.local',
      name: 'Platform Engineer',
      role: 'platform_engineer' as const
    }
  }
];

const mockLogin = (email: string, password: string) => {
  const credential = demoCredentials.find(
    (cred) => cred.email === email && cred.password === password
  );
  return credential ? credential.user : null;
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

    const user = mockLogin(data.email, data.password);

    if (user) {
      // Set session cookie
      cookies.set('user_session', JSON.stringify(user), {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Set role-specific session cookies
      if (user.role === 'admin') {
        cookies.set('admin_session', 'authenticated', {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7
        });
      } else if (user.role === 'platform_engineer') {
        cookies.set('engineer_session', 'authenticated', {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7
        });
      }

      return json({
        success: true,
        user
      });
    } else {
      return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return json({ success: false, error: 'An error occurred during login' }, { status: 500 });
  }
};
