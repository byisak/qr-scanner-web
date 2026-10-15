// lib/session-service.ts - 세션 생성/스캔 저장/열람 공용 로직
//
// 소켓 서버(server.ts)와 REST API(app/api/sessions/...)가 같은 규칙을 쓰도록 여기에 모은다.
// next/server 의존성이 없어야 server.ts(tsx)에서도 import 가능하다.
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { PoolClient } from 'pg';
import { hashPassword } from './auth';
import { canViewSession } from './session-guard';

export const MAX_SCAN_CODE_LENGTH = 4096;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_SESSION_NAME_LENGTH = 255;

export interface ScanRecord {
  id: number;
  sessionId: string;
  code: string;
  scan_timestamp: number;
  createdAt: string;
  userId: string | null;
  userName: string | null;
}

export interface SessionAccessRow {
  session_id: string;
  user_id: string | null;
  session_name: string | null;
  is_public: boolean | null;
  password_hash: string | null;
  realtime_key: string | null;
}

/** 추측 불가능한 실시간 채널 키 (64자리 16진수) */
export function generateRealtimeKey(): string {
  return randomBytes(32).toString('hex');
}

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_PATTERN.test(value);
}

export async function isAdminUserId(client: PoolClient, userId: string): Promise<boolean> {
  const result = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  const role = result.rows[0]?.role;
  return role === 'admin' || role === 'super_admin';
}

export async function loadSessionForAccess(
  client: PoolClient,
  sessionId: string
): Promise<SessionAccessRow | null> {
  const result = await client.query<SessionAccessRow>(
    `SELECT s.session_id, s.user_id, s.session_name, ss.is_public, ss.password_hash, ss.realtime_key
     FROM sessions s
     LEFT JOIN session_settings ss ON ss.session_id = s.session_id
     WHERE s.session_id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

/**
 * 세션의 실시간 채널 키를 돌려준다. 설정 행이나 키가 없으면(옛 세션) 만들어 저장한다.
 */
export async function ensureRealtimeKey(client: PoolClient, sessionId: string): Promise<string> {
  const result = await client.query<{ realtime_key: string }>(
    `INSERT INTO session_settings (session_id, realtime_key)
     VALUES ($1, $2)
     ON CONFLICT (session_id)
     DO UPDATE SET realtime_key = COALESCE(session_settings.realtime_key, EXCLUDED.realtime_key)
     RETURNING realtime_key`,
    [sessionId, generateRealtimeKey()]
  );
  return result.rows[0].realtime_key;
}

// ============================================
// 세션 생성 / 이어 쓰기
// ============================================

export interface SessionSettingsInput {
  password?: unknown;
  isPublic?: unknown;
  maxParticipants?: unknown;
  allowAnonymous?: unknown;
  expiresAt?: unknown;
}

export type CreateSessionResult =
  | {
      kind: 'created' | 'updated';
      sessionId: string;
      sessionName: string | null;
      userId: string | null;
      realtimeKey: string;
    }
  | { kind: 'forbidden'; sessionId: string; existing: SessionAccessRow };

/**
 * 세션을 만들거나(없으면) 소유자/관리자 권한으로 이름·설정을 바꾼다.
 * - verifiedUserId: 토큰으로 검증된 사용자 (REST는 항상 이것만 사용)
 * - claimedUserId: 검증되지 않은 userId (구버전 앱 소켓 호환용, REST에서는 넘기지 않는다)
 * - 기존 세션: 검증된 소유자/관리자만 변경 가능.
 *   소유자 없는 옛 세션 + 비밀번호 없음 + 공개면 요청 사용자가 소유자가 된다 (기존 소켓 동작과 같음).
 *   그 외에는 { kind: 'forbidden' } 을 돌려준다.
 */
export async function createOrUpdateSession(
  client: PoolClient,
  opts: {
    sessionId?: string | null;
    sessionName?: string | null;
    settings?: SessionSettingsInput | null;
    verifiedUserId: string | null;
    claimedUserId?: string | null;
    socketId?: string | null;
  }
): Promise<CreateSessionResult> {
  const sessionId = opts.sessionId || uuidv4();
  const sessionName = opts.sessionName || null;
  const settings: SessionSettingsInput = opts.settings && typeof opts.settings === 'object' ? opts.settings : {};
  const hasSettings = Object.keys(settings).length > 0;
  const userId = opts.verifiedUserId || opts.claimedUserId || null;

  const existing = await loadSessionForAccess(client, sessionId);

  if (!existing) {
    await client.query(
      `INSERT INTO sessions (session_id, socket_id, user_id, session_name, created_at, last_activity, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')`,
      [sessionId, opts.socketId || null, userId, sessionName]
    );
    const realtimeKey = await upsertSessionSettings(client, sessionId, settings, true);
    return { kind: 'created', sessionId, sessionName, userId, realtimeKey };
  }

  const isVerifiedOwner = !!opts.verifiedUserId && existing.user_id === opts.verifiedUserId;
  const isVerifiedAdmin =
    !!opts.verifiedUserId && !isVerifiedOwner && (await isAdminUserId(client, opts.verifiedUserId));
  const canClaimOwnerless =
    !existing.user_id && !!userId && existing.is_public !== false && !existing.password_hash;

  if (!isVerifiedOwner && !isVerifiedAdmin && !canClaimOwnerless) {
    return { kind: 'forbidden', sessionId, existing };
  }

  let finalName = existing.session_name;
  let finalUserId = existing.user_id;
  if (userId || sessionName) {
    const updated = await client.query<{ user_id: string | null; session_name: string | null }>(
      `UPDATE sessions SET
         user_id = COALESCE(user_id, $1),
         session_name = COALESCE($2, session_name),
         last_activity = CURRENT_TIMESTAMP
       WHERE session_id = $3
       RETURNING user_id, session_name`,
      [userId, sessionName, sessionId]
    );
    finalName = updated.rows[0]?.session_name ?? finalName;
    finalUserId = updated.rows[0]?.user_id ?? finalUserId;
  }

  const realtimeKey = hasSettings
    ? await upsertSessionSettings(client, sessionId, settings, false)
    : await ensureRealtimeKey(client, sessionId);

  return { kind: 'updated', sessionId, sessionName: finalName, userId: finalUserId, realtimeKey };
}

