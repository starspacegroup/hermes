import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseOAuthProvider } from './provider';
import type { OAuthProviderConfig, OAuthUserProfile } from '$lib/types/oauth';

// Mock PKCE functions
vi.mock('./pkce.js', () => ({
  generatePKCEChallenge: vi.fn().mockResolvedValue({
    verifier: 'test-verifier-123',
    challenge: 'test-challenge-456',
    method: 'S256'
  }),
  generateState: vi.fn().mockReturnValue('test-state-789'),
  generateNonce: vi.fn().mockReturnValue('test-nonce-abc')
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Concrete test implementation of BaseOAuthProvider
class TestOAuthProvider extends BaseOAuthProvider {
  protected normalizeUserProfile(data: Record<string, unknown>): OAuthUserProfile {
    return {
      id: String(data.id || ''),
      email: String(data.email || ''),
      name: String(data.name || ''),
      picture: String(data.picture || ''),
      email_verified: Boolean(data.email_verified)
    };
  }
}

describe('BaseOAuthProvider', () => {
  let provider: TestOAuthProvider;
  let config: OAuthProviderConfig;

  beforeEach(() => {
    config = {
      name: 'test',
      displayName: 'Test Provider',
      icon: '🧪',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://test.com/oauth/authorize',
      tokenUrl: 'https://test.com/oauth/token',
      userInfoUrl: 'https://test.com/oauth/userinfo',
      scopes: ['email', 'profile'],
      pkceRequired: true,
      supportsRefresh: true
    };

    provider = new TestOAuthProvider(config);
    mockFetch.mockClear();
  });

  describe('name property', () => {
    it('should return provider name', () => {
      expect(provider.name).toBe('test');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with PKCE', async () => {
      const redirectUri = 'https://app.com/callback';
      const result = await provider.getAuthorizationUrl(redirectUri);

      expect(result).toHaveProperty('authUrl');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('codeVerifier');
      expect(result).toHaveProperty('codeChallenge');
      expect(result).toHaveProperty('nonce');
    });

    it('should include all required parameters in URL', async () => {
      const redirectUri = 'https://app.com/callback';
      const result = await provider.getAuthorizationUrl(redirectUri);

      const url = new URL(result.authUrl);
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toBe('email profile');
      expect(url.searchParams.get('state')).toBe('test-state-789');
      expect(url.searchParams.get('code_challenge')).toBe('test-challenge-456');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should not include nonce for non-OpenID providers', async () => {
      const result = await provider.getAuthorizationUrl('https://app.com/callback');
      const url = new URL(result.authUrl);

      // Non-OpenID provider shouldn't have nonce
      expect(url.searchParams.has('nonce')).toBe(false);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockTokens = {
        access_token: 'access-token-123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token-456',
        scope: 'email profile'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens
      });

      const result = await provider.exchangeCodeForTokens(
        'auth-code-123',
        'https://app.com/callback',
        'verifier-123'
      );

      expect(result).toEqual(mockTokens);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          })
        })
      );
    });

    it('should include all required parameters in token request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      });

      await provider.exchangeCodeForTokens(
        'auth-code-123',
        'https://app.com/callback',
        'verifier-123'
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = new URLSearchParams(callArgs[1].body);

      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('redirect_uri')).toBe('https://app.com/callback');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-client-secret');
      expect(body.get('code_verifier')).toBe('verifier-123');
    });

    it('should throw error on failed token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid authorization code'
      });

      await expect(
        provider.exchangeCodeForTokens('invalid-code', 'https://app.com/callback', 'verifier')
      ).rejects.toThrow('Token exchange failed: Invalid authorization code');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens
      });

      const result = await provider.refreshAccessToken('old-refresh-token');

      expect(result).toEqual(mockTokens);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/oauth/token',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should include correct parameters in refresh request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      });

      await provider.refreshAccessToken('refresh-token-123');

      const callArgs = mockFetch.mock.calls[0];
      const body = new URLSearchParams(callArgs[1].body);

      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('refresh-token-123');
      expect(body.get('client_id')).toBe('test-client-id');
      expect(body.get('client_secret')).toBe('test-client-secret');
    });

    it('should throw error if provider does not support refresh', async () => {
      const noRefreshConfig = { ...config, supportsRefresh: false };
      const noRefreshProvider = new TestOAuthProvider(noRefreshConfig);

      await expect(noRefreshProvider.refreshAccessToken('token')).rejects.toThrow(
        'Provider test does not support token refresh'
      );
    });

    it('should throw error on failed refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid refresh token'
      });

      await expect(provider.refreshAccessToken('invalid-token')).rejects.toThrow(
        'Token refresh failed: Invalid refresh token'
      );
    });
  });

  describe('getUserProfile', () => {
    it('should fetch and normalize user profile', async () => {
      const mockProfile = {
        id: '12345',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile
      });

      const result = await provider.getUserProfile('access-token-123');

      expect(result).toEqual({
        id: '12345',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/oauth/userinfo',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
            Accept: 'application/json'
          })
        })
      );
    });

    it('should throw error on failed profile fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Unauthorized'
      });

      await expect(provider.getUserProfile('invalid-token')).rejects.toThrow(
        'Failed to fetch user profile: Unauthorized'
      );
    });
  });
});
