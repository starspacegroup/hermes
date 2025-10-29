-- Add support for additional widget types
-- This migration adds hero, button, spacer, columns, heading, and divider widget types

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
-- So we need to recreate the table with the updated constraint

-- 1. Create a new table with the updated CHECK constraint
CREATE TABLE IF NOT EXISTS page_widgets_new (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single_product', 'product_list', 'text', 'image', 'hero', 'button', 'spacer', 'columns', 'heading', 'divider')),
  config TEXT NOT NULL, -- JSON configuration for the widget
  position INTEGER NOT NULL DEFAULT 0, -- Order of widget on page
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- 2. Copy existing data from old table
INSERT INTO page_widgets_new SELECT * FROM page_widgets;

-- 3. Drop the old table
DROP TABLE page_widgets;

-- 4. Rename new table to original name
ALTER TABLE page_widgets_new RENAME TO page_widgets;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_page_widgets_page_id ON page_widgets(page_id);
CREATE INDEX IF NOT EXISTS idx_page_widgets_position ON page_widgets(page_id, position);
