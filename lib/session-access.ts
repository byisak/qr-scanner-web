// lib/session-access.ts - 세션/스캔 데이터 접근 권한 확인 유틸리티
//
// 보안: 이전에는 세션 이름 변경·스캔 삭제·내보내기 등이 인증 없이 가능했고,
// 소유자가 없는(user_id IS NULL) 세션은 누구나 설정을 바꾸거나 삭제할 수 있었다.
// 모든 변경 API는 이 파일의 헬퍼로 "로그인 + (세션 소유자 또는 관리자)"를 확인한다.
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getUserFromRequest } from './auth';

export interface RequestUser {
  userId: string;
  email: string;
}

export interface SessionRow {
  session_id: string;
  user_id: string | null;
  status: string;
}

/**
 * 요청의 Authorization: Bearer 헤더에서 사용자 추출
 * (앱/웹 대시보드가 이미 보내는 헤더와 동일한 형식)
 */
export function getRequestUser(request: NextRequest): RequestUser | null {
  const payload = getUserFromRequest(request.headers.get('authorization'));
  if (!payload || !payload.userId) return null;
  return { userId: payload.userId, email: payload.email };
}

/**
 * 관리자(admin, super_admin) 여부 확인
 */
export async function isAdminUser(client: PoolClient, userId: string): Promise<boolean> {
  const result = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  const role = result.rows[0]?.role;
  return role === 'admin' || role === 'super_admin';
}

export function unauthorizedResponse(message = '인증이 필요합니다.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = '권한이 없습니다.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export type SessionOwnerCheck =
  | { ok: true; session: SessionRow; user: RequestUser; isAdmin: boolean }
  | { ok: false; response: NextResponse };

/**
 * 세션 소유자 또는 관리자만 통과
 * - 비로그인: 401
 * - 세션 없음: 404
 * - 소유자가 아님(소유자 없는 레거시 세션 포함): 관리자가 아니면 403
 */
export async function requireSessionOwner(
  client: PoolClient,
  request: NextRequest,
  sessionId: string,
  actionLabel: string
): Promise<SessionOwnerCheck> {
  const user = getRequestUser(request);
  if (!user) {
    return { ok: false, response: unauthorizedResponse(`${actionLabel} 로그인이 필요합니다.`) };
  }

  const result = await client.query<SessionRow>(
    `SELECT session_id, user_id, status FROM sessions WHERE session_id = $1`,
    [sessionId]
  );
  if (result.rows.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 }),
    };
  }

  const session = result.rows[0];
  if (session.user_id && session.user_id === user.userId) {
    return { ok: true, session, user, isAdmin: false };
  }

  // 소유자가 아니면 관리자만 허용 (소유자 없는 세션은 관리자만 관리 가능)
  const admin = await isAdminUser(client, user.userId);
  if (!admin) {
    return { ok: false, response: forbiddenResponse(`${actionLabel} 권한이 없습니다.`) };
  }
  return { ok: true, session, user, isAdmin: true };
}

// 소켓 서버(server.ts)와 공용으로 쓰는 열람 권한/시도 제한 로직
export {
  canViewSession,
  isPasswordAttemptLimited,
  recordPasswordFailure,
  clearPasswordFailures,
} from './session-guard';
