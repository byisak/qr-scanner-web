import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { initializePool, getConnection } from './lib/db';
import { verifyAccessToken, verifyPassword } from './lib/auth';
import {
  canViewSession,
  isPasswordAttemptLimited,
  recordPasswordFailure,
  clearPasswordFailures,
} from './lib/session-guard';
import {
  createOrUpdateSession,
  insertScan,
  isAdminUserId,
  loadSessionForAccess,
  loadSessionScans,
  validateScanCode,
} from './lib/session-service';
import { broadcastNewScan, registerSocketServer } from './lib/realtime';
import type { PoolClient } from 'pg';
import type { Socket } from 'socket.io';

// ============================================
// 소켓 인증/권한 헬퍼
// ============================================

// 소켓 이벤트 payload(accessToken) 또는 연결 시 handshake.auth.token 에서 사용자 검증.
// 현재 배포된 앱은 토큰을 보내지 않으므로(검증 불가한 userId만 보냄) 없으면 null.
function getSocketUser(socket: Socket, data: any): { userId: string } | null {
  const token =
    (data && typeof data === 'object' && typeof data.accessToken === 'string' && data.accessToken) ||
    (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token) ||
    null;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  return payload?.userId ? { userId: payload.userId } : null;
}

// 소켓 비밀번호 검증 (REST와 동일하게 시도 횟수 제한)
function checkSocketPassword(socket: Socket, sessionId: string, password: unknown, passwordHash: string | null): boolean {
  if (!passwordHash || typeof password !== 'string' || !password) return false;
  const key = `socket:${socket.handshake.address}:${sessionId}`;
  if (isPasswordAttemptLimited(key)) return false;
  const ok = verifyPassword(password, passwordHash);
  if (ok) {
    clearPasswordFailures(key);
  } else {
    recordPasswordFailure(key);
  }
  return ok;
}

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
  // console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      // console.error('Error occurred handling', req.url, err);
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

  // REST 스캔 API(lib/realtime.ts)가 같은 프로세스에서 Socket.IO 방으로 new-scan 을 보낼 수 있게 등록
  registerSocketServer(io);

  io.on('connection', (socket) => {
    // console.log('클라이언트 연결:', socket.id);

    // 세션 생성
    socket.on('create-session', async (data) => {
      let client: PoolClient | null = null;
      try {
        const claimedUserId = typeof data?.userId === 'string' ? data.userId : null;
        const sessionName = typeof data?.sessionName === 'string' ? data.sessionName : null;

        // 토큰으로 검증된 사용자가 있으면 그 ID를 우선 사용 (구버전 앱은 토큰 없이 userId만 보냄)
        const verifiedUser = getSocketUser(socket, data);

        client = await getConnection();

        // 공용 로직 (REST POST /api/sessions 와 동일한 소유자/관리자 규칙)
        const result = await createOrUpdateSession(client, {
          sessionId: typeof data?.sessionId === 'string' && data.sessionId ? data.sessionId : null,
          sessionName,
          settings: data?.settings,
          verifiedUserId: verifiedUser?.userId || null,
          claimedUserId,
          socketId: socket.id,
        });

        if (result.kind === 'forbidden') {
          // 보안: 기존 세션 변경은 토큰으로 검증된 소유자 또는 관리자만 가능하다.
          // 설정/소유자는 변경하지 않고, 열람 가능한 세션일 때만 방에 참가
          const existing = result.existing;
          const viewable = canViewSession({
            sessionId: result.sessionId,
            ownerId: existing.user_id,
            isPublic: existing.is_public ?? true,
            passwordHash: existing.password_hash,
            verifiedUserId: verifiedUser?.userId || null,
            verifiedIsAdmin: false,
            sessionAccessToken: data?.sessionAccessToken,
          });
          if (viewable) {
            socket.join(result.sessionId);
          }
          socket.emit('session-created', {
            sessionId: result.sessionId,
            sessionName: existing.session_name,
            userId: existing.user_id,
            message: '이미 존재하는 세션입니다.',
          });
          return;
        }

        socket.join(result.sessionId);

        socket.emit('session-created', {
          sessionId: result.sessionId,
          sessionName: result.kind === 'created' ? result.sessionName : sessionName,
          userId: result.kind === 'created' ? result.userId : verifiedUser?.userId || claimedUserId || null,
          message: '세션이 생성되었습니다.',
        });
      } catch (err) {
        // console.error('세션 생성 실패:', err);
        socket.emit('error', { message: '세션 생성 실패' });
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    // 세션 참가
    // payload: { sessionId, userId?, sessionName?, accessToken?, sessionAccessToken?, password? }
    // - accessToken: 로그인 사용자 JWT (소유자/관리자 확인용)
    // - sessionAccessToken: POST /api/sessions/:id/settings 비밀번호 검증 후 발급된 토큰
    // - password: 세션 비밀번호 (토큰 대신 직접 제시)
    socket.on('join-session', async (data) => {
      let client: PoolClient | null = null;
      try {
        // sessionId, userId, sessionName을 클라이언트에서 직접 받음
        const sessionId = typeof data === 'string' ? data : data?.sessionId;
        const claimedUserId = typeof data === 'object' ? data?.userId : null;
        const sessionName = typeof data === 'object' ? data?.sessionName : null;

        if (!sessionId) {
          socket.emit('error', { message: '세션 ID가 필요합니다.' });
          return;
        }

        const verifiedUser = getSocketUser(socket, data);
        // 스캔 필터/소유자 지정에 쓰는 ID: 검증된 사용자 우선, 없으면 (구버전 앱 호환) 클라이언트가 보낸 userId
        const userId = verifiedUser?.userId || claimedUserId || null;

        client = await getConnection();

        // 세션 + 설정 조회
        let existingSession = await loadSessionForAccess(client, sessionId);

        if (!existingSession) {
          // 세션이 없으면 자동으로 생성
          // console.log('새 세션 자동 생성:', sessionId, sessionName ? `이름: ${sessionName}` : '', userId ? `(사용자: ${userId})` : '(비로그인)');
          await client.query(
            `INSERT INTO sessions (session_id, socket_id, user_id, session_name, created_at, last_activity, status)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            [sessionId, socket.id, userId || null, sessionName]
          );
          existingSession = {
            session_id: sessionId,
            user_id: userId || null,
            session_name: sessionName,
            is_public: null,
            password_hash: null,
            realtime_key: null,
          };
        } else {
          // console.log('기존 세션 발견:', sessionId, '현재 user_id:', existingSession.user_id, '요청 userId:', userId);
          const isProtected = existingSession.is_public === false || !!existingSession.password_hash;
          const isOwnerClaim = !!userId && existingSession.user_id === userId;

          // 보안: 소유자 없는 세션의 소유권 지정은 보호 설정(비공개/비밀번호)이 없을 때만 허용
          const shouldUpdateUserId = !!userId && !existingSession.user_id && !isProtected;
          // 보안: 세션 이름 변경은 (주장된) 소유자만 — 이전에는 누구나 이름을 바꿀 수 있었다
          const shouldUpdateName =
            !!sessionName && sessionName !== existingSession.session_name && (isOwnerClaim || shouldUpdateUserId);

          if (shouldUpdateUserId || shouldUpdateName) {
            await client.query(
              `UPDATE sessions SET
                last_activity = CURRENT_TIMESTAMP,
                socket_id = $1,
                user_id = COALESCE(user_id, $2),
                session_name = COALESCE($3, session_name)
               WHERE session_id = $4`,
              [socket.id, shouldUpdateUserId ? userId : null, shouldUpdateName ? sessionName : null, sessionId]
            );
            if (shouldUpdateUserId) existingSession.user_id = userId;
          } else {
            await client.query(
              `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, socket_id = $1
               WHERE session_id = $2`,
              [socket.id, sessionId]
            );
          }
        }

        const sessionSettings = {
          is_public: existingSession.is_public ?? true,
          has_password: !!existingSession.password_hash,
        };

        // 보안: 이전에는 비밀번호 보호/비공개 세션도 join-session만 보내면 기존 스캔 데이터를
        // 전부 받고 방에 참가해 실시간 스캔까지 수신할 수 있었다.
        // 이제 소유자/관리자(토큰 검증) 또는 비밀번호(또는 세션 접근 토큰)가 확인된 경우에만 허용한다.
        const verifiedIsAdmin =
          !!verifiedUser &&
          existingSession.user_id !== verifiedUser.userId &&
          (sessionSettings.has_password || !sessionSettings.is_public) &&
          (await isAdminUserId(client, verifiedUser.userId));

        const allowed = canViewSession({
          sessionId,
          ownerId: existingSession.user_id,
          isPublic: sessionSettings.is_public,
          passwordHash: existingSession.password_hash,
          verifiedUserId: verifiedUser?.userId || null,
          verifiedIsAdmin,
          sessionAccessToken: typeof data === 'object' ? data?.sessionAccessToken : undefined,
          passwordValid:
            typeof data === 'object' && data?.password
              ? checkSocketPassword(socket, sessionId, data.password, existingSession.password_hash)
              : false,
        });

        if (!allowed) {
          const reason = !sessionSettings.is_public ? 'PRIVATE' : 'PASSWORD_REQUIRED';
          socket.emit('session-access-denied', {
            sessionId,
            reason,
            settings: {
              isPublic: sessionSettings.is_public,
              hasPassword: sessionSettings.has_password,
            },
          });
          socket.emit('error', {
            code: reason,
            message: reason === 'PRIVATE' ? '비공개 세션입니다.' : '세션 비밀번호가 필요합니다.',
          });
          return;
        }

        socket.join(sessionId);

        // 기존 스캔 데이터 조회 (로그인 사용자는 본인 스캔만, 사용자 이름은 users.name 또는 null)
        const existingScans = await loadSessionScans(client, sessionId, userId);

        socket.emit('session-joined', {
          sessionId,
          existingData: existingScans,
          settings: {
            isPublic: sessionSettings.is_public,
            hasPassword: sessionSettings.has_password,
          },
        });

        // console.log('세션 참가:', sessionId, userId ? `(사용자: ${userId}, 스캔: ${existingScans.length}개)` : '(비로그인)');
      } catch (err) {
        // console.error('세션 참가 실패:', err);
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
        // 구버전 앱 호환: 토큰 없이 userId 만 보낸다 (REST POST /api/sessions/:id/scans 는 소유자만 허용)
        const sessionId = payload?.sessionId;
        const scanUserId = typeof payload?.userId === 'string' ? payload.userId : null;

        if (!sessionId || typeof sessionId !== 'string' || !payload?.code) {
          socket.emit('error', { message: '잘못된 데이터 형식' });
          return;
        }
        const codeCheck = validateScanCode(payload.code);
        if (!codeCheck.ok) {
          socket.emit('error', { message: codeCheck.error });
          return;
        }

        client = await getConnection();

        const session = await loadSessionForAccess(client, sessionId);
        if (!session) {
          socket.emit('error', { message: '세션을 찾을 수 없습니다.' });
          return;
        }

        const scanRecord = await insertScan(client, {
          sessionId,
          code: codeCheck.code,
          timestamp: payload.timestamp,
          userId: scanUserId,
        });

        // Socket.IO 방 + (설정돼 있으면) Supabase Realtime 으로 브로드캐스트
        await broadcastNewScan(sessionId, session.realtime_key, scanRecord);

        socket.emit('scan-received', {
          success: true,
          code: codeCheck.code,
        });
      } catch (err) {
        // console.error('스캔 데이터 저장 실패:', err);
        socket.emit('error', { message: '데이터 저장 실패' });
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    socket.on('disconnect', () => {
      // console.log('클라이언트 연결 해제:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      // console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      // console.log(`> Ready on http://${hostname}:${port}`);
    });
});
