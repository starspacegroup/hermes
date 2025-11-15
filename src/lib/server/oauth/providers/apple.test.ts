import { describe, it, expect, beforeEach } from 'vitest';
import { AppleOAuthProvider } from './apple';

describe('AppleOAuthProvider', () => {
  let provider: AppleOAuthProvider;

  beforeEach(() => {
    provider = new AppleOAuthProvider('apple-client-id', 'apple-client-secret');
  });

  it('should initialize with correct config', () => {
    expect(provider.name).toBe('apple');
  });

  it('should normalize user profile correctly', () => {
    const rawProfile = {
      sub: 'apple-user-123',
      email: 'user@icloud.com',
      name: 'John Apple',
      email_verified: 'true'
    };

    const normalized = (
      provider as unknown as { normalizeUserProfile: (profile: unknown) => unknown }
    ).normalizeUserProfile(rawProfile);

    expect(normalized).toEqual({
      id: 'apple-user-123',
      email: 'user@icloud.com',
      name: 'John Apple',
      picture: '',
      email_verified: true
    });
  });

  it('should handle missing fields in profile', () => {
    const rawProfile = {};
    const normalized = (
      provider as unknown as { normalizeUserProfile: (profile: unknown) => unknown }
    ).normalizeUserProfile(rawProfile);

    expect(normalized).toEqual({
      id: '',
      email: '',
      name: '',
      picture: '',
      email_verified: false
    });
  });

  it('should throw error when getUserProfile is called', async () => {
    await expect(provider.getUserProfile('token')).rejects.toThrow(
      'Apple user profile should be extracted from ID token'
    );
  });
});
