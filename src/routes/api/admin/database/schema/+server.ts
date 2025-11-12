import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

interface TableSchema {
  name: string;
  type: 'table' | 'index' | 'view';
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount: number;
}

interface DatabaseSchema {
  tables: TableSchema[];
  totalTables: number;
  totalIndexes: number;
}

export const GET: RequestHandler = async ({ platform, locals }) => {
  try {
    // Check authentication
    if (!locals.currentUser) {
      throw error(401, 'Unauthorized');
    }

    const user = locals.currentUser;

    // Only platform engineers can access database schema
    if (user.role !== 'platform_engineer') {
      throw error(403, 'Access denied. Platform engineer role required.');
    }

    const db = getDB(platform);

    // Get all tables from sqlite_master
    const tablesResult = await db
      .prepare(
        `SELECT name, type, sql 
         FROM sqlite_master 
         WHERE type IN ('table', 'view') 
         AND name NOT LIKE 'sqlite_%' 
         AND name NOT LIKE '_cf_%'
         ORDER BY name`
      )
      .all();

    const tables: TableSchema[] = [];
    let totalIndexes = 0;

    // For each table, get detailed information
    for (const table of tablesResult.results || []) {
      const tableName = table.name as string;

      // Get column information
      const columnsResult = await db.prepare(`PRAGMA table_info(${tableName})`).all();

      // Get indexes for this table
      const indexesResult = await db.prepare(`PRAGMA index_list(${tableName})`).all();
      totalIndexes += (indexesResult.results || []).length;

      // Get foreign keys
      const foreignKeysResult = await db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();

      // Get row count (be careful with large tables)
      let rowCount = 0;
      try {
        const countResult = await db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first();
        rowCount = (countResult as { count: number })?.count || 0;
      } catch (_e) {
        // If count fails, set to -1 to indicate error
        rowCount = -1;
      }

      tables.push({
        name: tableName,
        type: table.type as 'table' | 'view',
        columns: (columnsResult.results || []) as unknown as ColumnInfo[],
        indexes: (indexesResult.results || []) as unknown as IndexInfo[],
        foreignKeys: (foreignKeysResult.results || []) as unknown as ForeignKeyInfo[],
        rowCount
      });
    }

    const schema: DatabaseSchema = {
      tables,
      totalTables: tables.length,
      totalIndexes
    };

    return json(schema);
  } catch (err) {
    console.error('Database schema error:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to retrieve database schema');
  }
};
