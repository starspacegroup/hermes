import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleOAuthProvider } from './google';

describe('GoogleOAuthProvider', () => {
  let provider: GoogleOAuthProvider;

  beforeEach(() => {
    provider = new GoogleOAuthProvider('google-client-id', 'google-client-secret');
  });

  it('should initialize with correct config', () => {
    expect(provider.name).toBe('google');
  });

  it('should normalize user profile correctly', () => {
    const rawProfile = {
      id: '123456',
      email: 'user@gmail.com',
      name: 'John Doe',
      picture: 'https://example.com/photo.jpg',
      verified_email: true
    };

    // Access protected method for testing
    const normalized = (
      provider as unknown as { normalizeUserProfile: (profile: unknown) => unknown }
    ).normalizeUserProfile(rawProfile);

    expect(normalized).toEqual({
      id: '123456',
      email: 'user@gmail.com',
      name: 'John Doe',
      picture: 'https://example.com/photo.jpg',
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
