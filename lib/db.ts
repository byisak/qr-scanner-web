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
 * DATABASE_URL 에서 sslmode 등 SSL 관련 쿼리를 제거한다.
 * (pg 는 연결 문자열의 sslmode 를 ssl 옵션보다 우선 적용해, Supabase 인증서 검증 설정이 덮어써진다)
 */
function stripSslParams(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    for (const key of ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * SSL 설정 (DATABASE_URL 사용 시 기본으로 켬)
 * - DATABASE_SSL=false: 끔 (로컬 Postgres 등)
 * - DATABASE_SSL_CA: CA 인증서(PEM)를 주면 인증서까지 검증, 없으면 암호화만 (Supabase 풀러 기본 인증서 체인 대응)
 */
function buildSslConfig(): false | { rejectUnauthorized: boolean; ca?: string } {
  if (process.env.DATABASE_SSL === 'false') return false;
  const ca = process.env.DATABASE_SSL_CA;
  if (ca) return { rejectUnauthorized: true, ca: ca.replace(/\\n/g, '\n') };
  return { rejectUnauthorized: false };
}

/**
 * PostgreSQL Database 연결 풀 초기화
 * - DATABASE_URL(없으면 POSTGRES_URL)이 있으면 우선 사용 (Supabase: 트랜잭션 풀러 6543 포트 권장)
 * - 없으면 POSTGRES_HOST/PORT/DATABASE/USER/PASSWORD (기존 Vultr 설정)
 * - Vercel(서버리스)에서는 인스턴스마다 풀이 생기므로 연결 수를 작게 유지한다
 */
export async function initializePool(): Promise<Pool | null> {
  if (pool) {
    return pool;
  }

  const isServerless = !!process.env.VERCEL;
  const max = parseInt(process.env.DATABASE_POOL_MAX || (isServerless ? '3' : '10'), 10);
  const poolOptions = {
    min: isServerless ? 0 : 2,
    max,
    idleTimeoutMillis: isServerless ? 10000 : 60000,
    connectionTimeoutMillis: 10000,
  };

  // POSTGRES_URL: Vercel의 Supabase 연동이 자동으로 넣어 주는 풀러 주소
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (databaseUrl) {
    pool = new Pool({
      connectionString: stripSslParams(databaseUrl),
      ssl: buildSslConfig(),
      ...poolOptions,
    });
    pool.on('error', (err) => {
      console.error('[db] 유휴 연결 오류:', err.message);
    });
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
    // console.warn('⚠️  PostgreSQL database credentials not configured.');
    return null;
  }

  try {
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ...poolOptions,
    });
    pool.on('error', (err) => {
      console.error('[db] 유휴 연결 오류:', err.message);
    });

    // 연결 테스트 (상시 서버에서만 — 서버리스에서는 첫 요청 지연을 줄이기 위해 생략)
    if (!isServerless) {
      const client = await pool.connect();
      client.release();
    }

    return pool;
  } catch (err) {
    // console.error('❌ PostgreSQL DB 연결 실패:', err);
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
  if (!pool) {
    throw new Error('데이터베이스가 설정되지 않았습니다 (DATABASE_URL 또는 POSTGRES_* 환경 변수 필요).');
  }
  return pool.connect();
}

/**
 * 풀에서 직접 쿼리 실행 (단순 쿼리용)
 */
export async function query(text: string, params?: unknown[]) {
  if (!pool) {
    await initializePool();
  }
  if (!pool) {
    throw new Error('데이터베이스가 설정되지 않았습니다 (DATABASE_URL 또는 POSTGRES_* 환경 변수 필요).');
  }
  return pool.query(text, params);
}

/**
 * 연결 풀 종료
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    // console.log('🔌 PostgreSQL DB 연결 풀 종료');
  }
}

/**
 * 프로세스 종료 시 풀 자동 종료 (상시 서버에서만 — 서버리스 런타임의 종료 처리에 간섭하지 않는다)
 */
if (!process.env.VERCEL) {
  process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}
