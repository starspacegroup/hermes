/**
 * Google OAuth 2.0 / OpenID Connect Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'google',
      displayName: 'Google',
      icon: '🔍',
      clientId,
      clientSecret,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
      pkceRequired: true,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    return {
      id: String(data.id || ''),
      email: String(data.email || ''),
      name: String(data.name || ''),
      picture: String(data.picture || ''),
      email_verified: Boolean(data.verified_email)
    };
  }
}
