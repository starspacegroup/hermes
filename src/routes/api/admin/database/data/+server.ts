import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';

export const GET: RequestHandler = async ({ platform, locals, url }) => {
  try {
    // Check authentication
    if (!locals.currentUser) {
      throw error(401, 'Unauthorized');
    }

    const user = locals.currentUser;

    // Only platform engineers can access table data
    if (user.role !== 'platform_engineer') {
      throw error(403, 'Access denied. Platform engineer role required.');
    }

    const tableName = url.searchParams.get('table');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!tableName) {
      throw error(400, 'Table name is required');
    }

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw error(400, 'Invalid table name');
    }

    const db = getDB(platform);

    // Get total count
    const countResult = (await db
      .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
      .first()) as { count: number } | null;

    const totalRows = countResult?.count || 0;
    const totalPages = Math.ceil(totalRows / limit);
    const offset = (page - 1) * limit;

    // Get paginated data
    const dataResult = await db
      .prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();

    return json({
      tableName,
      data: dataResult.results || [],
      pagination: {
        page,
        limit,
        totalRows,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Table data fetch error:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to retrieve table data');
  }
};
