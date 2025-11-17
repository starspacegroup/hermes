-- Migration: 0024_generic_revisions
-- Description: Create generic revisions table for tracking changes across multiple entity types
-- Rollback: DROP TABLE IF EXISTS revisions; (Note: This is a one-way migration for now)

-- Generic revisions table for tracking changes to any entity type
-- Supports pages, products, and future entities like categories, themes, etc.
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('page', 'product', 'category', 'theme', 'site')),
  entity_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL UNIQUE,
  parent_revision_id TEXT,
  data TEXT NOT NULL, -- JSON snapshot of entity state
  user_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  is_current INTEGER NOT NULL DEFAULT 0, -- Whether this is the current live version
  message TEXT, -- Optional commit message/notes
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_revision_id) REFERENCES revisions(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revisions_site_entity ON revisions(site_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_revisions_hash ON revisions(revision_hash);
CREATE INDEX IF NOT EXISTS idx_revisions_parent ON revisions(parent_revision_id);
CREATE INDEX IF NOT EXISTS idx_revisions_current ON revisions(entity_type, entity_id, is_current);
CREATE INDEX IF NOT EXISTS idx_revisions_created_at ON revisions(entity_type, entity_id, created_at DESC);

-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration:
-- DROP TABLE IF EXISTS revisions;
-- Note: This will delete all revision history. Make sure to backup data before rollback.
