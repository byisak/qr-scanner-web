import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { initializePool, getConnection } from './lib/db';
import { verifyAccessToken } from './lib/auth';
import type { PoolClient } from 'pg';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
// 0.0.0.0: 모든 네트워크 인터페이스에서 접속 허용 (원격 접속 가능)
// localhost: 로컬 접속만 허용
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// PostgreSQL DB 초기화
initializePool().catch((err) => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 서버 초기화
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('클라이언트 연결:', socket.id);

    // 연결 시 토큰 검증 (선택적 인증)
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    console.log('🔑 받은 토큰:', token ? `${String(token).substring(0, 20)}...` : 'null');
    let authenticatedUserId: string | null = null;

    if (token && typeof token === 'string') {
      const decoded = verifyAccessToken(token);
      console.log('🔑 토큰 디코딩 결과:', decoded ? `userId: ${decoded.userId}` : '실패');
      if (decoded) {
        authenticatedUserId = decoded.userId;
        console.log('인증된 사용자 연결:', authenticatedUserId);
      }
    }

    // 세션 생성
    socket.on('create-session', async (data) => {
      let client: PoolClient | null = null;
      try {
        const sessionId = data?.sessionId || uuidv4();
        // 클라이언트에서 전달한 토큰 또는 연결 시 인증된 사용자 ID 사용
        const userId = data?.userId || authenticatedUserId;

        client = await getConnection();

        // 세션이 이미 존재하는지 확인
        const checkResult = await client.query(
          `SELECT session_id FROM sessions WHERE session_id = $1`,
          [sessionId]
        );

        if (checkResult.rows.length === 0) {
          // 세션 생성 (user_id 포함)
          await client.query(
            `INSERT INTO sessions (session_id, socket_id, user_id, created_at, last_activity, status)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            [sessionId, socket.id, userId || null]
          );
        } else if (userId) {
          // 기존 세션에 user_id 업데이트 (세션에 user_id가 없는 경우에만)
          await client.query(
            `UPDATE sessions SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL`,
            [userId, sessionId]
          );
        }

        socket.join(sessionId);

        socket.emit('session-created', {
          sessionId,
          userId: userId || null,
          message: '세션이 생성되었습니다.',
        });

        console.log('새 세션 생성:', sessionId, userId ? `(사용자: ${userId})` : '(비로그인)');
      } catch (err) {
        console.error('세션 생성 실패:', err);
        socket.emit('error', { message: '세션 생성 실패' });
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    // 세션 참가
    socket.on('join-session', async (data) => {
      let client: PoolClient | null = null;
      try {
        // sessionId만 전달하거나 객체로 전달 가능
        const sessionId = typeof data === 'string' ? data : data?.sessionId;
        const userId = typeof data === 'object' ? (data?.userId || authenticatedUserId) : authenticatedUserId;

        // 🔍 디버그 로그
        console.log('=== join-session 디버그 ===');
        console.log('받은 data:', JSON.stringify(data));
        console.log('authenticatedUserId (토큰에서):', authenticatedUserId);
        console.log('최종 userId:', userId);
        console.log('sessionId:', sessionId);

        if (!sessionId) {
          socket.emit('error', { message: '세션 ID가 필요합니다.' });
          return;
        }

        client = await getConnection();

        // 세션이 없으면 자동으로 생성
        const checkResult = await client.query(
          `SELECT session_id, user_id FROM sessions WHERE session_id = $1`,
          [sessionId]
        );

        if (checkResult.rows.length === 0) {
          console.log('새 세션 자동 생성:', sessionId, userId ? `(사용자: ${userId})` : '(비로그인)');
          await client.query(
            `INSERT INTO sessions (session_id, socket_id, user_id, created_at, last_activity, status)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            [sessionId, socket.id, userId || null]
          );
        } else {
          // 세션 활동 시간 업데이트, user_id가 없으면 업데이트
          const existingSession = checkResult.rows[0];

          if (userId && !existingSession.user_id) {
            // 기존 세션에 user_id가 없으면 업데이트
            await client.query(
              `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, socket_id = $1, user_id = $2
               WHERE session_id = $3`,
              [socket.id, userId, sessionId]
            );
          } else {
            await client.query(
              `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, socket_id = $1
               WHERE session_id = $2`,
              [socket.id, sessionId]
            );
          }
        }

        socket.join(sessionId);

        // 세션 소유자 확인
        const sessionOwnerResult = await client.query(
          `SELECT user_id FROM sessions WHERE session_id = $1`,
          [sessionId]
        );
        const sessionOwnerId = sessionOwnerResult.rows[0]?.user_id;
        const isOwner = userId && sessionOwnerId === userId;

        // 🔍 디버그 로그
        console.log('세션 소유자 ID:', sessionOwnerId);
        console.log('현재 사용자 ID:', userId);
        console.log('소유자 여부:', isOwner);

        // 기존 스캔 데이터 조회 (로그인 사용자만)
        let existingScans: any[] = [];
        let filterMode: string;

        if (userId) {
          filterMode = '로그인 - 내 스캔만';
          // 로그인: 내가 스캔한 데이터만 표시
          const scanQuery = `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                              u.name as user_name, u.email as user_email
                       FROM scan_data sd
                       LEFT JOIN users u ON sd.user_id = u.id
                       WHERE sd.session_id = $1 AND sd.user_id = $2
                       ORDER BY sd.created_at ASC`;
          const scanResult = await client.query(scanQuery, [sessionId, userId]);

          existingScans = scanResult.rows.map((row: any) => ({
            id: row.id,
            sessionId: row.session_id,
            code: row.code,
            scan_timestamp: row.scan_timestamp,
            createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
            userId: row.user_id || null,
            userName: row.user_name || row.user_email || null,
          }));
        } else {
          filterMode = '비로그인 - 스캔 데이터 없음';
          // 비로그인: 스캔 데이터 표시 안함 (세션 코드만 표시)
          existingScans = [];
        }

        console.log('🔍 필터 모드:', filterMode);

        console.log('🔍 조회된 스캔 수:', existingScans.length);
        console.log('🔍 스캔 데이터 user_id 목록:', existingScans.map(s => s.userId));
        console.log('=== join-session 디버그 끝 ===');

        socket.emit('session-joined', {
          sessionId,
          existingData: existingScans,
          isOwner,
        });

        console.log('클라이언트 세션 참가:', sessionId, '(기존 스캔:', existingScans.length, '개)', filterMode);
      } catch (err) {
        console.error('세션 참가 실패:', err);
        socket.emit('error', { message: '세션 참가 실패' });
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    // 스캔 데이터 수신
    socket.on('scan-data', async (payload) => {
      let client: PoolClient | null = null;
      try {
        const { sessionId, code, timestamp, userId } = payload;
        // 클라이언트에서 전달한 userId 또는 연결 시 인증된 사용자 ID 사용
        const scanUserId = userId || authenticatedUserId;

        if (!sessionId || !code) {
          socket.emit('error', { message: '잘못된 데이터 형식' });
          return;
        }

        client = await getConnection();

        // 세션 활동 시간 업데이트
        await client.query(
          `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1`,
          [sessionId]
        );

        // 사용자 정보 조회 및 유효성 확인
        let validUserId: string | null = null;
        let userName: string | null = null;

        if (scanUserId) {
          const userResult = await client.query(
            `SELECT id, name, email FROM users WHERE id = $1`,
            [scanUserId]
          );
          if (userResult.rows.length > 0) {
            // DB에 존재하는 사용자만 user_id 저장
            validUserId = userResult.rows[0].id;
            userName = userResult.rows[0].name || userResult.rows[0].email;
          } else {
            console.log('⚠️ 사용자 ID가 DB에 없음:', scanUserId, '- user_id를 null로 저장');
          }
        }

        // 스캔 데이터 삽입 (유효한 user_id만 저장)
        const result = await client.query(
          `INSERT INTO scan_data (session_id, user_id, code, scan_timestamp, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING id`,
          [sessionId, validUserId, code, timestamp || Date.now()]
        );

        const scanRecord = {
          id: result.rows[0].id,
          sessionId,
          code,
          scan_timestamp: timestamp || Date.now(),
          createdAt: new Date().toISOString(),
          userId: validUserId,
          userName: userName,
        };

        // 모든 클라이언트에게 브로드캐스트
        io.to(sessionId).emit('new-scan', scanRecord);

        socket.emit('scan-received', {
          success: true,
          code,
        });

        const dateObject = new Date(timestamp);
        const kstDate = dateObject.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        console.log('새 스캔 데이터:', '스캔값:', code, '세션ID:', sessionId, '스캔시간:', kstDate, validUserId ? `사용자: ${userName}` : '(사용자 미확인)');
      } catch (err) {
        console.error('스캔 데이터 저장 실패:', err);
        socket.emit('error', { message: '데이터 저장 실패' });
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
