/**
 * SSO Provider repository for managing OAuth provider configurations per site
 *
 * SECURITY: Client secrets are encrypted at rest using AES-GCM encryption
 */

import type { D1Database } from '@cloudflare/workers-types';
import { generateId, getCurrentTimestamp } from './connection.js';
import type { OAuthProvider } from '$lib/types/oauth.js';
import { encrypt, decrypt } from '../crypto.js';

export interface SSOProvider {
  id: string;
  site_id: string;
  provider: OAuthProvider;
  enabled: number; // 0 = disabled, 1 = enabled
  client_id: string;
  client_secret: string;
  tenant: string | null; // For Microsoft OAuth
  display_name: string | null;
  icon: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

/**
 * SSO Provider without sensitive data (for admin UI list view)
 */
export type SSOProviderSafe = Omit<SSOProvider, 'client_secret'>;

export interface CreateSSOProviderData {
  provider: OAuthProvider;
  enabled: boolean;
  client_id: string;
  client_secret: string;
  tenant?: string;
  display_name?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateSSOProviderData {
  enabled?: boolean;
  client_id?: string;
  client_secret?: string;
  tenant?: string;
  display_name?: string;
  icon?: string;
  sort_order?: number;
}

/**
 * Get all SSO providers for a site
 * Note: client_secret is excluded from results for security
 */
export async function getSSOProviders(db: D1Database, siteId: string): Promise<SSOProviderSafe[]> {
  const result = await db
    .prepare(
      'SELECT id, site_id, provider, enabled, client_id, tenant, display_name, icon, sort_order, created_at, updated_at FROM sso_providers WHERE site_id = ? ORDER BY sort_order, provider'
    )
    .bind(siteId)
    .all<SSOProviderSafe>();

  return result.results || [];
}

/**
 * Get a specific SSO provider by provider name
 * @param encryptionKey Required for decrypting client_secret
 */
export async function getSSOProvider(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider,
  encryptionKey?: string
): Promise<SSOProvider | null> {
  const result = await db
    .prepare('SELECT * FROM sso_providers WHERE site_id = ? AND provider = ?')
    .bind(siteId, provider)
    .first<SSOProvider>();

  if (!result) {
    return null;
  }

  // Decrypt client_secret if encryption key provided
  if (encryptionKey && result.client_secret) {
    try {
      result.client_secret = await decrypt(result.client_secret, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt client_secret:', error);
      throw new Error('Failed to decrypt SSO provider credentials');
    }
  }

  return result;
}

/**
 * Get only enabled SSO providers for a site
 * @param encryptionKey Required for decrypting client_secret
 */
export async function getEnabledSSOProviders(
  db: D1Database,
  siteId: string,
  encryptionKey?: string
): Promise<SSOProvider[]> {
  const result = await db
    .prepare(
      'SELECT * FROM sso_providers WHERE site_id = ? AND enabled = 1 ORDER BY sort_order, provider'
    )
    .bind(siteId)
    .all<SSOProvider>();

  const providers = result.results || [];

  // Decrypt client_secret for all providers if encryption key provided
  if (encryptionKey) {
    for (const provider of providers) {
      if (provider.client_secret) {
        try {
          provider.client_secret = await decrypt(provider.client_secret, encryptionKey);
        } catch (error) {
          console.error(`Failed to decrypt client_secret for ${provider.provider}:`, error);
          throw new Error('Failed to decrypt SSO provider credentials');
        }
      }
    }
  }

  return providers;
}

/**
 * Create a new SSO provider configuration
 * @param encryptionKey Required for encrypting client_secret
 */
export async function createSSOProvider(
  db: D1Database,
  siteId: string,
  data: CreateSSOProviderData,
  encryptionKey: string
): Promise<SSOProvider> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  // Encrypt the client_secret before storing
  const encryptedSecret = await encrypt(data.client_secret, encryptionKey);

  await db
    .prepare(
      `INSERT INTO sso_providers (
        id, site_id, provider, enabled, client_id, client_secret, 
        tenant, display_name, icon, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.provider,
      data.enabled ? 1 : 0,
      data.client_id,
      encryptedSecret,
      data.tenant || null,
      data.display_name || null,
      data.icon || null,
      data.sort_order || 0,
      timestamp,
      timestamp
    )
    .run();

  const provider = await getSSOProvider(db, siteId, data.provider, encryptionKey);
  if (!provider) {
    throw new Error('Failed to create SSO provider');
  }

  return provider;
}

/**
 * Update an existing SSO provider
 * @param encryptionKey Required if updating client_secret
 */
export async function updateSSOProvider(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider,
  data: UpdateSSOProviderData,
  encryptionKey?: string
): Promise<SSOProvider | null> {
  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.enabled !== undefined) {
    updates.push('enabled = ?');
    params.push(data.enabled ? 1 : 0);
  }
  if (data.client_id !== undefined) {
    updates.push('client_id = ?');
    params.push(data.client_id);
  }
  if (data.client_secret !== undefined) {
    if (!encryptionKey) {
      throw new Error('Encryption key required to update client_secret');
    }
    // Encrypt the new client_secret before storing
    const encryptedSecret = await encrypt(data.client_secret, encryptionKey);
    updates.push('client_secret = ?');
    params.push(encryptedSecret);
  }
  if (data.tenant !== undefined) {
    updates.push('tenant = ?');
    params.push(data.tenant || null);
  }
  if (data.display_name !== undefined) {
    updates.push('display_name = ?');
    params.push(data.display_name || null);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    params.push(data.icon || null);
  }
  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (updates.length === 0) {
    return await getSSOProvider(db, siteId, provider, encryptionKey);
  }

  updates.push('updated_at = ?');
  params.push(timestamp);

  params.push(siteId);
  params.push(provider);

  await db
    .prepare(`UPDATE sso_providers SET ${updates.join(', ')} WHERE site_id = ? AND provider = ?`)
    .bind(...params)
    .run();

  return await getSSOProvider(db, siteId, provider, encryptionKey);
}

/**
 * Batch update sort orders for multiple SSO providers
 */
export async function reorderSSOProviders(
  db: D1Database,
  siteId: string,
  providerOrders: Array<{ provider: OAuthProvider; sort_order: number }>
): Promise<void> {
  const timestamp = getCurrentTimestamp();

  // Use a batch transaction for atomic updates
  const batch = providerOrders.map(({ provider, sort_order }) =>
    db
      .prepare(
        'UPDATE sso_providers SET sort_order = ?, updated_at = ? WHERE site_id = ? AND provider = ?'
      )
      .bind(sort_order, timestamp, siteId, provider)
  );

  await db.batch(batch);
}

/**
 * Disable an SSO provider (soft delete - preserves settings)
 */
export async function disableSSOProvider(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider
): Promise<void> {
  const timestamp = getCurrentTimestamp();
  await db
    .prepare(
      'UPDATE sso_providers SET enabled = 0, updated_at = ? WHERE site_id = ? AND provider = ?'
    )
    .bind(timestamp, siteId, provider)
    .run();
}

/**
 * Delete an SSO provider (hard delete - removes all data)
 */
export async function deleteSSOProvider(
  db: D1Database,
  siteId: string,
  provider: OAuthProvider
): Promise<void> {
  await db
    .prepare('DELETE FROM sso_providers WHERE site_id = ? AND provider = ?')
    .bind(siteId, provider)
    .run();
}
