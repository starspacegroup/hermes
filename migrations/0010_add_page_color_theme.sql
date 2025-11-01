-- Add color_theme column to pages table
-- This allows pages to have their own color theme independent of the site theme
-- NULL value means the page will use the site's current theme (light/dark based on user preference)

ALTER TABLE pages ADD COLUMN color_theme TEXT DEFAULT NULL;

-- Existing pages will use NULL, which means they follow the site's current theme

-- Add color_theme column to page_revisions table as well
-- This ensures revisions track the color theme at the time of the revision
ALTER TABLE page_revisions ADD COLUMN color_theme TEXT DEFAULT NULL;
