import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { initializePool, getConnection } from './lib/db';
import { verifyAccessToken } from './lib/auth';
import oracledb from 'oracledb';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
// 0.0.0.0: 모든 네트워크 인터페이스에서 접속 허용 (원격 접속 가능)
// localhost: 로컬 접속만 허용
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Oracle DB 초기화
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
    let authenticatedUserId: string | null = null;

    if (token && typeof token === 'string') {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        authenticatedUserId = decoded.userId;
        console.log('인증된 사용자 연결:', authenticatedUserId);
      }
    }

    // 세션 생성
    socket.on('create-session', async (data) => {
      let connection;
      try {
        const sessionId = data?.sessionId || uuidv4();
        // 클라이언트에서 전달한 토큰 또는 연결 시 인증된 사용자 ID 사용
        const userId = data?.userId || authenticatedUserId;

        connection = await getConnection();

        // 세션이 이미 존재하는지 확인
        const checkResult = await connection.execute(
          `SELECT session_id FROM sessions WHERE session_id = :sessionId`,
          { sessionId }
        );

        if (checkResult.rows && checkResult.rows.length === 0) {
          // 세션 생성 (user_id 포함)
          await connection.execute(
            `INSERT INTO sessions (session_id, socket_id, user_id, created_at, last_activity, status)
             VALUES (:sessionId, :socketId, :userId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            { sessionId, socketId: socket.id, userId: userId || null }
          );
          await connection.commit();
        } else if (userId) {
          // 기존 세션에 user_id 업데이트 (세션에 user_id가 없는 경우에만)
          await connection.execute(
            `UPDATE sessions SET user_id = :userId WHERE session_id = :sessionId AND user_id IS NULL`,
            { userId, sessionId }
          );
          await connection.commit();
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
        if (connection) {
          try {
            await connection.close();
          } catch (err) {
            console.error('Connection close error:', err);
          }
        }
      }
    });

    // 세션 참가
    socket.on('join-session', async (data) => {
      let connection;
      try {
        // sessionId만 전달하거나 객체로 전달 가능
        const sessionId = typeof data === 'string' ? data : data?.sessionId;
        const userId = typeof data === 'object' ? (data?.userId || authenticatedUserId) : authenticatedUserId;

        if (!sessionId) {
          socket.emit('error', { message: '세션 ID가 필요합니다.' });
          return;
        }

        connection = await getConnection();

        // 세션이 없으면 자동으로 생성
        const checkResult = await connection.execute(
          `SELECT session_id, user_id FROM sessions WHERE session_id = :sessionId`,
          { sessionId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!checkResult.rows || checkResult.rows.length === 0) {
          console.log('새 세션 자동 생성:', sessionId, userId ? `(사용자: ${userId})` : '(비로그인)');
          await connection.execute(
            `INSERT INTO sessions (session_id, socket_id, user_id, created_at, last_activity, status)
             VALUES (:sessionId, :socketId, :userId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            { sessionId, socketId: socket.id, userId: userId || null }
          );
          await connection.commit();
        } else {
          // 세션 활동 시간 업데이트, user_id가 없으면 업데이트
          const existingSession = checkResult.rows[0] as { SESSION_ID: string; USER_ID: string | null };

          if (userId && !existingSession.USER_ID) {
            // 기존 세션에 user_id가 없으면 업데이트
            await connection.execute(
              `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, socket_id = :socketId, user_id = :userId
               WHERE session_id = :sessionId`,
              { socketId: socket.id, userId, sessionId }
            );
          } else {
            await connection.execute(
              `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, socket_id = :socketId
               WHERE session_id = :sessionId`,
              { socketId: socket.id, sessionId }
            );
          }
          await connection.commit();
        }

        socket.join(sessionId);

        // 기존 스캔 데이터 조회
        const scanResult = await connection.execute(
          `SELECT id, session_id, code, scan_timestamp, created_at
           FROM scan_data
           WHERE session_id = :sessionId
           ORDER BY created_at ASC`,
          { sessionId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const existingScans = (scanResult.rows || []).map((row: any) => ({
          id: row.ID,
          sessionId: row.SESSION_ID,
          code: row.CODE,
          scan_timestamp: row.SCAN_TIMESTAMP,
          createdAt: row.CREATED_AT ? row.CREATED_AT.toISOString() : new Date().toISOString(),
        }));

        socket.emit('session-joined', {
          sessionId,
          existingData: existingScans,
        });

        console.log('클라이언트 세션 참가:', sessionId, '(기존 스캔:', existingScans.length, '개)');
      } catch (err) {
        console.error('세션 참가 실패:', err);
        socket.emit('error', { message: '세션 참가 실패' });
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch (err) {
            console.error('Connection close error:', err);
          }
        }
      }
    });

    // 스캔 데이터 수신
    socket.on('scan-data', async (payload) => {
      let connection;
      try {
        const { sessionId, code, timestamp } = payload;

        if (!sessionId || !code) {
          socket.emit('error', { message: '잘못된 데이터 형식' });
          return;
        }

        connection = await getConnection();

        // 세션 활동 시간 업데이트
        await connection.execute(
          `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = :sessionId`,
          { sessionId }
        );

        // 스캔 데이터 삽입
        const result = await connection.execute(
          `INSERT INTO scan_data (session_id, code, scan_timestamp, created_at)
           VALUES (:sessionId, :code, :scanTimestamp, CURRENT_TIMESTAMP)
           RETURNING id INTO :id`,
          {
            sessionId,
            code,
            scanTimestamp: timestamp || Date.now(),
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          }
        );

        await connection.commit();

        const outBinds = result.outBinds as { id: number[] } | undefined;
        const scanRecord = {
          id: outBinds?.id?.[0] || Date.now(),
          sessionId,
          code,
          scan_timestamp: timestamp || Date.now(),
          createdAt: new Date().toISOString(),
        };

        // 모든 클라이언트에게 브로드캐스트
        io.to(sessionId).emit('new-scan', scanRecord);

        socket.emit('scan-received', {
          success: true,
          code,
        });

        const dateObject = new Date(timestamp);
        const kstDate = dateObject.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        console.log('새 스캔 데이터:', '스캔값:', code, '세션ID:', sessionId, '스캔시간:', kstDate);
      } catch (err) {
        console.error('스캔 데이터 저장 실패:', err);
        socket.emit('error', { message: '데이터 저장 실패' });
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch (err) {
            console.error('Connection close error:', err);
          }
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
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
