import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// POST - 다중 스캔 데이터 삭제
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 스캔 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // 플레이스홀더 생성 (:id0, :id1, :id2, ...)
    const placeholders = ids.map((_, i) => `:id${i}`).join(', ');
    const binds: Record<string, number> = {};
    ids.forEach((id, i) => {
      binds[`id${i}`] = parseInt(id, 10);
    });

    // 스캔 데이터 삭제
    const result = await connection.execute(
      `DELETE FROM scan_data WHERE id IN (${placeholders})`,
      binds
    );

    await connection.commit();

    console.log(`다중 스캔 데이터 삭제 완료: ${result.rowsAffected}개`);

    return NextResponse.json({
      success: true,
      message: `${result.rowsAffected}개의 스캔 데이터가 삭제되었습니다.`,
      deletedCount: result.rowsAffected,
      ids,
    });
  } catch (err: any) {
    console.error('다중 스캔 데이터 삭제 실패:', err);
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
