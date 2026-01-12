import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { PoolClient } from 'pg';

// POST - 삭제된 세션 복구
export async function POST(
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

    // 세션 존재 및 상태 확인
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
          { error: '이 세션을 복구하려면 로그인이 필요합니다.' },
          { status: 401 }
        );
      }
      if (session.user_id !== user.userId) {
        return NextResponse.json(
          { error: '이 세션을 복구할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    if (session.status !== 'DELETED') {
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
