import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getRequestUser, isAdminUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session-access';
import type { PoolClient } from 'pg';

// DELETE - 스캔 데이터 삭제
// 보안: 이전에는 인증 없이 scanId만으로 누구의 스캔이든 삭제할 수 있었다.
// 로그인 필수 + (스캔 작성자 또는 세션 소유자 또는 관리자)만 삭제 가능.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { scanId } = await params;
    const id = parseInt(scanId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: '잘못된 스캔 ID입니다.' }, { status: 400 });
    }

    const user = getRequestUser(request);
    if (!user) {
      return unauthorizedResponse('스캔 데이터를 삭제하려면 로그인이 필요합니다.');
    }

    client = await getConnection();

    // 스캔 및 세션 소유자 조회
    const scanResult = await client.query(
      `SELECT sd.id, sd.user_id AS scan_user_id, s.user_id AS session_owner_id
       FROM scan_data sd
       LEFT JOIN sessions s ON s.session_id = sd.session_id
       WHERE sd.id = $1`,
      [id]
    );

    if (scanResult.rows.length === 0) {
      return NextResponse.json({ error: '스캔 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    const row = scanResult.rows[0];
    const allowed =
      row.scan_user_id === user.userId ||
      row.session_owner_id === user.userId ||
      (await isAdminUser(client, user.userId));

    if (!allowed) {
      return forbiddenResponse('이 스캔 데이터를 삭제할 권한이 없습니다.');
    }

    // 스캔 데이터 삭제
    await client.query(`DELETE FROM scan_data WHERE id = $1`, [id]);

    // console.log('스캔 데이터 삭제 완료:', scanId);

    return NextResponse.json({
      success: true,
      message: '스캔 데이터가 삭제되었습니다.',
      scanId,
    });
  } catch (err: any) {
    // console.error('스캔 데이터 삭제 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
