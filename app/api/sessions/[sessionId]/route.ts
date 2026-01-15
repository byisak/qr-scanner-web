import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { PoolClient } from 'pg';

// GET - 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    client = await getConnection();

    const result = await client.query(
      `SELECT session_id, socket_id, session_name, created_at, last_activity, status, deleted_at
       FROM sessions
       WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const row = result.rows[0];
    const session = {
      session_id: row.session_id,
      socket_id: row.socket_id,
      session_name: row.session_name || null,
      created_at: row.created_at ? row.created_at.toISOString() : null,
      last_activity: row.last_activity ? row.last_activity.toISOString() : null,
      status: row.status,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };

    return NextResponse.json(session);
  } catch (err: any) {
    // console.error('세션 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// DELETE - Soft Delete (세션을 DELETED 상태로 변경)
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
          { error: '이 세션을 삭제하려면 로그인이 필요합니다.' },
          { status: 401 }
        );
      }
      if (session.user_id !== user.userId) {
        return NextResponse.json(
          { error: '이 세션을 삭제할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // Soft Delete 수행 (status를 DELETED로 변경, deleted_at 기록)
    await client.query(
      `UPDATE sessions
       SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP
       WHERE session_id = $1`,
      [sessionId]
    );

    // console.log('세션 Soft Delete 완료:', sessionId);

    return NextResponse.json({
      success: true,
      message: '세션이 삭제되었습니다.',
      sessionId,
    });
  } catch (err: any) {
    // console.error('세션 Soft Delete 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
