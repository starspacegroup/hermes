-- Insert default site to satisfy foreign key constraints
-- This ensures the database is in a working state after migrations

INSERT OR IGNORE INTO sites (id, name, domain, description, status, created_at, updated_at)
VALUES (
  'default-site',
  'Hermes Store',
  'hermes.local',
  'Default Hermes eCommerce Store',
  'active',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
