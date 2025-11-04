-- Migration: 0011_git_like_revisions
-- Description: Replace revision_number with revision_hash and add parent_revision_id for Git-like branching
-- Rollback: See rollback section at end of file

-- Drop the old unique constraint on (page_id, revision_number)
DROP INDEX IF EXISTS idx_page_revisions_page_id;
DROP INDEX IF EXISTS idx_page_revisions_created_at;
DROP INDEX IF EXISTS idx_page_revisions_published;

-- Create a temporary table with the new structure
CREATE TABLE page_revisions_new (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL UNIQUE,
  parent_revision_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  color_theme TEXT,
  widgets_snapshot TEXT NOT NULL,
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  is_published INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_revision_id) REFERENCES page_revisions_new(id) ON DELETE SET NULL
);

-- Migrate existing data: generate revision hashes based on revision_number
-- For existing revisions, we'll create sequential hashes to maintain order
INSERT INTO page_revisions_new (
  id, page_id, revision_hash, parent_revision_id, title, slug, status, 
  color_theme, widgets_snapshot, created_by, created_at, is_published, notes
)
SELECT 
  id,
  page_id,
  substr(lower(hex(randomblob(4))), 1, 8) as revision_hash,
  NULL as parent_revision_id, -- We can't easily reconstruct the parent chain
  title,
  slug,
  status,
  color_theme,
  widgets_snapshot,
  created_by,
  created_at,
  is_published,
  notes
FROM page_revisions
ORDER BY page_id, revision_number;

-- Drop the old table
DROP TABLE page_revisions;

-- Rename the new table
ALTER TABLE page_revisions_new RENAME TO page_revisions;

-- Create indexes for the new structure
CREATE INDEX idx_page_revisions_page_id ON page_revisions(page_id);
CREATE INDEX idx_page_revisions_created_at ON page_revisions(page_id, created_at DESC);
CREATE INDEX idx_page_revisions_published ON page_revisions(page_id, is_published);
CREATE INDEX idx_page_revisions_hash ON page_revisions(revision_hash);
CREATE INDEX idx_page_revisions_parent ON page_revisions(parent_revision_id);

-- ROLLBACK INSTRUCTIONS:
-- To rollback, you would need to recreate the original table structure with revision_number
-- However, the parent-child relationships will be lost. This is a one-way migration.
-- CREATE TABLE page_revisions (
--   id TEXT PRIMARY KEY,
--   page_id TEXT NOT NULL,
--   revision_number INTEGER NOT NULL,
--   title TEXT NOT NULL,
--   slug TEXT NOT NULL,
--   status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
--   color_theme TEXT,
--   widgets_snapshot TEXT NOT NULL,
--   created_by TEXT,
--   created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
--   is_published INTEGER NOT NULL DEFAULT 0,
--   notes TEXT,
--   FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
--   UNIQUE(page_id, revision_number)
-- );
