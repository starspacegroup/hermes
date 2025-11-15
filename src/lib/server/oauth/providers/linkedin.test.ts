import { describe, it, expect, beforeEach } from 'vitest';
import { LinkedInOAuthProvider } from './linkedin';

describe('LinkedInOAuthProvider', () => {
  let provider: LinkedInOAuthProvider;

  beforeEach(() => {
    provider = new LinkedInOAuthProvider('linkedin-client-id', 'linkedin-client-secret');
  });

  it('should initialize with correct config', () => {
    expect(provider.name).toBe('linkedin');
  });

  it('should normalize user profile correctly', () => {
    const rawProfile = {
      sub: '123456',
      email: 'user@linkedin.com',
      name: 'Jane Smith',
      picture: 'https://linkedin.com/photo.jpg',
      email_verified: true
    };

    const normalized = (
      provider as unknown as { normalizeUserProfile: (profile: unknown) => unknown }
    ).normalizeUserProfile(rawProfile);

    expect(normalized).toEqual({
      id: '123456',
      email: 'user@linkedin.com',
      name: 'Jane Smith',
      picture: 'https://linkedin.com/photo.jpg',
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
});
