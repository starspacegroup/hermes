/**
 * Microsoft Entra ID (Azure AD) / OAuth 2.0 Provider
 */

import { BaseOAuthProvider } from '../provider.js';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth.js';

export class MicrosoftOAuthProvider extends BaseOAuthProvider {
  constructor(clientId: string, clientSecret: string, tenant = 'common') {
    const config: OAuthProviderConfig = {
      name: 'microsoft',
      displayName: 'Microsoft',
      icon: '🪟',
      clientId,
      clientSecret,
      authorizationUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      pkceRequired: true,
      supportsRefresh: true
    };
    super(config);
  }

  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    return {
      id: String(data.id || ''),
      email: String(data.mail || data.userPrincipalName || ''),
      name: String(data.displayName || ''),
      picture: '', // Microsoft Graph requires separate call for photo
      email_verified: true
    };
  }
}
