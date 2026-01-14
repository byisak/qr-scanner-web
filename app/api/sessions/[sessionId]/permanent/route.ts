import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { PoolClient } from 'pg';

// DELETE - 영구 삭제 (세션과 관련 스캔 데이터 완전 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const user = getUserFromRequest(authHeader);

    client = await getConnection();

    // 세션 존재 및 소유자 확인
    const checkResult = await client.query(
      `SELECT session_id, status, user_id FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const session = checkResult.rows[0];

    // 세션 소유자가 있는 경우 인증 필수
    if (session.user_id) {
      if (!user) {
        return NextResponse.json(
          { error: '이 세션을 영구 삭제하려면 로그인이 필요합니다.' },
          { status: 401 }
        );
      }
      if (session.user_id !== user.userId) {
        return NextResponse.json(
          { error: '이 세션을 영구 삭제할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // session_settings 먼저 삭제 (외래키 제약)
    await client.query(
      `DELETE FROM session_settings WHERE session_id = $1`,
      [sessionId]
    );

    // 스캔 데이터 삭제 (외래키 제약 때문)
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
    // console.log('세션 영구 삭제 완료:', sessionId, '(스캔 데이터:', deletedScanCount, '개 삭제)');

    return NextResponse.json({
      success: true,
      message: '세션이 영구 삭제되었습니다.',
      sessionId,
      deletedScanCount,
    });
  } catch (err: any) {
    // console.error('세션 영구 삭제 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
