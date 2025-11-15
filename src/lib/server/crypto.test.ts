import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, generateEncryptionKey } from './crypto';

describe('crypto utilities', () => {
  let testKey: string;

  beforeAll(async () => {
    // Generate a test key for all tests
    testKey = await generateEncryptionKey();
  });

  describe('generateEncryptionKey', () => {
    it('generates a base64-encoded key', async () => {
      const key = await generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('generates unique keys', async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });

    it('generates keys of correct length (256-bit)', async () => {
      const key = await generateEncryptionKey();
      const decoded = atob(key);
      expect(decoded.length).toBe(32); // 256 bits = 32 bytes
    });
  });

  describe('encrypt', () => {
    it('encrypts plaintext successfully', async () => {
      const plaintext = 'my-secret-value';
      const encrypted = await encrypt(plaintext, testKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('produces different ciphertext for same plaintext (due to random IV)', async () => {
      const plaintext = 'my-secret-value';
      const encrypted1 = await encrypt(plaintext, testKey);
      const encrypted2 = await encrypt(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('encrypts empty string', async () => {
      const encrypted = await encrypt('', testKey);
      expect(encrypted).toBeDefined();
    });

    it('encrypts long strings', async () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = await encrypt(plaintext, testKey);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('decrypts ciphertext correctly', async () => {
      const plaintext = 'my-secret-value';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('decrypts empty string', async () => {
      const encrypted = await encrypt('', testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe('');
    });

    it('decrypts long strings', async () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('decrypts special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('decrypts unicode characters', async () => {
      const plaintext = '你好世界 🌍 مرحبا';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('throws error with wrong key', async () => {
      const plaintext = 'my-secret-value';
      const encrypted = await encrypt(plaintext, testKey);
      const wrongKey = await generateEncryptionKey();

      await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });

    it('throws error with corrupted ciphertext', async () => {
      const plaintext = 'my-secret-value';
      const encrypted = await encrypt(plaintext, testKey);
      const corrupted = encrypted.slice(0, -5) + 'XXXXX';

      await expect(decrypt(corrupted, testKey)).rejects.toThrow();
    });
  });

  describe('encrypt/decrypt round trip', () => {
    it('handles OAuth client secrets', async () => {
      const secret = 'GOCSPX-1234567890abcdefghijklmnopqr';
      const encrypted = await encrypt(secret, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(secret);
    });

    it('handles API keys', async () => {
      const apiKey = 'sk_test_51234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = await encrypt(apiKey, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(apiKey);
    });

    it('handles JWT tokens', async () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const encrypted = await encrypt(jwt, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(jwt);
    });
  });
});
