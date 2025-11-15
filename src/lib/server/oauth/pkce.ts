/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Implements RFC 7636 for enhanced security in OAuth flows
 */

import type { PKCEChallenge } from '$lib/types/oauth.js';

/**
 * Generate a random string for code verifier
 * Must be 43-128 characters long, using A-Z, a-z, 0-9, -, ., _, ~
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Generate SHA-256 hash and base64url encode
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(hash);
}

/**
 * Base64URL encode (without padding)
 */
function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate PKCE challenge pair (verifier and challenge)
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier);

  return {
    verifier,
    challenge,
    method: 'S256'
  };
}

/**
 * Verify PKCE challenge
 */
export async function verifyPKCEChallenge(verifier: string, challenge: string): Promise<boolean> {
  const computedChallenge = await sha256(verifier);
  return computedChallenge === challenge;
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate random nonce for OpenID Connect
 */
export function generateNonce(): string {
  return generateRandomString(32);
}
