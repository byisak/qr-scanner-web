import dotenv from 'dotenv';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { initializePool, getConnection } from './lib/db';
import { hashPassword, verifyAccessToken, verifyPassword } from './lib/auth';
import {
  canViewSession,
  isPasswordAttemptLimited,
  recordPasswordFailure,
  clearPasswordFailures,
} from './lib/session-guard';
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

async function isAdminUserId(client: PoolClient, userId: string): Promise<boolean> {
  const result = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  const role = result.rows[0]?.role;
  return role === 'admin' || role === 'super_admin';
}

interface SessionAccessRow {
  session_id: string;
  user_id: string | null;
  session_name: string | null;
  is_public: boolean | null;
  password_hash: string | null;
}

async function loadSessionForAccess(client: PoolClient, sessionId: string): Promise<SessionAccessRow | null> {
  const result = await client.query<SessionAccessRow>(
    `SELECT s.session_id, s.user_id, s.session_name, ss.is_public, ss.password_hash
     FROM sessions s
     LEFT JOIN session_settings ss ON ss.session_id = s.session_id
     WHERE s.session_id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
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

  io.on('connection', (socket) => {
    // console.log('클라이언트 연결:', socket.id);

    // 세션 생성
    socket.on('create-session', async (data) => {
      let client: PoolClient | null = null;
      try {
        const sessionId = data?.sessionId || uuidv4();
        const claimedUserId = data?.userId || null;
        const sessionName = data?.sessionName || null;
        const settings = data?.settings || {};

        // 토큰으로 검증된 사용자가 있으면 그 ID를 우선 사용 (구버전 앱은 토큰 없이 userId만 보냄)
        const verifiedUser = getSocketUser(socket, data);
        const userId = verifiedUser?.userId || claimedUserId;

        client = await getConnection();

        // 세션이 이미 존재하는지 확인
        const existing = await loadSessionForAccess(client, sessionId);

        let isNewSession = false;

        if (!existing) {
          isNewSession = true;
          // 세션 생성 (user_id, session_name 포함)
          await client.query(
            `INSERT INTO sessions (session_id, socket_id, user_id, session_name, created_at, last_activity, status)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
            [sessionId, socket.id, userId || null, sessionName]
          );
        } else {
          // 보안: 이전에는 기존 세션 ID로 create-session을 보내면 누구나 소유자/이름/설정
          // (공개 여부 등)을 덮어쓰고 방에 참가해 실시간 스캔을 받아볼 수 있었다.
          // 이제 기존 세션 변경은 토큰으로 검증된 소유자 또는 관리자만 가능하다.
          // (앱은 새 세션 생성에만 create-session을 사용하므로 호환된다)
          const isVerifiedOwner = !!verifiedUser && existing.user_id === verifiedUser.userId;
          const isVerifiedAdmin = !!verifiedUser && !isVerifiedOwner && (await isAdminUserId(client, verifiedUser.userId));
          // 소유자 없는 세션은 보호 설정이 없을 때만 (구버전 앱 호환) 소유권 지정 허용
          const canClaimOwnerless =
            !existing.user_id && !!userId && existing.is_public !== false && !existing.password_hash;

          if (!isVerifiedOwner && !isVerifiedAdmin && !canClaimOwnerless) {
            const viewable = canViewSession({
              sessionId,
              ownerId: existing.user_id,
              isPublic: existing.is_public ?? true,
              passwordHash: existing.password_hash,
              verifiedUserId: verifiedUser?.userId || null,
              verifiedIsAdmin: false,
              sessionAccessToken: data?.sessionAccessToken,
            });
            // 설정/소유자는 변경하지 않고, 열람 가능한 세션일 때만 방에 참가
            if (viewable) {
              socket.join(sessionId);
            }
            socket.emit('session-created', {
              sessionId,
              sessionName: existing.session_name,
              userId: existing.user_id,
              message: '이미 존재하는 세션입니다.',
            });
            return;
          }

          // 기존 세션 업데이트 (user_id, session_name)
          if (userId || sessionName) {
            await client.query(
              `UPDATE sessions SET
                user_id = COALESCE(user_id, $1),
                session_name = COALESCE($2, session_name)
               WHERE session_id = $3`,
              [userId || null, sessionName, sessionId]
            );
          }
        }

        // 세션 설정 저장 (새 세션이거나 설정이 있는 경우)
        if (isNewSession || Object.keys(settings).length > 0) {
          const passwordHash = settings.password ? hashPassword(settings.password) : null;
          const isPublic = settings.isPublic !== undefined ? settings.isPublic : true;
          const maxParticipants = settings.maxParticipants || null;
          const allowAnonymous = settings.allowAnonymous !== undefined ? settings.allowAnonymous : true;
          const expiresAt = settings.expiresAt || null;

          await client.query(
            `INSERT INTO session_settings (session_id, password_hash, is_public, max_participants, allow_anonymous, expires_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             ON CONFLICT (session_id)
             DO UPDATE SET
               password_hash = COALESCE($2, session_settings.password_hash),
               is_public = $3,
               max_participants = COALESCE($4, session_settings.max_participants),
               allow_anonymous = $5,
               expires_at = COALESCE($6, session_settings.expires_at),
               updated_at = CURRENT_TIMESTAMP`,
            [sessionId, passwordHash, isPublic, maxParticipants, allowAnonymous, expiresAt]
          );

          // console.log('세션 설정 저장:', sessionId, '공개:', isPublic, '비밀번호:', passwordHash ? '있음' : '없음');
        }

        socket.join(sessionId);

        socket.emit('session-created', {
          sessionId,
          sessionName,
          userId: userId || null,
          message: '세션이 생성되었습니다.',
        });

        // console.log('새 세션 생성:', sessionId, sessionName ? `이름: ${sessionName}` : '', userId ? `(사용자: ${userId})` : '(비로그인)');
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

        // 기존 스캔 데이터 조회
        let existingScans: any[] = [];

        // 로그인 여부와 관계없이 해당 세션의 모든 스캔 데이터 표시
        const scanQuery = userId
          ? `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                    u.name as user_name, u.email as user_email
             FROM scan_data sd
             LEFT JOIN users u ON sd.user_id = u.id
             WHERE sd.session_id = $1 AND sd.user_id = $2
             ORDER BY sd.created_at ASC`
          : `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                    u.name as user_name, u.email as user_email
             FROM scan_data sd
             LEFT JOIN users u ON sd.user_id = u.id
             WHERE sd.session_id = $1
             ORDER BY sd.created_at ASC`;

        const scanResult = userId
          ? await client.query(scanQuery, [sessionId, userId])
          : await client.query(scanQuery, [sessionId]);

        existingScans = scanResult.rows.map((row: any) => ({
          id: row.id,
          sessionId: row.session_id,
          code: row.code,
          scan_timestamp: parseInt(row.scan_timestamp, 10) || 0,
          createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
          userId: row.user_id || null,
          userName: row.user_name || row.user_email || null,
        }));

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
        const { sessionId, code, timestamp, userId } = payload;
        // 클라이언트에서 전달한 userId 사용
        const scanUserId = userId || null;

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
            // console.log('⚠️ 사용자 ID가 DB에 없음:', scanUserId, '- user_id를 null로 저장');
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

        // console.log('새 스캔 데이터:', '스캔값:', code, '세션ID:', sessionId, '스캔시간:', kstDate, validUserId ? `사용자: ${userName}` : '(사용자 미확인)');
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
