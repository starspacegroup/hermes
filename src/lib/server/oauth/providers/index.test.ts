/**
 * Tests for OAuth Provider Factory
 */

import { describe, it, expect } from 'vitest';
import {
  createOAuthProvider,
  GoogleOAuthProvider,
  LinkedInOAuthProvider,
  AppleOAuthProvider,
  FacebookOAuthProvider,
  GitHubOAuthProvider,
  TwitterOAuthProvider,
  MicrosoftOAuthProvider
} from './index';

describe('createOAuthProvider', () => {
  const credentials = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret'
  };

  it('should create GoogleOAuthProvider instance', () => {
    const provider = createOAuthProvider('google', credentials);
    expect(provider).toBeInstanceOf(GoogleOAuthProvider);
    expect(provider.name).toBe('google');
  });

  it('should create LinkedInOAuthProvider instance', () => {
    const provider = createOAuthProvider('linkedin', credentials);
    expect(provider).toBeInstanceOf(LinkedInOAuthProvider);
    expect(provider.name).toBe('linkedin');
  });

  it('should create AppleOAuthProvider instance', () => {
    const provider = createOAuthProvider('apple', credentials);
    expect(provider).toBeInstanceOf(AppleOAuthProvider);
    expect(provider.name).toBe('apple');
  });

  it('should create FacebookOAuthProvider instance', () => {
    const provider = createOAuthProvider('facebook', credentials);
    expect(provider).toBeInstanceOf(FacebookOAuthProvider);
    expect(provider.name).toBe('facebook');
  });

  it('should create GitHubOAuthProvider instance', () => {
    const provider = createOAuthProvider('github', credentials);
    expect(provider).toBeInstanceOf(GitHubOAuthProvider);
    expect(provider.name).toBe('github');
  });

  it('should create TwitterOAuthProvider instance', () => {
    const provider = createOAuthProvider('twitter', credentials);
    expect(provider).toBeInstanceOf(TwitterOAuthProvider);
    expect(provider.name).toBe('twitter');
  });

  it('should create MicrosoftOAuthProvider instance', () => {
    const provider = createOAuthProvider('microsoft', credentials);
    expect(provider).toBeInstanceOf(MicrosoftOAuthProvider);
    expect(provider.name).toBe('microsoft');
  });

  it('should support tenant parameter for Microsoft', () => {
    const provider = createOAuthProvider('microsoft', {
      ...credentials,
      tenant: 'contoso.com'
    });
    expect(provider).toBeInstanceOf(MicrosoftOAuthProvider);
    expect(provider.name).toBe('microsoft');
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      createOAuthProvider('unsupported' as unknown as 'google', credentials);
    }).toThrow('Unsupported OAuth provider: unsupported');
  });
});

describe('Provider Exports', () => {
  it('should export all provider classes', () => {
    expect(GoogleOAuthProvider).toBeDefined();
    expect(LinkedInOAuthProvider).toBeDefined();
    expect(AppleOAuthProvider).toBeDefined();
    expect(FacebookOAuthProvider).toBeDefined();
    expect(GitHubOAuthProvider).toBeDefined();
    expect(TwitterOAuthProvider).toBeDefined();
    expect(MicrosoftOAuthProvider).toBeDefined();
  });
});
