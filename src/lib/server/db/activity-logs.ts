/**
 * Activity Logs repository with multi-tenant support
 * Handles audit trail and activity tracking functionality
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';

export interface ActivityLog {
  id: string;
  site_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
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

/**
 * Create a new activity log entry (scoped by site)
 */
export async function createActivityLog(
  db: D1Database,
  siteId: string,
  data: CreateActivityLogData
): Promise<ActivityLog> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  await db
    .prepare(
      `INSERT INTO activity_logs (id, site_id, user_id, action, entity_type, entity_id, 
       entity_name, description, metadata, ip_address, user_agent, severity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.user_id || null,
      data.action,
      data.entity_type,
      data.entity_id || null,
      data.entity_name || null,
      data.description || null,
      metadata,
      data.ip_address || null,
      data.user_agent || null,
      data.severity || 'info',
      timestamp
    )
    .run();

  const log = await executeOne<ActivityLog>(db, 'SELECT * FROM activity_logs WHERE id = ?', [id]);
  if (!log) {
    throw new Error('Failed to create activity log');
  }
  return log;
}

/**
 * Get activity logs with filters (scoped by site)
 */
export async function getActivityLogs(
  db: D1Database,
  siteId: string,
  filter: ActivityLogFilter = {}
): Promise<ActivityLog[]> {
  const conditions: string[] = ['site_id = ?'];
  const params: unknown[] = [siteId];

  if (filter.user_id) {
    conditions.push('user_id = ?');
    params.push(filter.user_id);
  }

  if (filter.action) {
    conditions.push('action = ?');
    params.push(filter.action);
  }

  if (filter.entity_type) {
    conditions.push('entity_type = ?');
    params.push(filter.entity_type);
  }

  if (filter.entity_id) {
    conditions.push('entity_id = ?');
    params.push(filter.entity_id);
  }

  if (filter.severity) {
    conditions.push('severity = ?');
    params.push(filter.severity);
  }

  if (filter.start_date) {
    conditions.push('created_at >= ?');
    params.push(filter.start_date);
  }

  if (filter.end_date) {
    conditions.push('created_at <= ?');
    params.push(filter.end_date);
  }

  const limit = filter.limit || 50;
  const offset = filter.offset || 0;

  params.push(limit, offset);

  const query = `
    SELECT * FROM activity_logs 
    WHERE ${conditions.join(' AND ')} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;

  const result = await execute<ActivityLog>(db, query, params);
  return result.results || [];
}

/**
 * Get activity logs for a specific user
 */
export async function getActivityLogsByUser(
  db: D1Database,
  siteId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const result = await execute<ActivityLog>(
    db,
    `SELECT * FROM activity_logs 
     WHERE site_id = ? AND user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [siteId, userId, limit, offset]
  );
  return result.results || [];
}

/**
 * Get activity logs for a specific entity
 */
export async function getActivityLogsByEntity(
  db: D1Database,
  siteId: string,
  entityType: string,
  entityId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const result = await execute<ActivityLog>(
    db,
    `SELECT * FROM activity_logs 
     WHERE site_id = ? AND entity_type = ? AND entity_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [siteId, entityType, entityId, limit, offset]
  );
  return result.results || [];
}

/**
 * Get activity logs by action pattern (supports wildcards)
 */
export async function getActivityLogsByAction(
  db: D1Database,
  siteId: string,
  actionPattern: string,
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const result = await execute<ActivityLog>(
    db,
    `SELECT * FROM activity_logs 
     WHERE site_id = ? AND action LIKE ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [siteId, actionPattern, limit, offset]
  );
  return result.results || [];
}

/**
 * Get count of activity logs by severity
 */
export async function getActivityLogCountBySeverity(
  db: D1Database,
  siteId: string,
  severity: 'info' | 'warning' | 'error' | 'critical'
): Promise<number> {
  const result = await executeOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM activity_logs WHERE site_id = ? AND severity = ?',
    [siteId, severity]
  );
  return result?.count || 0;
}

/**
 * Delete old activity logs (retention policy)
 */
export async function deleteOldActivityLogs(
  db: D1Database,
  siteId: string,
  daysToKeep: number
): Promise<number> {
  const timestamp = getCurrentTimestamp() - daysToKeep * 86400;
  const result = await db
    .prepare('DELETE FROM activity_logs WHERE site_id = ? AND created_at < ?')
    .bind(siteId, timestamp)
    .run();
  return result.meta?.changes || 0;
}

/**
 * Export activity logs to JSON format
 */
export async function exportActivityLogs(
  db: D1Database,
  siteId: string,
  filter: ActivityLogFilter = {}
): Promise<ActivityLog[]> {
  // Use getActivityLogs but with no limit
  return getActivityLogs(db, siteId, { ...filter, limit: 10000 });
}
