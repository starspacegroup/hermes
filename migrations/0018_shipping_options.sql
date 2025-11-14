-- Migration: 0018_shipping_options
-- Description: Add shipping options and product/category shipping assignments
-- Rollback: DROP TABLE IF EXISTS product_shipping_options; DROP TABLE IF EXISTS category_shipping_options; DROP TABLE IF EXISTS shipping_options;

-- Global shipping options table (scoped by site)
CREATE TABLE IF NOT EXISTS shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  carrier TEXT,
  free_shipping_threshold REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Product shipping options (linking table)
CREATE TABLE IF NOT EXISTS product_shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  shipping_option_id TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  price_override REAL,
  threshold_override REAL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_option_id) REFERENCES shipping_options(id) ON DELETE CASCADE,
  UNIQUE(product_id, shipping_option_id)
);

-- Category shipping options (linking table for defaults)
CREATE TABLE IF NOT EXISTS category_shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  category TEXT NOT NULL,
  shipping_option_id TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_option_id) REFERENCES shipping_options(id) ON DELETE CASCADE,
  UNIQUE(category, shipping_option_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_options_site_id ON shipping_options(site_id);
CREATE INDEX IF NOT EXISTS idx_shipping_options_active ON shipping_options(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_shipping_options_site_id ON product_shipping_options(site_id);
CREATE INDEX IF NOT EXISTS idx_product_shipping_options_product_id ON product_shipping_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_shipping_options_shipping_option_id ON product_shipping_options(shipping_option_id);
CREATE INDEX IF NOT EXISTS idx_category_shipping_options_site_id ON category_shipping_options(site_id);
CREATE INDEX IF NOT EXISTS idx_category_shipping_options_category ON category_shipping_options(category);
CREATE INDEX IF NOT EXISTS idx_category_shipping_options_shipping_option_id ON category_shipping_options(shipping_option_id);

-- Insert default shipping options for the default site
INSERT OR IGNORE INTO shipping_options (id, site_id, name, description, price, estimated_days_min, estimated_days_max, carrier, is_active)
VALUES 
  ('ship-standard-default', 'default-site', 'Standard Shipping', 'Delivery in 5-7 business days', 9.99, 5, 7, 'USPS', 1),
  ('ship-express-default', 'default-site', 'Express Shipping', 'Delivery in 2-3 business days', 19.99, 2, 3, 'FedEx', 1),
  ('ship-overnight-default', 'default-site', 'Overnight Shipping', 'Next business day delivery', 29.99, 1, 1, 'FedEx', 1);
