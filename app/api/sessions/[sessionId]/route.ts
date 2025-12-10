import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

// GET - 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let connection;
  try {
    const { sessionId } = await params;
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT session_id, socket_id, created_at, last_activity, status, deleted_at
       FROM sessions
       WHERE session_id = :sessionId`,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const row: any = result.rows[0];
    const session = {
      session_id: row.SESSION_ID,
      socket_id: row.SOCKET_ID,
      created_at: row.CREATED_AT ? row.CREATED_AT.toISOString() : null,
      last_activity: row.LAST_ACTIVITY ? row.LAST_ACTIVITY.toISOString() : null,
      status: row.STATUS,
      deleted_at: row.DELETED_AT ? row.DELETED_AT.toISOString() : null,
    };

    return NextResponse.json(session);
  } catch (err: any) {
    console.error('세션 조회 실패:', err);
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

// DELETE - Soft Delete (세션을 DELETED 상태로 변경)
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

    // Soft Delete 수행 (status를 DELETED로 변경, deleted_at 기록)
    await connection.execute(
      `UPDATE sessions
       SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP
       WHERE session_id = :sessionId`,
      { sessionId }
    );
    await connection.commit();

    console.log('세션 Soft Delete 완료:', sessionId);

    return NextResponse.json({
      success: true,
      message: '세션이 삭제되었습니다.',
      sessionId,
    });
  } catch (err: any) {
    console.error('세션 Soft Delete 실패:', err);
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
