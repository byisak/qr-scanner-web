import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getRequestUser, isAdminUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session-access';
import type { PoolClient } from 'pg';

const MAX_BULK_DELETE = 1000;

// POST - 다중 스캔 데이터 삭제
// 보안: 이전에는 인증 없이 임의의 스캔 ID 목록을 삭제할 수 있었다.
// 로그인 필수 + 각 스캔에 대해 (스캔 작성자 또는 세션 소유자 또는 관리자)인 것만 삭제한다.
export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const user = getRequestUser(request);
    if (!user) {
      return unauthorizedResponse('스캔 데이터를 삭제하려면 로그인이 필요합니다.');
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 스캔 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }
    if (ids.length > MAX_BULK_DELETE) {
      return NextResponse.json(
        { error: `한 번에 최대 ${MAX_BULK_DELETE}개까지 삭제할 수 있습니다.` },
        { status: 400 }
      );
    }

    const values = ids
      .map((id: unknown) => parseInt(String(id), 10))
      .filter((id: number) => Number.isFinite(id));
    if (values.length === 0) {
      return NextResponse.json({ error: '유효한 스캔 ID가 없습니다.' }, { status: 400 });
    }

    client = await getConnection();
    const admin = await isAdminUser(client, user.userId);

    // 권한 있는 행만 삭제 (관리자는 전체)
    const result = admin
      ? await client.query(
          `DELETE FROM scan_data WHERE id = ANY($1::int[]) RETURNING id`,
          [values]
        )
      : await client.query(
          `DELETE FROM scan_data sd
           USING sessions s
           WHERE sd.session_id = s.session_id
             AND sd.id = ANY($1::int[])
             AND (sd.user_id = $2 OR s.user_id = $2)
           RETURNING sd.id`,
          [values, user.userId]
        );

    const deletedIds = result.rows.map((r: { id: number }) => r.id);

    if (deletedIds.length === 0) {
      return forbiddenResponse('삭제할 수 있는 스캔 데이터가 없습니다.');
    }

    // console.log(`다중 스캔 데이터 삭제 완료: ${result.rowCount}개`);

    return NextResponse.json({
      success: true,
      message: `${deletedIds.length}개의 스캔 데이터가 삭제되었습니다.`,
      deletedCount: deletedIds.length,
      ids: deletedIds,
      deletedIds,
    });
  } catch (err: any) {
    // console.error('다중 스캔 데이터 삭제 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