/**
 * 세션 설정 저장. 새 세션은 기본값(공개, 비밀번호 없음)으로 만들고,
 * 기존 세션은 요청에 들어 있는 항목만 바꾼다 (isPublic 을 빠뜨렸다고 공개로 되돌리지 않는다).
 */
async function upsertSessionSettings(
  client: PoolClient,
  sessionId: string,
  settings: SessionSettingsInput,
  isNew: boolean
): Promise<string> {
  const passwordHash =
    typeof settings.password === 'string' && settings.password ? hashPassword(settings.password) : null;
  const isPublic = typeof settings.isPublic === 'boolean' ? settings.isPublic : isNew ? true : null;
  const maxParticipants =
    typeof settings.maxParticipants === 'number' && settings.maxParticipants > 0 ? settings.maxParticipants : null;
  const allowAnonymous =
    typeof settings.allowAnonymous === 'boolean' ? settings.allowAnonymous : isNew ? true : null;
  const expiresAt = typeof settings.expiresAt === 'string' && settings.expiresAt ? settings.expiresAt : null;

  const result = await client.query<{ realtime_key: string }>(
    `INSERT INTO session_settings
       (session_id, password_hash, is_public, max_participants, allow_anonymous, expires_at, realtime_key, updated_at)
     VALUES ($1, $2, COALESCE($3, true), $4, COALESCE($5, true), $6, $7, CURRENT_TIMESTAMP)
     ON CONFLICT (session_id)
     DO UPDATE SET
       password_hash = COALESCE($2, session_settings.password_hash),
       is_public = COALESCE($3, session_settings.is_public),
       max_participants = COALESCE($4, session_settings.max_participants),
       allow_anonymous = COALESCE($5, session_settings.allow_anonymous),
       expires_at = COALESCE($6, session_settings.expires_at),
       realtime_key = COALESCE(session_settings.realtime_key, EXCLUDED.realtime_key),
       updated_at = CURRENT_TIMESTAMP
     RETURNING realtime_key`,
    [sessionId, passwordHash, isPublic, maxParticipants, allowAnonymous, expiresAt, generateRealtimeKey()]
  );
  return result.rows[0].realtime_key;
}

// ============================================
// 스캔 저장
// ============================================

export type ScanCodeValidation = { ok: true; code: string } | { ok: false; error: string; code: string };

