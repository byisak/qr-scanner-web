import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-middleware';
import type { PoolClient } from 'pg';

// GET - 세션 목록 조회 (status 파라미터로 필터링 가능)
// ?status=ACTIVE (기본값) - 활성 세션만
// ?status=DELETED - 삭제된 세션만
// ?status=ALL - 모든 세션
// ?mine=true - 내 세션만 (인증 필요)
export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'ACTIVE';
    const mineOnly = searchParams.get('mine') === 'true';

    // 인증 정보 확인 (선택적)
    const authUser = optionalAuth(request);

    client = await getConnection();

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

    // 내 세션만 필터 (인증된 경우에만)
    if (mineOnly && authUser) {
      conditions.push(`s.user_id = $${paramIndex++}`);
      values.push(authUser.userId);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await client.query(
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
    }));

    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error('세션 목록 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
