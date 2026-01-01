import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

// POST - 삭제된 세션 복구
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    client = await getConnection();

    // 세션 존재 및 상태 확인
    const checkResult = await client.query(
      `SELECT session_id, status FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const row = checkResult.rows[0];
    if (row.status !== 'DELETED') {
      return NextResponse.json({ error: '삭제된 세션만 복구할 수 있습니다.' }, { status: 400 });
    }

    // 세션 복구 (status를 ACTIVE로 변경, deleted_at 초기화)
    await client.query(
      `UPDATE sessions
       SET status = 'ACTIVE', deleted_at = NULL
       WHERE session_id = $1`,
      [sessionId]
    );

    console.log('세션 복구 완료:', sessionId);

    return NextResponse.json({
      success: true,
      message: '세션이 복구되었습니다.',
      sessionId,
    });
  } catch (err: any) {
    console.error('세션 복구 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
