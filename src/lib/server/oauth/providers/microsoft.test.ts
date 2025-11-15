/**
 * Tests for Microsoft OAuth Provider
 */

import { describe, it, expect } from 'vitest';
import { MicrosoftOAuthProvider } from './microsoft';

describe('MicrosoftOAuthProvider', () => {
  it('should have correct provider name', () => {
    const provider = new MicrosoftOAuthProvider('client-id', 'client-secret');
    expect(provider.name).toBe('microsoft');
  });

  it('should support custom tenant parameter', () => {
    const provider = new MicrosoftOAuthProvider('client-id', 'client-secret', 'contoso.com');
    expect(provider.name).toBe('microsoft');
  });

  it('should normalize user profile with displayName', () => {
    const provider = new MicrosoftOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: 'abc-123',
      mail: 'user@contoso.com',
      displayName: 'John Doe',
      userPrincipalName: 'john.doe@contoso.com'
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized).toEqual({
      id: 'abc-123',
      email: 'user@contoso.com',
      name: 'John Doe',
      picture: '',
      email_verified: true
    });
  });

  it('should fallback to userPrincipalName when mail is missing', () => {
    const provider = new MicrosoftOAuthProvider('client-id', 'client-secret');

    const rawProfile = {
      id: 'abc-123',
      userPrincipalName: 'john.doe@contoso.com',
      displayName: 'John Doe'
    };

    const normalized = provider['normalizeUserProfile'](rawProfile);

    expect(normalized.email).toBe('john.doe@contoso.com');
  });

  it('should handle empty profile data', () => {
    const provider = new MicrosoftOAuthProvider('client-id', 'client-secret');

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
