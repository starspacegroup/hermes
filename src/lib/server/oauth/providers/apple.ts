/**
 * Apple Sign In Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class AppleOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'apple',
      displayName: 'Apple',
      icon: '🍎',
      clientId,
      clientSecret,
      authorizationUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      userInfoUrl: '', // Apple uses ID token for user info
      scopes: ['name', 'email'],
      pkceRequired: true,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    // Apple provides user info in the ID token, not a separate endpoint
    return {
      id: String(data.sub || ''),
      email: String(data.email || ''),
      name: String(data.name || ''),
      picture: '',
      email_verified: Boolean(data.email_verified)
    };
  }

  /**
   * Apple provides user info in the ID token, not via a separate API
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    // For Apple, we should decode the ID token instead
    // This is a simplified version - in production, properly decode and verify JWT
    throw new Error('Apple user profile should be extracted from ID token');
  }
}
