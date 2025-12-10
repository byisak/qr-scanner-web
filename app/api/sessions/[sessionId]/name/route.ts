import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import oracledb from 'oracledb';

// PUT - 세션 이름 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let connection;
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { name } = body;

    if (name === undefined) {
      return NextResponse.json({ error: 'name 필드가 필요합니다.' }, { status: 400 });
    }

    connection = await getConnection();

    // 세션 존재 확인
    const checkResult = await connection.execute(
      `SELECT session_id FROM sessions WHERE session_id = :sessionId`,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 세션 이름 업데이트
    await connection.execute(
      `UPDATE sessions SET session_name = :name WHERE session_id = :sessionId`,
      { name: name || null, sessionId }
    );
    await connection.commit();

    console.log('세션 이름 변경 완료:', sessionId, '->', name);

    return NextResponse.json({
      success: true,
      message: '세션 이름이 변경되었습니다.',
      sessionId,
      name,
    });
  } catch (err: any) {
    console.error('세션 이름 변경 실패:', err);
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
