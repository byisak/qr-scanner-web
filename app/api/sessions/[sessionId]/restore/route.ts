import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

// POST - 삭제된 세션 복구
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let connection;
  try {
    const { sessionId } = await params;
    connection = await getConnection();

    // 세션 존재 및 상태 확인
    const checkResult = await connection.execute(
      `SELECT session_id, status FROM sessions WHERE session_id = :sessionId`,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const row: any = checkResult.rows[0];
    if (row.STATUS !== 'DELETED') {
      return NextResponse.json({ error: '삭제된 세션만 복구할 수 있습니다.' }, { status: 400 });
    }

    // 세션 복구 (status를 ACTIVE로 변경, deleted_at 초기화)
    await connection.execute(
      `UPDATE sessions
       SET status = 'ACTIVE', deleted_at = NULL
       WHERE session_id = :sessionId`,
      { sessionId }
    );
    await connection.commit();

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
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}
