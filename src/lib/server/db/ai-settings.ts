/**
 * AI Settings repository with multi-tenant support
 * All queries are scoped by site_id
 * API keys are encrypted using the crypto module
 */

import type { D1Database } from '@cloudflare/workers-types';
import { generateId, getCurrentTimestamp } from './connection.js';
import { encrypt, decrypt } from '../crypto.js';
import type { AISettings, AIProvider } from '$lib/types/ai-chat';

export interface DBAISetting {
  id: string;
  site_id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'encrypted' | 'number' | 'boolean' | 'json';
  description: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Get all AI settings for a site (with decryption)
 */
export async function getAISettings(
  db: D1Database,
  siteId: string,
  encryptionKey: string
): Promise<AISettings> {
  const result = await db
    .prepare('SELECT * FROM ai_settings WHERE site_id = ?')
    .bind(siteId)
    .all<DBAISetting>();

  const settings: AISettings = {};

  for (const row of result.results || []) {
    let value: string | number | boolean;

    if (row.setting_type === 'encrypted') {
      try {
        value = await decrypt(row.setting_value, encryptionKey);
      } catch (error) {
        console.error(`Failed to decrypt setting ${row.setting_key}:`, error);
        continue;
      }
    } else if (row.setting_type === 'number') {
      value = Number(row.setting_value);
    } else if (row.setting_type === 'boolean') {
      value = row.setting_value === 'true';
    } else {
      value = row.setting_value;
    }

    // Map to AISettings keys
    const key = row.setting_key as keyof AISettings;
    (settings[key] as string | number | boolean) = value;
  }

  return settings;
}

/**
 * Get a specific AI setting (with decryption if needed)
 */
export async function getAISetting(
  db: D1Database,
  siteId: string,
  key: string,
  encryptionKey: string
): Promise<string | number | boolean | null> {
  const result = await db
    .prepare('SELECT * FROM ai_settings WHERE site_id = ? AND setting_key = ?')
    .bind(siteId, key)
    .first<DBAISetting>();

  if (!result) {
    return null;
  }

  if (result.setting_type === 'encrypted') {
    try {
      return await decrypt(result.setting_value, encryptionKey);
    } catch (error) {
      console.error(`Failed to decrypt setting ${key}:`, error);
      return null;
    }
  } else if (result.setting_type === 'number') {
    return Number(result.setting_value);
  } else if (result.setting_type === 'boolean') {
    return result.setting_value === 'true';
  }

  return result.setting_value;
}

/**
 * Update or insert an AI setting (with encryption for sensitive data)
 */
export async function upsertAISetting(
  db: D1Database,
  siteId: string,
  key: string,
  value: string | number | boolean,
  settingType: 'string' | 'encrypted' | 'number' | 'boolean' | 'json',
  encryptionKey: string,
  description?: string
): Promise<void> {
  const id = generateId();
  const now = getCurrentTimestamp();

  let storedValue: string;

  if (settingType === 'encrypted') {
    storedValue = await encrypt(String(value), encryptionKey);
  } else if (settingType === 'number' || settingType === 'boolean') {
    storedValue = String(value);
  } else {
    storedValue = String(value);
  }

  await db
    .prepare(
      `INSERT INTO ai_settings (id, site_id, setting_key, setting_value, setting_type, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(site_id, setting_key) 
       DO UPDATE SET setting_value = ?, setting_type = ?, description = ?, updated_at = ?`
    )
    .bind(
      id,
      siteId,
      key,
      storedValue,
      settingType,
      description || null,
      now,
      now,
      storedValue,
      settingType,
      description || null,
      now
    )
    .run();
}

/**
 * Delete an AI setting
 */
export async function deleteAISetting(db: D1Database, siteId: string, key: string): Promise<void> {
  await db
    .prepare('DELETE FROM ai_settings WHERE site_id = ? AND setting_key = ?')
    .bind(siteId, key)
    .run();
}

/**
 * Check if API keys are configured
 */
export async function hasAPIKeysConfigured(db: D1Database, siteId: string): Promise<boolean> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM ai_settings 
       WHERE site_id = ? AND setting_key IN ('openai_api_key', 'anthropic_api_key', 'grok_api_key')
       AND setting_type = 'encrypted'`
    )
    .bind(siteId)
    .first<{ count: number }>();

  return (result?.count || 0) > 0;
}

/**
 * Get available AI providers (those with API keys configured)
 */
export async function getAvailableProviders(db: D1Database, siteId: string): Promise<AIProvider[]> {
  const result = await db
    .prepare(
      `SELECT setting_key FROM ai_settings 
       WHERE site_id = ? AND setting_key IN ('openai_api_key', 'anthropic_api_key', 'grok_api_key')
       AND setting_type = 'encrypted'`
    )
    .bind(siteId)
    .all<{ setting_key: string }>();

  const providers: AIProvider[] = [];

  for (const row of result.results || []) {
    if (row.setting_key === 'openai_api_key') {
      providers.push('openai');
    } else if (row.setting_key === 'anthropic_api_key') {
      providers.push('anthropic');
    } else if (row.setting_key === 'grok_api_key') {
      providers.push('grok');
    }
  }

  return providers;
}

/**
 * Set default AI configuration
 */
export async function setDefaultAIConfig(
  db: D1Database,
  siteId: string,
  encryptionKey: string
): Promise<void> {
  const defaults = [
    { key: 'preferred_model', value: 'gpt-4o', type: 'string' as const },
    { key: 'temperature', value: '0.7', type: 'number' as const },
    { key: 'max_tokens', value: '4096', type: 'number' as const },
    { key: 'cost_limit_daily', value: '10', type: 'number' as const },
    { key: 'rate_limit_per_minute', value: '10', type: 'number' as const }
  ];

  for (const setting of defaults) {
    await upsertAISetting(
      db,
      siteId,
      setting.key,
      setting.value,
      setting.type,
      encryptionKey,
      undefined
    );
  }
}
