/**
 * LinkedIn OAuth 2.0 Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class LinkedInOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'linkedin',
      displayName: 'LinkedIn',
      icon: '💼',
      clientId,
      clientSecret,
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
      scopes: ['openid', 'profile', 'email'],
      pkceRequired: true,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    return {
      id: String(data.sub || ''),
      email: String(data.email || ''),
      name: String(data.name || ''),
      picture: String(data.picture || ''),
      email_verified: Boolean(data.email_verified)
    };
  }
}
