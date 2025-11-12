import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getUserByEmail } from '$lib/server/db';

/**
 * Hash a password using SHA-256 (matches the hashing in user edit)
 * In production, use bcrypt instead
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against stored hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

export const POST: RequestHandler = async ({ request, cookies, platform, locals }) => {
  try {
    const data = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!data.email || !data.password) {
      return json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const db = getDB(platform);
    const siteId = locals.siteId;

    // Look up user in database by email
    const dbUser = await getUserByEmail(db, siteId, data.email);

    if (!dbUser) {
      // User not found
      return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if user account is active
    if (dbUser.status !== 'active') {
      return json(
        {
          success: false,
          error: `Account is ${dbUser.status}. Please contact an administrator.`
        },
        { status: 403 }
      );
    }

    // Check if account has expired
    if (dbUser.expiration_date && dbUser.expiration_date < Date.now() / 1000) {
      return json(
        { success: false, error: 'Account has expired. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(data.password, dbUser.password_hash);

    if (!passwordValid) {
      return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Prepare user object for session (without password hash)
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      permissions: dbUser.permissions,
      status: dbUser.status,
      expiration_date: dbUser.expiration_date,
      grace_period_days: dbUser.grace_period_days
    };

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

    // Update last login timestamp
    const { updateUser } = await import('$lib/server/db/users');
    await updateUser(db, siteId, dbUser.id, {
      last_login_at: Math.floor(Date.now() / 1000),
      last_login_ip:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || null
    });

    return json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ success: false, error: 'An error occurred during login' }, { status: 500 });
  }
};
