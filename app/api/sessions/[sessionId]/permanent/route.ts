import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

// DELETE - 영구 삭제 (세션과 관련 스캔 데이터 완전 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let connection;
  try {
    const { sessionId } = await params;
    connection = await getConnection();

    // 세션 존재 확인
    const checkResult = await connection.execute(
      `SELECT session_id, status FROM sessions WHERE session_id = :sessionId`,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 스캔 데이터 먼저 삭제 (외래키 제약 때문)
    const scanDeleteResult = await connection.execute(
      `DELETE FROM scan_data WHERE session_id = :sessionId`,
      { sessionId }
    );

    // 세션 삭제
    const sessionDeleteResult = await connection.execute(
      `DELETE FROM sessions WHERE session_id = :sessionId`,
      { sessionId }
    );

    await connection.commit();

    const deletedScanCount = scanDeleteResult.rowsAffected || 0;
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
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}
