/**
 * OAuth initiation endpoint
 * Starts the OAuth flow for a given provider
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { createOAuthProvider } from '$lib/server/oauth/providers/index.js';
import { createOAuthSession, createAuthAuditLog } from '$lib/server/db/oauth.js';
import type { OAuthProvider } from '$lib/types/oauth.js';

const VALID_PROVIDERS: OAuthProvider[] = [
  'google',
  'linkedin',
  'apple',
  'facebook',
  'github',
  'twitter',
  'microsoft'
];

/**
 * GET /api/auth/oauth/[provider]
 * Initiates OAuth flow and redirects to provider
 */
export const GET: RequestHandler = async ({ params, url, platform, locals, request }) => {
  const provider = params.provider as OAuthProvider;

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`Invalid OAuth provider: ${provider}`);
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  // Get OAuth credentials from environment
  // In production, these should be stored securely per site
  const clientId = platform?.env?.[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = platform?.env?.[`${provider.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${provider}`);
  }

  try {
    // Create provider instance
    const oauthProvider = createOAuthProvider(provider, { clientId, clientSecret });

    // Generate authorization URL with PKCE
    const baseUrl = url.origin;
    const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;
    const authParams = await oauthProvider.getAuthorizationUrl(redirectUri);

    // Store OAuth session in database
    await createOAuthSession(db, siteId, provider, {
      state: authParams.state,
      code_verifier: authParams.codeVerifier,
      code_challenge: authParams.codeChallenge,
      nonce: authParams.nonce,
      redirect_uri: redirectUri
    });

    // Log SSO initiation
    await createAuthAuditLog(db, siteId, {
      event_type: 'sso_initiated',
      provider,
      ip_address:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
      details: { redirect_uri: redirectUri }
    });

    // Redirect to OAuth provider
    redirect(302, authParams.authUrl);
  } catch (error) {
    console.error(`OAuth initiation error for ${provider}:`, error);
    
    // Log failure
    await createAuthAuditLog(db, siteId, {
      event_type: 'sso_failed',
      provider,
      ip_address:
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
      details: { error: String(error) }
    });

    // Redirect to login with error
    redirect(302, `/auth/login?error=oauth_init_failed&provider=${provider}`);
  }
};
