-- Migration: 0012_roles_and_permissions
-- Description: Create roles and permissions tables for RBAC system
-- Rollback: DROP TABLE role_permissions; DROP TABLE permissions; DROP TABLE roles;

-- Roles table: defines different role types beyond the basic enum
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role INTEGER NOT NULL DEFAULT 0, -- 1 for built-in roles (admin, user, etc.)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, name)
);

-- Permissions table: defines granular permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'orders:read', 'products:write', 'reports:export'
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'orders', 'products', 'reports', 'settings', 'users'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  granted_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  granted_by TEXT, -- User ID who granted this permission
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Insert default permissions
INSERT INTO permissions (id, name, description, category) VALUES
  -- Orders permissions
  ('perm-orders-read', 'orders:read', 'View orders', 'orders'),
  ('perm-orders-write', 'orders:write', 'Create and update orders', 'orders'),
  ('perm-orders-delete', 'orders:delete', 'Delete orders', 'orders'),
  ('perm-orders-refund', 'orders:refund', 'Process refunds', 'orders'),
  
  -- Products permissions
  ('perm-products-read', 'products:read', 'View products', 'products'),
  ('perm-products-write', 'products:write', 'Create and update products', 'products'),
  ('perm-products-delete', 'products:delete', 'Delete products', 'products'),
  ('perm-products-import', 'products:import', 'Import products in bulk', 'products'),
  
  -- Reports permissions
  ('perm-reports-read', 'reports:read', 'View reports', 'reports'),
  ('perm-reports-export', 'reports:export', 'Export reports', 'reports'),
  
  -- Settings permissions
  ('perm-settings-read', 'settings:read', 'View site settings', 'settings'),
  ('perm-settings-write', 'settings:write', 'Update site settings', 'settings'),
  ('perm-settings-theme', 'settings:theme', 'Manage theme settings', 'settings'),
  
  -- Users permissions
  ('perm-users-read', 'users:read', 'View users', 'users'),
  ('perm-users-write', 'users:write', 'Create and update users', 'users'),
  ('perm-users-delete', 'users:delete', 'Delete users', 'users'),
  ('perm-users-roles', 'users:roles', 'Manage user roles', 'users'),
  
  -- Pages permissions
  ('perm-pages-read', 'pages:read', 'View pages', 'pages'),
  ('perm-pages-write', 'pages:write', 'Create and update pages', 'pages'),
  ('perm-pages-delete', 'pages:delete', 'Delete pages', 'pages'),
  ('perm-pages-publish', 'pages:publish', 'Publish pages', 'pages'),
  
  -- Activity logs permissions
  ('perm-logs-read', 'logs:read', 'View activity logs', 'logs'),
  ('perm-logs-export', 'logs:export', 'Export activity logs', 'logs');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_site_id ON roles(site_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(site_id, name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
