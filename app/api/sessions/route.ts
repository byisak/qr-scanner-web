import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-middleware';
import { isAdminUser, getRequestUser } from '@/lib/session-access';
import { createOrUpdateSession, isValidSessionId } from '@/lib/session-service';
import { apiError } from '@/lib/api-response';
import type { PoolClient } from 'pg';

// POST - 세션 만들기 (또는 내 세션 이어 쓰기)  — docs/REALTIME_REST_CONTRACT.md 1절
// body: { sessionId?, sessionName?, settings?: { password?, isPublic? } }
// - 새 세션: 소유자 = 토큰 사용자, 201
// - 기존 세션: 소유자/관리자만 (소유자 없는 옛 공개·무비밀번호 세션은 토큰 사용자가 소유자가 됨), 200
//   본문에 없는 항목(이름·비밀번호·공개 여부)은 바꾸지 않는다 (부분 업데이트).
// - 그 외 403
export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const user = getRequestUser(request);
    if (!user) {
      return apiError(401, 'UNAUTHORIZED', '인증이 필요합니다.');
    }

    let body: any = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return apiError(400, 'INVALID_JSON', '요청 본문이 올바른 JSON이 아닙니다.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return apiError(400, 'INVALID_REQUEST', '요청 본문이 올바르지 않습니다.');
    }

    const { sessionId, sessionName, settings } = body;
    if (sessionId !== undefined && sessionId !== null && !isValidSessionId(sessionId)) {
      return apiError(400, 'INVALID_SESSION_ID', '세션 ID 형식이 올바르지 않습니다.');
    }
    if (sessionName !== undefined && sessionName !== null && (typeof sessionName !== 'string' || sessionName.length > 255)) {
      return apiError(400, 'INVALID_SESSION_NAME', '세션 이름은 255자 이하 문자열이어야 합니다.');
    }
    if (settings !== undefined && settings !== null) {
      if (typeof settings !== 'object' || Array.isArray(settings)) {
        return apiError(400, 'INVALID_SETTINGS', '설정 형식이 올바르지 않습니다.');
      }
      if (settings.password !== undefined && settings.password !== null && typeof settings.password !== 'string') {
        return apiError(400, 'INVALID_SETTINGS', '비밀번호는 문자열이어야 합니다.');
      }
      if (settings.isPublic !== undefined && settings.isPublic !== null && typeof settings.isPublic !== 'boolean') {
        return apiError(400, 'INVALID_SETTINGS', 'isPublic 은 true/false 여야 합니다.');
      }
    }

    // 계약에 있는 설정만 반영 (password, isPublic). 빠진 항목은 기존 값 유지.
    const settingsInput: Record<string, unknown> = {};
    if (settings && typeof settings.password === 'string' && settings.password) settingsInput.password = settings.password;
    if (settings && typeof settings.isPublic === 'boolean') settingsInput.isPublic = settings.isPublic;

    client = await getConnection();
    const result = await createOrUpdateSession(client, {
      sessionId: sessionId || null,
      sessionName: sessionName || null,
      settings: settingsInput,
      verifiedUserId: user.userId,
    });

    if (result.kind === 'forbidden') {
      return apiError(403, 'FORBIDDEN', '이 세션을 변경할 권한이 없습니다.');
    }

    const created = result.kind === 'created';
    return NextResponse.json(
      {
        success: true,
        sessionId: result.sessionId,
        sessionName: result.sessionName,
        userId: result.userId,
        created,
      },
      { status: created ? 201 : 200 }
    );
  } catch (err) {
    console.error('[POST /api/sessions] 실패:', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '세션 생성에 실패했습니다.');
  } finally {
    if (client) {
      client.release();
    }
  }
}

// GET - 세션 목록 조회 (status 파라미터로 필터링 가능)
// ?status=ACTIVE (기본값) - 활성 세션만
// ?status=DELETED - 삭제된 세션만
// ?status=ALL - 모든 상태
// ?mine=true - (하위 호환용) 항상 내 세션만 반환하므로 의미 없음
// ?all=true - 관리자 전용: 전체 사용자의 세션 조회
//
// 보안: 이전에는 비로그인 요청에도 모든 사용자의 세션 목록(user_id, 세션 ID 포함)을
// 반환해, 세션 ID만 알면 접근 가능한 데이터가 전부 노출되었다.
// 이제 로그인이 필수이며, 본인 세션만 반환한다 (관리자는 all=true로 전체 조회 가능).
export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'ACTIVE';
    const wantAll = searchParams.get('all') === 'true';

    // 인증 필수
    const authUser = optionalAuth(request);
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    client = await getConnection();

    // 관리자만 전체 세션 조회 허용
    const listAll = wantAll && (await isAdminUser(client, authUser.userId));

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // 상태 필터
    if (statusFilter === 'ACTIVE') {
      conditions.push(`s.status = 'ACTIVE'`);
    } else if (statusFilter === 'DELETED') {
      conditions.push(`s.status = 'DELETED'`);
    }
    // status=ALL인 경우 상태 조건 없음

    // 내 세션만 (관리자 전체 조회가 아닌 경우 항상)
    if (!listAll) {
      conditions.push(`s.user_id = $${paramIndex++}`);
      values.push(authUser.userId);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 스캔 카운트 서브쿼리: 인증된 사용자의 경우 자신의 스캔만 카운트
    let scanCountSubquery: string;
    if (!listAll) {
      scanCountSubquery = `(SELECT COUNT(*) FROM scan_data sd WHERE sd.session_id = s.session_id AND sd.user_id = $${paramIndex})`;
      values.push(authUser.userId);
    } else {
      scanCountSubquery = `(SELECT COUNT(*) FROM scan_data sd WHERE sd.session_id = s.session_id)`;
    }

    const result = await client.query(
      `SELECT
        s.session_id,
        s.user_id,
        s.session_name,
        s.created_at,
        s.last_activity,
        s.status,
        s.deleted_at,
        ${scanCountSubquery} as scan_count,
        ss.is_public,
        CASE WHEN ss.password_hash IS NOT NULL THEN true ELSE false END as has_password,
        ss.max_participants,
        ss.allow_anonymous,
        ss.expires_at
       FROM sessions s
       LEFT JOIN session_settings ss ON s.session_id = ss.session_id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      values
    );

    const sessions = result.rows.map((row: any) => ({
      session_id: row.session_id,
      user_id: row.user_id || null,
      session_name: row.session_name || null,
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      last_activity: row.last_activity ? row.last_activity.toISOString() : new Date().toISOString(),
      status: row.status,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
      scan_count: parseInt(row.scan_count) || 0,
      settings: {
        isPublic: row.is_public ?? true,
        hasPassword: row.has_password ?? false,
        maxParticipants: row.max_participants || null,
        allowAnonymous: row.allow_anonymous ?? true,
        expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      },
    }));

    return NextResponse.json(sessions);
  } catch (err: any) {
    // console.error('세션 목록 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
