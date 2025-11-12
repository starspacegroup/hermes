-- Migration: 0014_notifications
-- Description: Create notifications table for in-app notifications
-- Rollback: DROP TABLE notifications;

-- Notifications table: in-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL, -- User who receives the notification
  type TEXT NOT NULL, -- e.g., 'account_expiring', 'account_expired', 'permission_changed', 'role_updated'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT, -- JSON object with additional data
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at INTEGER, -- Unix timestamp when notification was read
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_url TEXT, -- Optional URL to navigate to when clicking notification
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER, -- Optional expiration timestamp for time-sensitive notifications
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_site_id ON notifications(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(site_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(user_id, priority, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
