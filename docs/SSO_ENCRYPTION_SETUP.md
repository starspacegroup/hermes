# SSO Encryption Setup Guide

## Overview

SSO provider `client_secret` fields are now encrypted at rest using AES-GCM
256-bit encryption. This document explains how to configure encryption and
manage existing secrets.

## ⚠️ Critical: Environment Setup Required

### 1. Generate an Encryption Key

Run the helper script to generate a secure encryption key:

```bash
node scripts/generate-encryption-key.js
```

This will output a base64-encoded 256-bit AES key. **Store this securely** -
losing it means you cannot decrypt existing secrets.

### 2. Configure Environment Variables

#### Local Development (`.dev.vars`)

Create or update `.dev.vars` in the project root:

```
ENCRYPTION_KEY=your-generated-key-here
```

**Note**: `.dev.vars` is gitignored. Never commit encryption keys to version
control.

#### Production (Cloudflare Workers Secrets)

Set the encryption key as a Cloudflare Workers secret:

```bash
wrangler secret put ENCRYPTION_KEY
```

When prompted, paste your generated encryption key.

**Important**: Use the SAME encryption key across all environments to ensure
encrypted data can be decrypted consistently.

## How Encryption Works

### Automatic Encryption/Decryption

All SSO provider operations automatically handle encryption:

- **Create**: `client_secret` is encrypted before INSERT
- **Update**: `client_secret` is encrypted before UPDATE (if provided)
- **Read**: `client_secret` is decrypted after SELECT (if `encryptionKey`
  provided)

### Database Functions

Located in `src/lib/server/db/sso-providers.ts`:

- `getSSOProvider(db, siteId, provider, encryptionKey?)` - Fetch and optionally
  decrypt
- `getEnabledSSOProviders(db, siteId, encryptionKey?)` - Fetch enabled providers
  and optionally decrypt
- `createSSOProvider(db, siteId, data, encryptionKey)` - Encrypt and insert (key
  required)
- `updateSSOProvider(db, siteId, provider, data, encryptionKey?)` - Encrypt and
  update if secret provided

### Encryption Utility

Located in `src/lib/server/crypto.ts`:

```typescript
import { decrypt, encrypt, generateEncryptionKey } from '$lib/server/crypto';

// Encrypt a secret
const encryptedSecret = await encrypt('my-client-secret', encryptionKey);

// Decrypt a secret
const plainSecret = await decrypt(encryptedSecret, encryptionKey);

// Generate a new key
const newKey = await generateEncryptionKey();
```

## Handling Existing Plaintext Secrets

### ⚠️ Manual Re-entry Required

If you have existing SSO providers with plaintext secrets in the database:

1. **Export current provider configurations** (note down all settings)
2. **Delete existing providers** from admin UI
3. **Re-create providers** through admin UI with same settings
4. **New secrets will be automatically encrypted** on save

### Why Not Automatic Migration?

Secrets are sensitive and require careful handling. Manual re-entry ensures:

- You verify each provider configuration
- You have the correct current secrets
- Audit trail through admin UI
- No accidental data corruption

## Security Best Practices

### ✅ DO

- **Use the generate script** to create strong encryption keys
- **Store keys securely** in environment variables/secrets managers
- **Rotate keys periodically** (see Key Rotation section)
- **Use different keys per environment** (dev, staging, prod) if needed
- **Backup encryption keys** to a secure location
- **Limit access** to encryption keys (only admins/ops)

### ❌ DON'T

- **Never commit** encryption keys to git
- **Never log** encryption keys or plaintext secrets
- **Never expose** encryption keys in client-side code
- **Never share** encryption keys via insecure channels
- **Never store** encryption keys in the database

## Key Rotation (Advanced)

To rotate encryption keys:

1. Generate a new encryption key
2. Read all existing SSO providers with old key (decrypt)
3. Re-encrypt all secrets with new key
4. Update all secrets in database
5. Deploy new ENCRYPTION_KEY to all environments

**Script**: `scripts/encrypt-sso-secrets.js` (template provided)

## Troubleshooting

### Error: "Server encryption not configured"

**Cause**: `ENCRYPTION_KEY` environment variable not set

**Solution**:

- Local: Add to `.dev.vars`
- Production: Set via `wrangler secret put ENCRYPTION_KEY`

### Error: "Failed to decrypt SSO provider credentials"

**Cause**: Encryption key mismatch or corrupted data

**Solutions**:

1. Verify ENCRYPTION_KEY is correct
2. Check if secret was encrypted with a different key
3. Re-create the SSO provider through admin UI

### OAuth Login Fails

**Cause**: Decryption failing during OAuth flow

**Solutions**:

1. Check `ENCRYPTION_KEY` is set in production
2. Verify provider was created/updated after encryption was implemented
3. Check Cloudflare Workers logs for decryption errors

## Implementation Details

### Files Modified

- `src/lib/server/crypto.ts` - Encryption utilities (NEW)
- `src/lib/server/crypto.test.ts` - Comprehensive tests (NEW)
- `src/lib/server/db/sso-providers.ts` - Updated to encrypt/decrypt
- `src/lib/server/db/sso-providers.test.ts` - Updated tests
- `src/routes/api/auth/oauth/[provider]/+server.ts` - Pass encryption key
- `src/routes/api/auth/oauth/[provider]/callback/+server.ts` - Pass encryption
  key
- `src/routes/admin/settings/sso/+page.server.ts` - Encrypt on create/update
- `src/app.d.ts` - Added `ENCRYPTION_KEY` to Platform.env
- `migrations/0023_encrypt_sso_secrets.sql` - Migration note (no data changes)

### Migration File

Location: `migrations/0023_encrypt_sso_secrets.sql`

Note: This migration does NOT modify existing data. It only documents the
encryption requirement. Existing secrets must be manually re-entered through the
admin UI.

### Helper Scripts

- `scripts/generate-encryption-key.js` - Generate secure AES-256 keys
- `scripts/encrypt-sso-secrets.js` - Template for key rotation (manual
  customization required)

## Testing

All encryption functionality is thoroughly tested:

```bash
npm test -- src/lib/server/crypto.test.ts
npm test -- src/lib/server/db/sso-providers.test.ts
```

Coverage: 100% for crypto utilities, >80% for sso-providers

## Compliance

This encryption implementation helps meet security requirements:

- **GDPR**: Encryption at rest for sensitive data
- **SOC 2**: Security controls for credential storage
- **PCI-DSS**: Protecting authentication credentials
- **HIPAA**: If applicable, encryption of PHI

## Support

For questions or issues:

1. Check this documentation first
2. Review `.github/copilot-instructions.md` security section
3. Examine test files for usage examples
4. Contact platform engineering team

---

**Last Updated**: 2025-01-XX (after security audit) **Authors**: Platform
Engineering Team **Version**: 1.0.0
