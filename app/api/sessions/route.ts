import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

export async function GET() {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
        s.session_id,
        s.created_at,
        s.last_activity,
        s.status,
        COUNT(sd.id) as scan_count
       FROM sessions s
       LEFT JOIN scan_data sd ON s.session_id = sd.session_id
       WHERE s.status = 'ACTIVE'
       GROUP BY s.session_id, s.created_at, s.last_activity, s.status
       ORDER BY s.last_activity DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const sessions = (result.rows || []).map((row: any) => ({
      session_id: row.SESSION_ID,
      created_at: row.CREATED_AT ? row.CREATED_AT.toISOString() : new Date().toISOString(),
      last_activity: row.LAST_ACTIVITY ? row.LAST_ACTIVITY.toISOString() : new Date().toISOString(),
      status: row.STATUS,
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
