import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Reuse connection pool in dev to prevent connection exhaustion
export const pool = globalThis.__pgPool ?? new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgPool = pool;
}

/**
 * Executes a SQL query with parameter binding
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 500) {
      console.warn(`[Slow Query] (${duration}ms):`, text.slice(0, 100));
    }
    return res;
  } catch (error: any) {
    console.error('[PostgreSQL Query Error]:', { text, error: error.message });
    throw error;
  }
}

/**
 * Helper to get a client from the pool for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default {
  query,
  pool,
  getClient
};
