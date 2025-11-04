-- Migration: 0011_advanced_user_management
-- Description: Enhance users table with permissions, expiration, status tracking, and last login
-- Rollback: Would require recreating users table with original schema

-- Step 1: Create a new users table with enhanced fields
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'user', 'customer', 'platform_engineer')),
  permissions TEXT DEFAULT '[]', -- JSON array of permission strings
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'suspended')),
  expiration_date INTEGER, -- Unix timestamp, NULL means no expiration
  grace_period_days INTEGER DEFAULT 0, -- Days after expiration before auto-deactivation
  last_login_at INTEGER, -- Unix timestamp of last login
  last_login_ip TEXT, -- IP address of last login
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_by TEXT, -- User ID who created this user
  updated_by TEXT, -- User ID who last updated this user
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, email)
);

-- Step 2: Copy existing data from old users table
INSERT INTO users_new (
  id, site_id, email, name, password_hash, role, 
  created_at, updated_at, permissions, status
)
SELECT 
  id, site_id, email, name, password_hash, role, 
  created_at, updated_at, '[]', 'active'
FROM users;

-- Step 3: Drop old users table
DROP TABLE users;

-- Step 4: Rename new table to users
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate indexes with additional ones for new fields
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(site_id, email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(site_id, status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(site_id, role);
CREATE INDEX IF NOT EXISTS idx_users_expiration ON users(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL;
