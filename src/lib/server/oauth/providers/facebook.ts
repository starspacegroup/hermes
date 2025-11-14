/**
 * Facebook Login Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class FacebookOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'facebook',
      displayName: 'Facebook',
      icon: '📘',
      clientId,
      clientSecret,
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/v18.0/me?fields=id,name,email,picture',
      scopes: ['email', 'public_profile'],
      pkceRequired: true,
      supportsRefresh: false // Facebook uses long-lived tokens instead
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    const picture = data.picture as Record<string, unknown> | undefined;
    const pictureData = picture?.data as Record<string, unknown> | undefined;

    return {
      id: String(data.id || ''),
      email: String(data.email || ''),
      name: String(data.name || ''),
      picture: String(pictureData?.url || ''),
      email_verified: true
    };
  }
}
