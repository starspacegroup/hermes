/**
 * Tests for Twitter OAuth Provider
 */

import { describe, it, expect } from 'vitest';
import { TwitterOAuthProvider } from './twitter';

describe('TwitterOAuthProvider', () => {
  it('should have correct provider name', () => {
    const provider = new TwitterOAuthProvider('client-id', 'client-secret');
    expect(provider.name).toBe('twitter');
  });

  it('should normalize user profile from nested data structure', () => {
    const provider = new TwitterOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      data: {
        id: '123456789',
        username: 'twitteruser',
        name: 'Twitter User',
        profile_image_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg'
      }
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized).toEqual({
      id: '123456789',
      email: '',
      name: 'Twitter User',
      picture: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
      email_verified: false
    });
  });

  it('should fallback to username when name is missing', () => {
    const provider = new TwitterOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      data: {
        id: '123456789',
        username: 'twitteruser'
      }
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized.name).toBe('twitteruser');
  });

  it('should handle missing data field gracefully', () => {
    const provider = new TwitterOAuthProvider('client-id', 'client-secret');

    const normalized = provider['normalizeUserProfile']({});

    expect(normalized).toEqual({
      id: '',
      email: '',
      name: '',
      picture: '',
      email_verified: false
    });
  });

  it('should mark email as unverified since Twitter may not provide email', () => {
    const provider = new TwitterOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      data: {
        id: '123456789',
        username: 'twitteruser',
        name: 'Twitter User'
      }
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized.email_verified).toBe(false);
  });
});