export function validateScanCode(value: unknown): ScanCodeValidation {
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, error: '스캔 값(code)이 필요합니다.', code: 'INVALID_CODE' };
  }
  if (value.length > MAX_SCAN_CODE_LENGTH) {
    return { ok: false, error: `스캔 값은 최대 ${MAX_SCAN_CODE_LENGTH}자입니다.`, code: 'CODE_TOO_LONG' };
  }
  return { ok: true, code: value };
}

function normalizeTimestamp(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : Date.now();
}

/**
 * 스캔 저장 후 실시간 알림용 레코드를 돌려준다.
 * - userId 가 DB에 있는 사용자일 때만 user_id 로 저장한다.
 * - userName 은 users.name, 없으면 null (이메일을 대신 내보내지 않는다).
 */
export async function insertScan(
  client: PoolClient,
  opts: { sessionId: string; code: string; timestamp?: unknown; userId: string | null }
): Promise<ScanRecord> {
  const scanTimestamp = normalizeTimestamp(opts.timestamp);

  await client.query(`UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1`, [
    opts.sessionId,
  ]);

  let validUserId: string | null = null;
  let userName: string | null = null;
  if (opts.userId) {
    const userResult = await client.query(`SELECT id, name FROM users WHERE id = $1`, [opts.userId]);
    if (userResult.rows.length > 0) {
      validUserId = userResult.rows[0].id;
      userName = userResult.rows[0].name || null;
    }
  }

  const result = await client.query<{ id: number; created_at: Date | null }>(
    `INSERT INTO scan_data (session_id, user_id, code, scan_timestamp, created_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     RETURNING id, created_at`,
    [opts.sessionId, validUserId, opts.code, scanTimestamp]
  );

  const createdAt = result.rows[0].created_at;
  return {
    id: result.rows[0].id,
    sessionId: opts.sessionId,
    code: opts.code,
    scan_timestamp: scanTimestamp,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : new Date().toISOString(),
    userId: validUserId,
    userName,
  };
}

// ============================================
// 세션 열람 (웹 세션 화면의 초기 데이터)
// ============================================

/** scan_data + users 조회 행 → 화면/실시간 페이로드 형식 (이름 없으면 null, 이메일 미노출) */
export function mapScanRow(row: any): ScanRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    code: row.code,
    scan_timestamp: parseInt(row.scan_timestamp, 10) || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    userId: row.user_id || null,
    userName: row.user_name || null,
  };
}

/**
 * 세션의 기존 스캔 조회. filterUserId 가 있으면 그 사용자가 스캔한 것만 (소켓 join-session 과 같은 규칙).
 */
export async function loadSessionScans(
  client: PoolClient,
  sessionId: string,
  filterUserId: string | null
): Promise<ScanRecord[]> {
  const base = `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                       u.name as user_name
                FROM scan_data sd
                LEFT JOIN users u ON sd.user_id = u.id
                WHERE sd.session_id = $1`;
  const result = filterUserId
    ? await client.query(`${base} AND sd.user_id = $2 ORDER BY sd.created_at ASC`, [sessionId, filterUserId])
    : await client.query(`${base} ORDER BY sd.created_at ASC`, [sessionId]);
  return result.rows.map(mapScanRow);
}

/**
 * 세션 열람 권한 확인 (소유자/관리자 → 항상, 비공개 → 소유자/관리자만,
 * 비밀번호 → 비밀번호 또는 세션 접근 토큰, 공개 → 누구나)
 */
export async function checkViewAccess(
  client: PoolClient,
  session: SessionAccessRow,
  opts: { verifiedUserId: string | null; sessionAccessToken?: unknown; passwordValid?: boolean }
): Promise<boolean> {
  const isPublic = session.is_public ?? true;
  const needsAdminCheck =
    !!opts.verifiedUserId &&
    session.user_id !== opts.verifiedUserId &&
    (!isPublic || !!session.password_hash);
  const verifiedIsAdmin = needsAdminCheck ? await isAdminUserId(client, opts.verifiedUserId!) : false;
  return canViewSession({
    sessionId: session.session_id,
    ownerId: session.user_id,
    isPublic,
    passwordHash: session.password_hash,
    verifiedUserId: opts.verifiedUserId,
    verifiedIsAdmin,
    sessionAccessToken: opts.sessionAccessToken,
    passwordValid: opts.passwordValid,
  });
}
