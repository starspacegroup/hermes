import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Demo authentication credentials - in production, this would validate against the database with bcrypt
// Regular user password: TfppPEsXnfZluUi52ne538O
// Admin user password: 4a6lJebYdNkr2zjq5j59rTt
// Platform engineer password: Set via PLATFORM_ENGINEER_PASSWORD environment variable
const demoCredentials = [
  {
    email: 'user@hermes.local',
    password: 'TfppPEsXnfZluUi52ne538O',
    user: {
      id: 'user-1',
      email: 'user@hermes.local',
      name: 'Demo User',
      role: 'user' as const
    }
  },
  {
    email: 'owner@hermes.local',
    password: '4a6lJebYdNkr2zjq5j59rTt',
    user: {
      id: 'admin-1',
      email: 'owner@hermes.local',
      name: 'Site Owner',
      role: 'admin' as const
    }
  }
];

const mockLogin = (email: string, password: string, platformPassword?: string) => {
  // Check platform engineer credentials from environment variable
  if (email === 'engineer@hermes.local' && platformPassword && password === platformPassword) {
    return {
      id: 'engineer-1',
      email: 'engineer@hermes.local',
      name: 'Platform Engineer',
      role: 'platform_engineer' as const
    };
  }

  // Check standard demo credentials
  const credential = demoCredentials.find(
    (cred) => cred.email === email && cred.password === password
  );
  return credential ? credential.user : null;
};

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  try {
    const data = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!data.email || !data.password) {
      return json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Get platform engineer password from environment
    const platformPassword = platform?.env?.PLATFORM_ENGINEER_PASSWORD as string | undefined;

    const user = mockLogin(data.email, data.password, platformPassword);

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
