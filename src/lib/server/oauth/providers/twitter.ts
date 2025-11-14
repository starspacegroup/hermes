/**
 * X (Twitter) OAuth 2.0 Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class TwitterOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'twitter',
      displayName: 'X (Twitter)',
      icon: '𝕏',
      clientId,
      clientSecret,
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      userInfoUrl: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
      scopes: ['tweet.read', 'users.read'],
      pkceRequired: true,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    const userData = data.data as Record<string, unknown> | undefined;

    return {
      id: String(userData?.id || ''),
      email: String(userData?.email || ''), // Twitter OAuth 2.0 may not provide email
      name: String(userData?.name || userData?.username || ''),
      picture: String(userData?.profile_image_url || ''),
      email_verified: false
    };
  }
}
