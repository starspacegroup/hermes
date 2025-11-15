#!/usr/bin/env node

/**
 * Script to encrypt existing SSO provider client_secret values
 *
 * Usage:
 *   node scripts/encrypt-sso-secrets.js [--local|--remote] [--preview]
 *
 * This script:
 * 1. Fetches all SSO providers from the database
 * 2. Encrypts each client_secret that isn't already encrypted
 * 3. Updates the database with encrypted values
 *
 * IMPORTANT: Set ENCRYPTION_KEY environment variable before running
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isRemote = args.includes('--remote');
const isPreview = args.includes('--preview');

if (!process.env.ENCRYPTION_KEY) {
  console.error('ERROR: ENCRYPTION_KEY environment variable not set');
  console.error('Generate a key by running: node scripts/generate-encryption-key.js');
  process.exit(1);
}

console.log('Encrypting SSO provider client_secret values...');
console.log(
  `Target: ${isLocal ? 'Local' : isRemote ? (isPreview ? 'Preview' : 'Production') : 'Unknown'}`
);

// Build wrangler command
let wranglerCmd = 'wrangler d1 execute hermes-db';
if (isLocal) {
  wranglerCmd += ' --local';
} else if (isRemote) {
  if (isPreview) {
    wranglerCmd += ' --remote --env preview';
  } else {
    wranglerCmd += ' --remote';
  }
}

// Fetch all SSO providers
console.log('\n1. Fetching SSO providers...');
const fetchQuery = 'SELECT id, provider, client_secret FROM sso_providers';
const fetchCmd = `${wranglerCmd} --command "${fetchQuery}"`;

try {
  const _output = execSync(fetchCmd, { encoding: 'utf-8' });
  console.log('Found SSO providers in database');

  // Note: Actual encryption logic would go here
  // For now, this script serves as a template
  console.log('\n⚠️  MANUAL ACTION REQUIRED:');
  console.log('This is a template script. To encrypt existing secrets:');
  console.log('1. Export all SSO provider configurations');
  console.log('2. Delete and re-create them through the admin UI');
  console.log('3. The new values will be automatically encrypted');
} catch (error) {
  console.error('Error fetching SSO providers:', error.message);
  process.exit(1);
}
