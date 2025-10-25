/**
 * Database connection and utility functions for Cloudflare D1
 */

/**
 * Get the D1 database instance from the platform context
 */
export function getDB(platform: App.Platform | undefined): D1Database {
  if (!platform?.env?.DB) {
    throw new Error('D1 database is not available');
  }
  return platform.env.DB;
}

/**
 * Execute a SQL query with parameters
 */
export async function execute<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  return await db
    .prepare(sql)
    .bind(...params)
    .all();
}

/**
 * Execute a SQL query and return the first result
 */
export async function executeOne<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .first();
  return result as T | null;
}

/**
 * Execute a SQL query for a single row
 */
export async function executeRow<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .first();
  return result as T | null;
}

/**
 * Execute multiple SQL statements in a batch
 */
export async function executeBatch(
  db: D1Database,
  statements: { sql: string; params?: unknown[] }[]
): Promise<D1Result[]> {
  const preparedStatements = statements.map((stmt) => {
    const prepared = db.prepare(stmt.sql);
    return stmt.params ? prepared.bind(...stmt.params) : prepared;
  });
  return await db.batch(preparedStatements);
}

/**
 * Run migrations for D1 database
 * Note: In production, migrations should be run via wrangler CLI
 */
export async function runMigrations(db: D1Database, migrations: string[]): Promise<void> {
  for (const migration of migrations) {
    // Split migration into individual statements
    const statements = migration
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.prepare(statement).run();
    }
  }
}

/**
 * Generate a unique ID for database records
 * Uses crypto.randomUUID() which is always available in Cloudflare Workers
 */
export function generateId(): string {
  // In Cloudflare Workers, crypto.randomUUID() is always available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // This should never be reached in Cloudflare Workers environment
  // but provides a fallback for testing environments
  // Note: This fallback should not be used in production
  throw new Error(
    'crypto.randomUUID() is not available. This should not happen in Cloudflare Workers.'
  );
}

/**
 * Get current timestamp in seconds (Unix timestamp)
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
