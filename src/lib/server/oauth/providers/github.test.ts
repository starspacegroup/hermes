/**
 * Tests for GitHub OAuth Provider
 */

import { describe, it, expect, vi } from 'vitest';
import { GitHubOAuthProvider } from './github';

describe('GitHubOAuthProvider', () => {
  it('should have correct provider name', () => {
    const provider = new GitHubOAuthProvider('client-id', 'client-secret');
    expect(provider.name).toBe('github');
  });

  it('should normalize user profile with avatar_url', () => {
    const provider = new GitHubOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: 12345,
      email: 'octocat@github.com',
      name: 'The Octocat',
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345'
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized).toEqual({
      id: '12345',
      email: 'octocat@github.com',
      name: 'The Octocat',
      picture: 'https://avatars.githubusercontent.com/u/12345',
      email_verified: true
    });
  });

  it('should fallback to login when name is missing', () => {
    const provider = new GitHubOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: 12345,
      email: 'user@example.com',
      login: 'username'
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized.name).toBe('username');
  });

  it('should handle empty profile data', () => {
    const provider = new GitHubOAuthProvider('client-id', 'client-secret');

    const normalized = provider['normalizeUserProfile']({});

    expect(normalized).toEqual({
      id: '',
      email: '',
      name: '',
      picture: '',
      email_verified: true
    });
  });

  it('should fetch user email if not in profile', async () => {
    const provider = new GitHubOAuthProvider('client-id', 'client-secret');

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ email: 'octocat@github.com', primary: true, verified: true }]
      });

    global.fetch = mockFetch;

    const profile = await provider.getUserProfile('access-token');

    expect(profile.email).toBe('octocat@github.com');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://api.github.com/user/emails', {
      headers: {
        Authorization: 'Bearer access-token',
        Accept: 'application/json'
      }
    });
  });
});
