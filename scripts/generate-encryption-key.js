#!/usr/bin/env node

/**
 * Generate a secure encryption key for encrypting SSO provider secrets
 *
 * Usage:
 *   node scripts/generate-encryption-key.js
 *
 * The generated key should be:
 * 1. Stored in .dev.vars for local development: ENCRYPTION_KEY=<key>
 * 2. Added to Cloudflare Workers secrets: wrangler secret put ENCRYPTION_KEY
 */

import { webcrypto } from 'crypto';

async function generateKey() {
  const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ]);

  const exported = await webcrypto.subtle.exportKey('raw', key);
  const keyBytes = new Uint8Array(exported);
  const base64Key = Buffer.from(keyBytes).toString('base64');

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        ENCRYPTION KEY GENERATED                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  console.log('Your encryption key (keep this secret):');
  console.log(`\n${base64Key}\n`);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           SETUP INSTRUCTIONS                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  console.log('1. Local Development:');
  console.log('   Add to .dev.vars file:');
  console.log(`   ENCRYPTION_KEY="${base64Key}"\n`);
  console.log('2. Production/Preview:');
  console.log('   Set as Cloudflare Workers secret:');
  console.log('   echo "<your-key>" | wrangler secret put ENCRYPTION_KEY\n');
  console.log(
    '⚠️  IMPORTANT: Store this key securely. If lost, you cannot decrypt existing secrets!\n'
  );
}

generateKey().catch(console.error);
