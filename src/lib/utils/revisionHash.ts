/**
 * Utility for generating Git-like revision hashes
 */

/**
 * Generate a short revision hash (8 characters) similar to Git
 * Uses a combination of timestamp and random bytes for uniqueness
 */
export function generateRevisionHash(): string {
  // Use high-resolution timestamp with random component for uniqueness
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  const random3 = Math.random().toString(36).substring(2, 10);

  // Combine all parts
  const combined = (timestamp + random1 + random2 + random3).replace(/[^a-z0-9]/g, '');

  // Take 8 characters from different positions to increase randomness
  let hash = '';
  const step = Math.floor(combined.length / 8);
  for (let i = 0; i < 8 && i * step < combined.length; i++) {
    hash += combined[i * step];
  }

  // Fill remaining if needed
  while (hash.length < 8) {
    hash += Math.floor(Math.random() * 36).toString(36);
  }

  return hash.toLowerCase().substring(0, 8);
}

/**
 * Validate if a string is a valid revision hash
 */
export function isValidRevisionHash(hash: string): boolean {
  return /^[a-z0-9]{8}$/.test(hash);
}

/**
 * Format revision hash for display (can add styling later)
 */
export function formatRevisionHash(hash: string): string {
  return hash.toLowerCase();
}

/**
 * Generate a collision-resistant hash by checking against existing hashes
 * @param existingHashes - Array of existing hashes to check against
 * @returns A unique hash that doesn't exist in the provided array
 */
export function generateUniqueRevisionHash(existingHashes: string[]): string {
  let hash = generateRevisionHash();
  let attempts = 0;
  const maxAttempts = 100;

  // Keep generating until we find a unique hash or hit max attempts
  while (existingHashes.includes(hash) && attempts < maxAttempts) {
    hash = generateRevisionHash();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique revision hash after maximum attempts');
  }

  return hash;
}
