import { Pool, PoolClient } from 'pg';

// 연결 풀 설정
let pool: Pool | null = null;

interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * PostgreSQL Database 연결 풀 초기화
 */
export async function initializePool(): Promise<Pool | null> {
  if (pool) {
    return pool;
  }

  const config: PostgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DATABASE || 'qrscanner',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
  };

  if (!config.password) {
    console.warn('⚠️  PostgreSQL database credentials not configured.');
    console.warn('⚠️  Running in MEMORY MODE - data will be lost on restart!');
    console.warn('⚠️  Please configure POSTGRES_PASSWORD in .env.local');
    return null;
  }

  try {
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: 2,
      max: 10,
      idleTimeoutMillis: 60000,
    });

    // 연결 테스트
    const client = await pool.connect();
    client.release();

    console.log('✅ PostgreSQL DB 연결 풀 생성 성공');
    return pool;
  } catch (err) {
    console.error('❌ PostgreSQL DB 연결 실패:', err);
    throw err;
  }
}

/**
 * 연결 풀에서 연결 가져오기
 */
export async function getConnection(): Promise<PoolClient> {
  if (!pool) {
    await initializePool();
  }
  return pool!.connect();
}

/**
 * 풀에서 직접 쿼리 실행 (단순 쿼리용)
 */
export async function query(text: string, params?: unknown[]) {
  if (!pool) {
    await initializePool();
  }
  return pool!.query(text, params);
}

/**
 * 연결 풀 종료
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 PostgreSQL DB 연결 풀 종료');
  }
}

/**
 * 프로세스 종료 시 풀 자동 종료
 */
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
