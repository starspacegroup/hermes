/**
 * GitHub OAuth 2.0 Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class GitHubOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    const config: OAuthProviderConfig = {
      name: 'github',
      displayName: 'GitHub',
      icon: '🐙',
      clientId,
      clientSecret,
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['read:user', 'user:email'],
      pkceRequired: false,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    return {
      id: String(data.id || ''),
      email: String(data.email || ''),
      name: String(data.name || data.login || ''),
      picture: String(data.avatar_url || ''),
      email_verified: true // GitHub always provides verified emails
    };
  }

  /**
   * GitHub requires special handling for email retrieval
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    // First get basic profile
    const profile = await super.getUserProfile(accessToken);

    // If email is not in profile, fetch it separately
    if (!profile.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });

      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primaryEmail = emails.find((e) => e.primary && e.verified);
        if (primaryEmail) {
          profile.email = primaryEmail.email;
        }
      }
    }

    return profile;
  }
}
