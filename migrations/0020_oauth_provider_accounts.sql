-- Migration: 0020_oauth_provider_accounts
-- Description: Add OAuth provider accounts table for SSO integration
-- Supports multi-provider authentication with account linking
-- Rollback: DROP TABLE IF EXISTS provider_accounts; DROP TABLE IF EXISTS oauth_sessions; DROP TABLE IF EXISTS auth_audit_logs;

-- OAuth Provider Accounts table
-- Links user accounts to external OAuth providers (Google, LinkedIn, Apple, etc.)
CREATE TABLE IF NOT EXISTS provider_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'linkedin', 'apple', 'facebook', 'github', 'twitter', 'microsoft')),
  provider_account_id TEXT NOT NULL, -- Unique ID from the provider
  email TEXT NOT NULL, -- Email from the provider (for linking)
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at INTEGER, -- Unix timestamp for token expiry
  scope TEXT, -- OAuth scopes granted
  id_token TEXT, -- OpenID Connect ID token (encrypted)
  profile_data TEXT, -- JSON with provider profile data
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER, -- Track when this provider was last used for login
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, provider, provider_account_id)
);

-- OAuth Sessions table
-- Tracks OAuth flows in progress (state, PKCE, nonce)
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  state TEXT UNIQUE NOT NULL, -- OAuth state parameter for CSRF protection
  code_verifier TEXT NOT NULL, -- PKCE code verifier
  code_challenge TEXT NOT NULL, -- PKCE code challenge
  nonce TEXT, -- OpenID Connect nonce
  provider TEXT NOT NULL CHECK (provider IN ('google', 'linkedin', 'apple', 'facebook', 'github', 'twitter', 'microsoft')),
  redirect_uri TEXT NOT NULL, -- Where to redirect after OAuth
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER NOT NULL, -- Sessions expire after 10 minutes
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Auth Audit Logs table
-- Comprehensive logging for all authentication and SSO events
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT, -- NULL if login failed
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout',
    'sso_initiated', 'sso_completed', 'sso_failed',
    'account_linked', 'account_unlinked',
    'token_refreshed', 'token_expired',
    'session_revoked', 'suspicious_activity'
  )),
  provider TEXT, -- NULL for password auth, provider name for SSO
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON with event-specific details
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_accounts_user ON provider_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_site_provider ON provider_accounts(site_id, provider);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_email ON provider_accounts(site_id, email);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state ON oauth_sessions(state);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires ON oauth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_event ON auth_audit_logs(site_id, event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created ON auth_audit_logs(created_at);
