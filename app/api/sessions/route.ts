import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-middleware';
import { isAdminUser } from '@/lib/session-access';
import type { PoolClient } from 'pg';

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
