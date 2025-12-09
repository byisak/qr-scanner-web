import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

// GET - 세션 목록 조회 (status 파라미터로 필터링 가능)
// ?status=ACTIVE (기본값) - 활성 세션만
// ?status=DELETED - 삭제된 세션만
// ?status=ALL - 모든 세션
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'ACTIVE';

    connection = await getConnection();

    let whereClause = '';
    if (statusFilter === 'ACTIVE') {
      whereClause = `WHERE s.status = 'ACTIVE'`;
    } else if (statusFilter === 'DELETED') {
      whereClause = `WHERE s.status = 'DELETED'`;
    }
    // status=ALL인 경우 WHERE 절 없음

    const result = await connection.execute(
      `SELECT
        s.session_id,
        s.created_at,
        s.last_activity,
        s.status,
        s.deleted_at,
        COUNT(sd.id) as scan_count
       FROM sessions s
       LEFT JOIN scan_data sd ON s.session_id = sd.session_id
       ${whereClause}
       GROUP BY s.session_id, s.created_at, s.last_activity, s.status, s.deleted_at
       ORDER BY s.created_at DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const sessions = (result.rows || []).map((row: any) => ({
      session_id: row.SESSION_ID,
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
