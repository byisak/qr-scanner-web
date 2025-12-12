import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-middleware';
import oracledb from 'oracledb';

// GET - 세션 목록 조회 (status 파라미터로 필터링 가능)
// ?status=ACTIVE (기본값) - 활성 세션만
// ?status=DELETED - 삭제된 세션만
// ?status=ALL - 모든 세션
// ?mine=true - 내 세션만 (인증 필요)
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'ACTIVE';
    const mineOnly = searchParams.get('mine') === 'true';

    // 인증 정보 확인 (선택적)
    const authUser = optionalAuth(request);

    connection = await getConnection();

    const conditions: string[] = [];
    const binds: Record<string, string> = {};

    // 상태 필터
    if (statusFilter === 'ACTIVE') {
      conditions.push(`s.status = 'ACTIVE'`);
    } else if (statusFilter === 'DELETED') {
      conditions.push(`s.status = 'DELETED'`);
    }
    // status=ALL인 경우 상태 조건 없음

    // 내 세션만 필터 (인증된 경우에만)
    if (mineOnly && authUser) {
      conditions.push(`s.user_id = :userId`);
      binds.userId = authUser.userId;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await connection.execute(
      `SELECT
        s.session_id,
        s.user_id,
        s.session_name,
        s.created_at,
        s.last_activity,
        s.status,
        s.deleted_at,
        COUNT(sd.id) as scan_count
       FROM sessions s
       LEFT JOIN scan_data sd ON s.session_id = sd.session_id
       ${whereClause}
       GROUP BY s.session_id, s.user_id, s.session_name, s.created_at, s.last_activity, s.status, s.deleted_at
       ORDER BY s.created_at DESC`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const sessions = (result.rows || []).map((row: any) => ({
      session_id: row.SESSION_ID,
      user_id: row.USER_ID || null,
      session_name: row.SESSION_NAME || null,
      created_at: row.CREATED_AT ? row.CREATED_AT.toISOString() : new Date().toISOString(),
      last_activity: row.LAST_ACTIVITY ? row.LAST_ACTIVITY.toISOString() : new Date().toISOString(),
      status: row.STATUS,
      deleted_at: row.DELETED_AT ? row.DELETED_AT.toISOString() : null,
      scan_count: row.SCAN_COUNT || 0,
    }));

    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error('세션 목록 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}
