-- Migration: 0015_fulfillment_providers
-- Description: Add fulfillment providers table and product fulfillment options
-- Rollback: DROP TABLE IF EXISTS product_fulfillment_options; DROP TABLE IF EXISTS fulfillment_providers;

-- Fulfillment providers table (scoped by site)
CREATE TABLE IF NOT EXISTS fulfillment_providers (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER NOT NULL DEFAULT 0, -- 1 for default provider (Self)
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Product fulfillment options (linking table with costs)
CREATE TABLE IF NOT EXISTS product_fulfillment_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES fulfillment_providers(id) ON DELETE CASCADE,
  UNIQUE(product_id, provider_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fulfillment_providers_site_id ON fulfillment_providers(site_id);
CREATE INDEX IF NOT EXISTS idx_product_fulfillment_options_site_id ON product_fulfillment_options(site_id);
CREATE INDEX IF NOT EXISTS idx_product_fulfillment_options_product_id ON product_fulfillment_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_fulfillment_options_provider_id ON product_fulfillment_options(provider_id);

-- Insert default "Self" fulfillment provider for the default site
INSERT OR IGNORE INTO fulfillment_providers (id, site_id, name, description, is_default, is_active)
VALUES ('provider-self-default', 'default-site', 'Self', 'Self-fulfilled by store', 1, 1);
