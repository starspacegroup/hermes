/**
 * OAuth callback endpoint
 * Handles OAuth provider callbacks and completes authentication
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getUserByEmail } from '$lib/server/db';
import { createUser } from '$lib/server/db/users.js';
import {
  getOAuthSession,
  deleteOAuthSession,
  createProviderAccount,
  getProviderAccountByProviderId,
  createAuthAuditLog
} from '$lib/server/db/oauth.js';
import { createOAuthProvider } from '$lib/server/oauth/providers/index.js';
import type { OAuthProvider } from '$lib/types/oauth.js';

/**
 * GET /api/auth/oauth/[provider]/callback
 * Handles OAuth callback from provider
 */
export const GET: RequestHandler = async ({ params, url, platform, locals, cookies, request }) => {
  const provider = params.provider as OAuthProvider;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const db = getDB(platform);
  const siteId = locals.siteId;

  // Handle OAuth errors from provider
  if (error) {
    console.error(`OAuth error from ${provider}:`, error);
    await createAuthAuditLog(db, siteId, {
      event_type: 'sso_failed',
      provider,
      ip_address:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      details: { error, description: url.searchParams.get('error_description') }
    });
    redirect(302, `/auth/login?error=oauth_denied&provider=${provider}`);
  }

  // Validate required parameters
  if (!code || !state) {
    redirect(302, `/auth/login?error=invalid_callback`);
  }

  try {
    // Retrieve and validate OAuth session
    const oauthSession = await getOAuthSession(db, state);
    if (!oauthSession || oauthSession.provider !== provider) {
      redirect(302, `/auth/login?error=invalid_state`);
    }

    // Get OAuth credentials
    const clientIdValue = platform?.env?.[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecretValue = platform?.env?.[`${provider.toUpperCase()}_CLIENT_SECRET`];

    if (!clientIdValue || !clientSecretValue) {
      throw new Error(`OAuth credentials not configured for ${provider}`);
    }

    const clientId = typeof clientIdValue === 'string' ? clientIdValue : '';
    const clientSecret = typeof clientSecretValue === 'string' ? clientSecretValue : '';

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials must be strings for ${provider}`);
    }

    // Create provider instance and exchange code for tokens
    const oauthProvider = createOAuthProvider(provider, { clientId, clientSecret });
    const tokens = await oauthProvider.exchangeCodeForTokens(
      code,
      oauthSession.redirect_uri,
      oauthSession.code_verifier
    );

    // Get user profile from provider
    const userProfile = await oauthProvider.getUserProfile(tokens.access_token);

    if (!userProfile.email) {
      redirect(302, `/auth/login?error=no_email&provider=${provider}`);
    }

    // Clean up OAuth session
    await deleteOAuthSession(db, state);

    // Check if provider account already exists
    const providerAccount = await getProviderAccountByProviderId(
      db,
      siteId,
      provider,
      userProfile.id
    );

    let userId: string;

    if (providerAccount) {
      // Existing provider account - use linked user
      userId = providerAccount.user_id;

      // Update tokens
      const { updateProviderAccountTokens } = await import('$lib/server/db/oauth.js');
      await updateProviderAccountTokens(db, providerAccount.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : undefined,
        scope: tokens.scope
      });
    } else {
      // Check if user exists with same email (account linking)
      let existingUser = await getUserByEmail(db, siteId, userProfile.email);

      if (existingUser) {
        // Link provider to existing user
        userId = existingUser.id;
      } else {
        // Create new user
        // Generate a random password hash (user won't use it for SSO login)
        const randomPassword = crypto.randomUUID();
        const encoder = new TextEncoder();
        const data = encoder.encode(randomPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const password_hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        existingUser = await createUser(db, siteId, {
          email: userProfile.email,
          name: userProfile.name || userProfile.email.split('@')[0],
          password_hash,
          role: 'customer',
          status: 'active'
        });
        userId = existingUser.id;
      }

      // Create provider account link
      await createProviderAccount(db, siteId, userId, provider, {
        provider_account_id: userProfile.id,
        email: userProfile.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : undefined,
        scope: tokens.scope,
        id_token: tokens.id_token,
        profile_data: userProfile
      });

      // Log account linking
      await createAuthAuditLog(db, siteId, {
        user_id: userId,
        event_type: 'account_linked',
        provider,
        ip_address:
          request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        details: { email: userProfile.email }
      });
    }

    // Get full user object
    const { getUserById } = await import('$lib/server/db/users.js');
    const user = await getUserById(db, siteId, userId);

    if (!user || user.status !== 'active') {
      redirect(302, `/auth/login?error=account_inactive`);
    }

    // Create session
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
      expiration_date: user.expiration_date,
      grace_period_days: user.grace_period_days
    };

    cookies.set('user_session', JSON.stringify(sessionUser), {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set role-specific cookies
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

    // Update last login
    const { updateUser } = await import('$lib/server/db/users.js');
    await updateUser(db, siteId, user.id, {
      last_login_at: Math.floor(Date.now() / 1000),
      last_login_ip:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || null
    });

    // Log successful SSO
    await createAuthAuditLog(db, siteId, {
      user_id: userId,
      event_type: 'sso_completed',
      provider,
      ip_address:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      details: { email: user.email }
    });

    // Redirect to dashboard
    redirect(302, '/admin/dashboard');
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);

    await createAuthAuditLog(db, siteId, {
      event_type: 'sso_failed',
      provider,
      ip_address:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      details: { error: String(error) }
    });

    redirect(302, `/auth/login?error=oauth_failed&provider=${provider}`);
  }
};
