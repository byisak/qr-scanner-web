import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    client = await getConnection();

    const result = await client.query(
      `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
              u.name as user_name, u.email as user_email
       FROM scan_data sd
       LEFT JOIN users u ON sd.user_id = u.id
       WHERE sd.session_id = $1
       ORDER BY sd.created_at ASC`,
      [sessionId]
    );

    const scans = result.rows.map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      code: row.code,
      scan_timestamp: row.scan_timestamp,
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      userId: row.user_id || null,
      userName: row.user_name || row.user_email || null,
    }));

    return NextResponse.json(scans);
  } catch (err: any) {
    console.error('스캔 데이터 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
