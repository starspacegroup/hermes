-- Product Media table for storing multiple images/videos per product
-- Scoped by site_id through product relationship

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT, -- For videos or optimized image thumbnails
  filename TEXT NOT NULL,
  size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For videos in seconds
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Media library table for reusable media across products
CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0, -- Track usage across products
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_site_id ON product_media(site_id);
CREATE INDEX IF NOT EXISTS idx_product_media_order ON product_media(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_media_library_site_id ON media_library(site_id);
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(site_id, type);
