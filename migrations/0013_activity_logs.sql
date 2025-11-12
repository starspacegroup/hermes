-- Migration: 0013_activity_logs
-- Description: Create activity logs table for audit trail and activity tracking
-- Rollback: DROP TABLE activity_logs;

-- Activity logs table: comprehensive audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT, -- NULL for system actions
  action TEXT NOT NULL, -- e.g., 'order.created', 'product.updated', 'user.deleted'
  entity_type TEXT NOT NULL, -- e.g., 'order', 'product', 'user', 'page'
  entity_id TEXT, -- ID of the affected entity
  entity_name TEXT, -- Name/title of the affected entity for quick reference
  description TEXT, -- Human-readable description of the action
  metadata TEXT, -- JSON object with additional context (old values, new values, etc.)
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_site_id ON activity_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(site_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(site_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON activity_logs(site_id, severity);
