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
INSERT INTO users (id, site_id, email, name, password_hash, role)
VALUES (
  'user-1',
  'default-site',
  'user@hermes.local',
  'Demo User',
  '$2a$10$5k3wJwZqC5mJ7zVLmNpH5.VB6P6GvV5vqmQRJLKqZjKmzY5zJ5zJ5',
  'user'
);

-- Site Owner/Admin Account
-- Email: owner@hermes.local
-- Password: 4a6lJebYdNkr2zjq5j59rTt (23-character random alphanumeric)
INSERT INTO users (id, site_id, email, name, password_hash, role)
VALUES (
  'admin-1',
  'default-site',
  'owner@hermes.local',
  'Site Owner',
  '$2a$10$7k5wJwZqC5mJ7zVLmNpH5.XD8P8GvV5vqmQRJLKqZjKmzY7zJ7zJ7',
  'admin'
);

-- Platform Engineer Account
-- Email: engineer@hermes.local
-- Password: Set via PLATFORM_ENGINEER_PASSWORD environment variable
-- For local dev: Add to .dev.vars file
-- For production: Set via: wrangler secret put PLATFORM_ENGINEER_PASSWORD
INSERT INTO users (id, site_id, email, name, password_hash, role)
VALUES (
  'engineer-1',
  'default-site',
  'engineer@hermes.local',
  'Platform Engineer',
  '$2a$10$9k7wJwZqC5mJ7zVLmNpH5.ZF0P0GvV5vqmQRJLKqZjKmzY9zJ9zJ9',
  'platform_engineer'
);
