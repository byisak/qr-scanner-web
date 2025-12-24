import oracledb from 'oracledb';

// Oracle Instant Client 자동 초기화 (Linux)
try {
  oracledb.initOracleClient();
} catch (err: any) {
  console.warn('Oracle Instant Client already initialized or not needed');
}

// 연결 풀 설정
let pool: oracledb.Pool | null = null;

interface OracleConfig {
  user: string;
  password: string;
  connectString: string;
}

/**
 * Oracle Database 연결 풀 초기화
 */
export async function initializePool(): Promise<oracledb.Pool | null> {
  if (pool) {
    return pool;
  }

  const config: OracleConfig = {
    user: process.env.ORACLE_USER || 'ADMIN',
    password: process.env.ORACLE_PASSWORD || '',
    connectString: process.env.ORACLE_CONNECTION_STRING || '',
  };

  if (!config.password || !config.connectString) {
    console.warn('⚠️  Oracle database credentials not configured.');
    console.warn('⚠️  Running in MEMORY MODE - data will be lost on restart!');
    console.warn('⚠️  Please configure ORACLE_PASSWORD and ORACLE_CONNECTION_STRING in .env.local');
    return null;
  }

  try {
    pool = await oracledb.createPool({
      user: config.user,
      password: config.password,
      connectString: config.connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60,
    });

    console.log('✅ Oracle DB 연결 풀 생성 성공');
    return pool;
  } catch (err) {
    console.error('❌ Oracle DB 연결 실패:', err);
    throw err;
  }
}

/**
 * 연결 풀에서 연결 가져오기
 */
export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    const newPool = await initializePool();
    if (!newPool) {
      throw new Error('데이터베이스 연결이 설정되지 않았습니다. ORACLE_PASSWORD와 ORACLE_CONNECTION_STRING 환경 변수를 확인해주세요.');
    }
  }
  return pool!.getConnection();
}

/**
 * 연결 풀 종료
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(0);
    pool = null;
    console.log('🔌 Oracle DB 연결 풀 종료');
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
