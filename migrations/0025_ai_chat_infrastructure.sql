-- Migration: 0025_ai_chat_infrastructure
-- Description: Add AI chat infrastructure for product creation assistant
-- Creates tables for AI sessions (conversation history) and AI settings (API keys, model preferences)
-- Rollback: DROP TABLE IF EXISTS ai_sessions; DROP TABLE IF EXISTS ai_settings;

-- AI Sessions table
-- Stores conversation history and state for AI chat sessions
CREATE TABLE IF NOT EXISTS ai_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages TEXT NOT NULL DEFAULT '[]', -- JSON array of messages
  context TEXT, -- JSON object for additional context (e.g., draft product ID)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER, -- Auto-expire sessions after 7 days of inactivity
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Indexes for AI sessions
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_site ON ai_sessions(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_sessions(site_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_expires ON ai_sessions(expires_at);

-- AI Settings table
-- Stores AI configuration and API keys per site
CREATE TABLE IF NOT EXISTS ai_settings (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL, -- ENCRYPTED for API keys (see src/lib/server/crypto.ts)
  setting_type TEXT NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'encrypted', 'number', 'boolean', 'json')),
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, setting_key)
);

-- Index for AI settings
CREATE INDEX IF NOT EXISTS idx_ai_settings_site ON ai_settings(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_settings_site_key ON ai_settings(site_id, setting_key);
