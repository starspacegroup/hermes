-- Migration: 0021_sso_providers
-- Description: Add SSO provider configuration table for per-site OAuth provider management
-- Allows admins to configure which SSO providers are enabled and provide credentials per site
-- Rollback: DROP TABLE IF EXISTS sso_providers;

-- SSO Providers table
-- Stores OAuth provider configuration per site
CREATE TABLE IF NOT EXISTS sso_providers (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'linkedin', 'apple', 'facebook', 'github', 'twitter', 'microsoft')),
  enabled INTEGER NOT NULL DEFAULT 0, -- 0 = disabled, 1 = enabled
  client_id TEXT NOT NULL, -- OAuth client ID
  client_secret TEXT NOT NULL, -- OAuth client secret (ENCRYPTED - see src/lib/server/crypto.ts)
  tenant TEXT, -- For Microsoft OAuth (e.g., 'common', 'organizations', or tenant ID)
  display_name TEXT, -- Custom display name (optional)
  icon TEXT, -- Custom icon (optional)
  sort_order INTEGER NOT NULL DEFAULT 0, -- Display order on login page
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, provider) -- One configuration per provider per site
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sso_providers_site ON sso_providers(site_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled ON sso_providers(site_id, enabled);
