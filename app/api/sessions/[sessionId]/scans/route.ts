import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { PoolClient } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    const authHeader = request.headers.get('authorization');
    const user = getUserFromRequest(authHeader);

    client = await getConnection();

    let query: string;
    let queryParams: any[];

    if (user) {
      // 로그인: 내가 스캔한 것만 (세션 소유자 여부 무관)
      query = `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                      u.name as user_name, u.email as user_email
               FROM scan_data sd
               LEFT JOIN users u ON sd.user_id = u.id
               WHERE sd.session_id = $1 AND sd.user_id = $2
               ORDER BY sd.created_at ASC`;
      queryParams = [sessionId, user.userId];
    } else {
      // 비로그인: 전체 스캔 보기 (공유 URL 접속)
      query = `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                      u.name as user_name, u.email as user_email
               FROM scan_data sd
               LEFT JOIN users u ON sd.user_id = u.id
               WHERE sd.session_id = $1
               ORDER BY sd.created_at ASC`;
      queryParams = [sessionId];
    }

    const result = await client.query(query, queryParams);

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
