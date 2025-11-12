-- Development seed data for Hermes
-- This file is used by the db:seed script to populate the database with sample data
-- It should NOT be run as a migration - only for local/preview development

-- Insert sample products for default site
INSERT INTO products (id, site_id, name, description, price, image, category, stock, type, tags)
VALUES
  (
    '1',
    'default-site',
    'Wireless Headphones',
    'Premium quality wireless headphones with noise cancellation',
    199.99,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    'Electronics',
    50,
    'physical',
    '["audio", "wireless", "premium"]'
  ),
  (
    '2',
    'default-site',
    'Smart Watch',
    'Advanced fitness tracking and smart notifications',
    299.99,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    'Electronics',
    30,
    'physical',
    '["wearable", "fitness", "smart"]'
  ),
  (
    '3',
    'default-site',
    'Coffee Mug',
    'Ceramic coffee mug with beautiful design',
    19.99,
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    'Home & Kitchen',
    100,
    'physical',
    '["kitchen", "ceramic", "drinkware"]'
  ),
  (
    '4',
    'default-site',
    'Laptop Backpack',
    'Durable laptop backpack with multiple compartments',
    89.99,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    'Accessories',
    25,
    'physical',
    '["backpack", "laptop", "travel"]'
  ),
  (
    '5',
    'default-site',
    'Desk Lamp',
    'Modern LED desk lamp with adjustable brightness',
    79.99,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'Home & Kitchen',
    40,
    'physical',
    '["lighting", "LED", "desk"]'
  ),
  (
    '6',
    'default-site',
    'Running Shoes',
    'Comfortable running shoes with excellent support',
    129.99,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    'Sports',
    60,
    'physical',
    '["footwear", "running", "sports"]'
  );

-- Insert demo users for default site
-- These are demo accounts for development and testing purposes
-- Note: Currently using simple authentication for demo purposes

-- Regular User Account
-- Email: user@hermes.local
-- Password: TfppPEsXnfZluUi52ne538O (23-character random alphanumeric)
-- SHA-256 hash: 5f24110047b63ba5e3aa6da96bae758f18f576b05e3872a3e33207422c4acbfa
INSERT INTO users (id, site_id, email, name, password_hash, role, permissions, status, grace_period_days)
VALUES (
  'user-1',
  'default-site',
  'user@hermes.local',
  'Demo User',
  '5f24110047b63ba5e3aa6da96bae758f18f576b05e3872a3e33207422c4acbfa',
  'user',
  '[]',
  'active',
  0
);

-- Site Owner/Admin Account
-- Email: owner@hermes.local
-- Password: 4a6lJebYdNkr2zjq5j59rTt (23-character random alphanumeric)
-- SHA-256 hash: 848182b0ad7be9c4994b06e335776bfe576cf91044896aea4622445dffed8f33
INSERT INTO users (id, site_id, email, name, password_hash, role, permissions, status, grace_period_days)
VALUES (
  'admin-1',
  'default-site',
  'owner@hermes.local',
  'Site Owner',
  '848182b0ad7be9c4994b06e335776bfe576cf91044896aea4622445dffed8f33',
  'admin',
  '[]',
  'active',
  0
);

-- Platform Engineer Account
-- Email: engineer@hermes.local
-- Password: engineer123 (for demo/development only)
-- SHA-256 hash: 80ca306ac6e68366dd0a26125c9647e0c61fac6668cec6016f5fe30fb12e99bd
-- Note: In production, change this password immediately after first login
INSERT INTO users (id, site_id, email, name, password_hash, role, permissions, status, grace_period_days)
VALUES (
  'engineer-1',
  'default-site',
  'engineer@hermes.local',
  'Platform Engineer',
  '80ca306ac6e68366dd0a26125c9647e0c61fac6668cec6016f5fe30fb12e99bd',
  'platform_engineer',
  '[]',
  'active',
  0
);
