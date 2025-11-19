-- Migration: 0026_comprehensive_site_settings
-- Description: Expand site_settings to support all admin configuration options
-- The site_settings table already exists, this adds default values for all settings

-- General Settings
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('general-store-name', 'default-site', 'general_store_name', 'Hermes eCommerce'),
  ('general-tagline', 'default-site', 'general_tagline', 'Your Modern Online Store'),
  ('general-description', 'default-site', 'general_description', 'A beautiful eCommerce platform built with SvelteKit'),
  ('general-store-email', 'default-site', 'general_store_email', 'store@example.com'),
  ('general-support-email', 'default-site', 'general_support_email', 'support@example.com'),
  ('general-contact-phone', 'default-site', 'general_contact_phone', ''),
  ('general-currency', 'default-site', 'general_currency', 'USD'),
  ('general-timezone', 'default-site', 'general_timezone', 'UTC'),
  ('general-date-format', 'default-site', 'general_date_format', 'MM/DD/YYYY'),
  ('general-time-format', 'default-site', 'general_time_format', '12h'),
  ('general-weight-unit', 'default-site', 'general_weight_unit', 'lb'),
  ('general-dimension-unit', 'default-site', 'general_dimension_unit', 'in');

-- Address & Location Settings
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('address-street', 'default-site', 'address_street', ''),
  ('address-city', 'default-site', 'address_city', ''),
  ('address-state', 'default-site', 'address_state', ''),
  ('address-postcode', 'default-site', 'address_postcode', ''),
  ('address-country', 'default-site', 'address_country', 'US'),
  ('address-geolocation-enabled', 'default-site', 'address_geolocation_enabled', 'false');

-- Tax Settings
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('tax-calculations-enabled', 'default-site', 'tax_calculations_enabled', 'false'),
  ('tax-prices-include-tax', 'default-site', 'tax_prices_include_tax', 'false'),
  ('tax-display-prices-with-tax', 'default-site', 'tax_display_prices_with_tax', 'false'),
  ('tax-default-rate', 'default-site', 'tax_default_rate', '0'),
  ('tax-classes', 'default-site', 'tax_classes', '[]');

-- Payment Gateway Settings
-- Note: Sensitive values like API keys should be encrypted at application level
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('payment-stripe-enabled', 'default-site', 'payment_stripe_enabled', 'false'),
  ('payment-stripe-mode', 'default-site', 'payment_stripe_mode', 'test'),
  ('payment-stripe-public-key', 'default-site', 'payment_stripe_public_key', ''),
  ('payment-stripe-secret-key', 'default-site', 'payment_stripe_secret_key', ''),
  ('payment-paypal-enabled', 'default-site', 'payment_paypal_enabled', 'false'),
  ('payment-paypal-mode', 'default-site', 'payment_paypal_mode', 'sandbox'),
  ('payment-paypal-client-id', 'default-site', 'payment_paypal_client_id', ''),
  ('payment-paypal-client-secret', 'default-site', 'payment_paypal_client_secret', ''),
  ('payment-test-mode-enabled', 'default-site', 'payment_test_mode_enabled', 'true');

-- Email Settings
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('email-provider', 'default-site', 'email_provider', 'sendmail'),
  ('email-smtp-host', 'default-site', 'email_smtp_host', ''),
  ('email-smtp-port', 'default-site', 'email_smtp_port', '587'),
  ('email-smtp-secure', 'default-site', 'email_smtp_secure', 'true'),
  ('email-smtp-username', 'default-site', 'email_smtp_username', ''),
  ('email-smtp-password', 'default-site', 'email_smtp_password', ''),
  ('email-from-name', 'default-site', 'email_from_name', 'Hermes Store'),
  ('email-from-address', 'default-site', 'email_from_address', 'noreply@example.com'),
  ('email-new-order-enabled', 'default-site', 'email_new_order_enabled', 'true'),
  ('email-order-status-enabled', 'default-site', 'email_order_status_enabled', 'true'),
  ('email-customer-welcome-enabled', 'default-site', 'email_customer_welcome_enabled', 'true');

-- API & Webhook Settings
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('api-rest-enabled', 'default-site', 'api_rest_enabled', 'false'),
  ('api-webhook-order-created', 'default-site', 'api_webhook_order_created', ''),
  ('api-webhook-order-updated', 'default-site', 'api_webhook_order_updated', ''),
  ('api-webhook-product-updated', 'default-site', 'api_webhook_product_updated', ''),
  ('api-rate-limit', 'default-site', 'api_rate_limit', '100'),
  ('api-rate-limit-window', 'default-site', 'api_rate_limit_window', '60');

-- Create API keys table for managing API authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT NOT NULL, -- JSON array of permissions
  created_by TEXT NOT NULL,
  last_used_at INTEGER,
  expires_at INTEGER,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON api_keys(site_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked);
