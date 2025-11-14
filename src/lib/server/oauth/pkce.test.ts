/**
 * Tests for PKCE utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generatePKCEChallenge,
  verifyPKCEChallenge,
  generateState,
  generateNonce
} from './pkce.js';

describe('PKCE Utilities', () => {
  describe('generatePKCEChallenge', () => {
    it('should generate a valid PKCE challenge pair', async () => {
      const challenge = await generatePKCEChallenge();

      expect(challenge).toHaveProperty('verifier');
      expect(challenge).toHaveProperty('challenge');
      expect(challenge).toHaveProperty('method');
      expect(challenge.method).toBe('S256');
    });

    it('should generate verifier of correct length', async () => {
      const challenge = await generatePKCEChallenge();
      expect(challenge.verifier.length).toBe(128);
    });

    it('should generate verifier with valid characters', async () => {
      const challenge = await generatePKCEChallenge();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(challenge.verifier).toMatch(validChars);
    });

    it('should generate unique challenges', async () => {
      const challenge1 = await generatePKCEChallenge();
      const challenge2 = await generatePKCEChallenge();

      expect(challenge1.verifier).not.toBe(challenge2.verifier);
      expect(challenge1.challenge).not.toBe(challenge2.challenge);
    });

    it('should generate challenge without padding', async () => {
      const challenge = await generatePKCEChallenge();
      expect(challenge.challenge).not.toContain('=');
    });
  });

  describe('verifyPKCEChallenge', () => {
    it('should verify a valid challenge', async () => {
      const { verifier, challenge } = await generatePKCEChallenge();
      const isValid = await verifyPKCEChallenge(verifier, challenge);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid challenge', async () => {
      const { verifier } = await generatePKCEChallenge();
      const wrongChallenge = 'invalid_challenge_value';
      const isValid = await verifyPKCEChallenge(verifier, wrongChallenge);
      expect(isValid).toBe(false);
    });

    it('should reject a wrong verifier', async () => {
      const { challenge } = await generatePKCEChallenge();
      const wrongVerifier = 'wrong_verifier_value_here_12345678901234567890';
      const isValid = await verifyPKCEChallenge(wrongVerifier, challenge);
      expect(isValid).toBe(false);
    });
  });

  describe('generateState', () => {
    it('should generate a state string', () => {
      const state = generateState();
      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
      expect(state.length).toBe(32);
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('should contain valid characters', () => {
      const state = generateState();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(state).toMatch(validChars);
    });
  });

  describe('generateNonce', () => {
    it('should generate a nonce string', () => {
      const nonce = generateNonce();
      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBe(32);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should contain valid characters', () => {
      const nonce = generateNonce();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(nonce).toMatch(validChars);
    });
  });
});
