/**
 * Tests for Facebook OAuth Provider
 */

import { describe, it, expect } from 'vitest';
import { FacebookOAuthProvider } from './facebook';

describe('FacebookOAuthProvider', () => {
  it('should have correct provider name', () => {
    const provider = new FacebookOAuthProvider('client-id', 'client-secret');
    expect(provider.name).toBe('facebook');
  });

  it('should normalize user profile with picture data', () => {
    const provider = new FacebookOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: '123456789',
      email: 'user@example.com',
      name: 'John Doe',
      picture: {
        data: {
          url: 'https://graph.facebook.com/123/picture'
        }
      }
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized).toEqual({
      id: '123456789',
      email: 'user@example.com',
      name: 'John Doe',
      picture: 'https://graph.facebook.com/123/picture',
      email_verified: true
    });
  });

  it('should handle missing picture data gracefully', () => {
    const provider = new FacebookOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: '123456789',
      email: 'user@example.com',
      name: 'John Doe'
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized.picture).toBe('');
  });

  it('should handle empty profile data', () => {
    const provider = new FacebookOAuthProvider('client-id', 'client-secret');

    const normalized = provider['normalizeUserProfile']({});

    expect(normalized).toEqual({
      id: '',
      email: '',
      name: '',
      picture: '',
      email_verified: true
    });
  });
});
