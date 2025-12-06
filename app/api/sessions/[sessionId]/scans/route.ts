import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let connection;
  try {
    const { sessionId } = await params;
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT id, session_id, code, scan_timestamp, created_at
       FROM scan_data
       WHERE session_id = :sessionId
       ORDER BY created_at ASC`,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const scans = (result.rows || []).map((row: any) => ({
      id: row.ID,
      sessionId: row.SESSION_ID,
      code: row.CODE,
      scan_timestamp: row.SCAN_TIMESTAMP,
      createdAt: row.CREATED_AT ? row.CREATED_AT.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(scans);
  } catch (err: any) {
    console.error('스캔 데이터 조회 실패:', err);
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
