import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

// DELETE - 영구 삭제 (세션과 관련 스캔 데이터 완전 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    client = await getConnection();

    // 세션 존재 확인
    const checkResult = await client.query(
      `SELECT session_id, status FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 스캔 데이터 먼저 삭제 (외래키 제약 때문)
    const scanDeleteResult = await client.query(
      `DELETE FROM scan_data WHERE session_id = $1`,
      [sessionId]
    );

    // 세션 삭제
    await client.query(
      `DELETE FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    const deletedScanCount = scanDeleteResult.rowCount || 0;
    console.log('세션 영구 삭제 완료:', sessionId, '(스캔 데이터:', deletedScanCount, '개 삭제)');

    return NextResponse.json({
      success: true,
      message: '세션이 영구 삭제되었습니다.',
      sessionId,
      deletedScanCount,
    });
  } catch (err: any) {
    console.error('세션 영구 삭제 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
