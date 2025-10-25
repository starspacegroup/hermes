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
 */
export function generateId(): string {
  // Use crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get current timestamp in seconds (Unix timestamp)
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
