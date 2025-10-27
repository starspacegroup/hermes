-- Add platform_engineer role to users table
-- This migration extends the user roles to support platform engineers with elevated permissions

-- SQLite doesn't support ALTER TABLE ... MODIFY CONSTRAINT directly
-- We need to recreate the table with the new constraint

-- Step 1: Create a new temporary table with the updated role constraint
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'customer', 'platform_engineer')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, email)
);

-- Step 2: Copy data from the old table to the new table
INSERT INTO users_new (id, site_id, email, name, password_hash, role, created_at, updated_at)
SELECT id, site_id, email, name, password_hash, role, created_at, updated_at
FROM users;

-- Step 3: Drop the old table
DROP TABLE users;

-- Step 4: Rename the new table to the original name
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate the indexes
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(site_id, email);
