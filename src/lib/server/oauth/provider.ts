/**
 * Base OAuth Provider Adapter
 * Unified interface for all OAuth 2.0 providers
 */

import type {
  OAuthProvider,
  OAuthProviderConfig,
  OAuthTokenResponse,
  OAuthUserProfile
} from '$lib/types/oauth.js';
import { generatePKCEChallenge, generateState, generateNonce } from './pkce.js';

export interface OAuthAuthorizationParams {
  authUrl: string;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  nonce?: string;
}

export abstract class BaseOAuthProvider {
  protected config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  /**
   * Get provider name
   */
  get name(): OAuthProvider {
    return this.config.name as OAuthProvider;
  }

  /**
   * Generate authorization URL with PKCE
   */
  async getAuthorizationUrl(redirectUri: string): Promise<OAuthAuthorizationParams> {
    const state = generateState();
    const pkce = await generatePKCEChallenge();
    const nonce = generateNonce();

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: pkce.challenge,
      code_challenge_method: pkce.method
    });

    // Add nonce for OpenID Connect providers
    if (this.supportsOpenIDConnect()) {
      params.set('nonce', nonce);
    }

    const authUrl = `${this.config.authorizationUrl}?${params.toString()}`;

    return {
      authUrl,
      state,
      codeVerifier: pkce.verifier,
      codeChallenge: pkce.challenge,
      nonce
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: codeVerifier
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return (await response.json()) as OAuthTokenResponse;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    if (!this.config.supportsRefresh) {
      throw new Error(`Provider ${this.config.name} does not support token refresh`);
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return (await response.json()) as OAuthTokenResponse;
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user profile: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.normalizeUserProfile(data);
  }

  /**
   * Normalize user profile to standard format
   * Override in provider-specific implementations
   */
  protected abstract normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile;

  /**
   * Check if provider supports OpenID Connect
   */
  protected supportsOpenIDConnect(): boolean {
    return ['google', 'apple', 'microsoft'].includes(this.config.name);
  }
}
