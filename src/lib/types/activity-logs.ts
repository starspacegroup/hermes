/**
 * Activity Log types for audit trail
 */

export interface ActivityLog {
  id: string;
  site_id: string;
  user_id: string | null;
  action: string; // e.g., 'order.created', 'product.updated'
  entity_type: string; // e.g., 'order', 'product', 'user'
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  metadata: string | null; // JSON string
  ip_address: string | null;
  user_agent: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: number;
}

export interface ActivityLogMetadata {
  [key: string]: unknown;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  affected_records?: number;
}

export interface CreateActivityLogData {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_name?: string | null;
  description?: string | null;
  metadata?: ActivityLogMetadata;
  ip_address?: string | null;
  user_agent?: string | null;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface ActivityLogFilter {
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  start_date?: number;
  end_date?: number;
  limit?: number;
  offset?: number;
}

export type EntityType =
  | 'order'
  | 'product'
  | 'user'
  | 'page'
  | 'setting'
  | 'role'
  | 'permission';

export const ENTITY_TYPES: EntityType[] = [
  'order',
  'product',
  'user',
  'page',
  'setting',
  'role',
  'permission'
];
