import { Pool, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const isCloudRun = !!process.env.K_SERVICE;
  const socketPath = process.env.DB_HOST ?? '/cloudsql/bharatvarsh-website:us-central1:bharatvarsh-db';

  pool = new Pool({
    user: process.env.DB_USER ?? 'ai_os_admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'ai_os',
    ...(isCloudRun
      ? { host: socketPath, port: undefined }
      : { host: process.env.DB_HOST ?? 'localhost', port: parseInt(process.env.DB_PORT ?? '5432', 10) }),
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const client = getPool();
  const result = await client.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function execute(
  text: string,
  params?: unknown[],
): Promise<number> {
  const client = getPool();
  const result = await client.query(text, params);
  return result.rowCount ?? 0;
}
