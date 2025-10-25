-- Initial schema for Hermes eCommerce Platform with multi-site support
-- All tables are scoped by site_id for multi-tenancy

-- Sites/Stores table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  settings TEXT, -- JSON column for site-specific settings
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Users table (scoped by site)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'customer')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, email)
);

-- Products table (scoped by site)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'physical' CHECK (type IN ('physical', 'service', 'digital')),
  tags TEXT, -- JSON array of tags
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Orders table (scoped by site)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  tax REAL NOT NULL,
  total REAL NOT NULL,
  shipping_address TEXT NOT NULL, -- JSON column
  billing_address TEXT NOT NULL, -- JSON column
  payment_method TEXT NOT NULL, -- JSON column
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items table (scoped by site through order)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  image TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Shopping carts table (scoped by site)
CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  items TEXT NOT NULL, -- JSON array of cart items
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(site_id, email);
CREATE INDEX IF NOT EXISTS idx_products_site_id ON products(site_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(site_id, category);
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON orders(site_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_carts_site_id ON carts(site_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
