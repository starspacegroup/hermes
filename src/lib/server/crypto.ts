/**
 * Cryptographic utilities for encrypting sensitive data
 * Uses Web Crypto API available in Cloudflare Workers
 */

/**
 * Encrypts sensitive data using AES-GCM
 * @param plaintext The data to encrypt
 * @param encryptionKey The base64-encoded encryption key from environment
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encrypt(plaintext: string, encryptionKey: string): Promise<string> {
  // Decode the encryption key from base64
  const keyData = Uint8Array.from(atob(encryptionKey), (c) => c.charCodeAt(0));

  // Import the key for AES-GCM
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
    'encrypt'
  ]);

  // Generate a random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param ciphertext Base64-encoded encrypted data with IV prepended
 * @param encryptionKey The base64-encoded encryption key from environment
 * @returns Decrypted plaintext
 */
export async function decrypt(ciphertext: string, encryptionKey: string): Promise<string> {
  // Decode the encryption key from base64
  const keyData = Uint8Array.from(atob(encryptionKey), (c) => c.charCodeAt(0));

  // Import the key for AES-GCM
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
    'decrypt'
  ]);

  // Decode the combined IV + encrypted data from base64
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // Extract IV (first 12 bytes) and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

  // Convert bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generates a new encryption key for use with encrypt/decrypt functions
 * @returns Base64-encoded 256-bit encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ]);

  const exported = await crypto.subtle.exportKey('raw', key);
  const keyBytes = new Uint8Array(exported);
  return btoa(String.fromCharCode(...keyBytes));
}
