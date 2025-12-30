import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

// POST - 다중 스캔 데이터 삭제
export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 스캔 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    client = await getConnection();

    // PostgreSQL 플레이스홀더 생성 ($1, $2, $3, ...)
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const values = ids.map((id) => parseInt(id, 10));

    // 스캔 데이터 삭제
    const result = await client.query(
      `DELETE FROM scan_data WHERE id IN (${placeholders})`,
      values
    );

    console.log(`다중 스캔 데이터 삭제 완료: ${result.rowCount}개`);

    return NextResponse.json({
      success: true,
      message: `${result.rowCount}개의 스캔 데이터가 삭제되었습니다.`,
      deletedCount: result.rowCount,
      ids,
    });
  } catch (err: any) {
    console.error('다중 스캔 데이터 삭제 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
