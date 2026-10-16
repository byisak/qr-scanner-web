import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { requireSessionOwner } from '@/lib/session-access';
import type { PoolClient } from 'pg';

// PUT - 세션 이름 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { name } = body;

    if (name === undefined) {
      return NextResponse.json({ error: 'name 필드가 필요합니다.' }, { status: 400 });
    }

    client = await getConnection();

    // 보안: 이전에는 인증 없이 누구나 세션 이름을 바꿀 수 있었다.
    // 로그인 + 세션 소유자(또는 관리자)만 변경 가능.
    const access = await requireSessionOwner(client, request, sessionId, '세션 이름을 변경하려면');
    if (!access.ok) {
      return access.response;
    }

    // 세션 이름 업데이트
    await client.query(
      `UPDATE sessions SET session_name = $1 WHERE session_id = $2`,
      [name || null, sessionId]
    );

    // console.log('세션 이름 변경 완료:', sessionId, '->', name);

    return NextResponse.json({
      success: true,
      message: '세션 이름이 변경되었습니다.',
      sessionId,
      name,
    });
  } catch (err: any) {
    // console.error('세션 이름 변경 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
