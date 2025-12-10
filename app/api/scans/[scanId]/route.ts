import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// DELETE - 스캔 데이터 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  let connection;
  try {
    const { scanId } = await params;
    connection = await getConnection();

    // 스캔 데이터 삭제
    const result = await connection.execute(
      `DELETE FROM scan_data WHERE id = :scanId`,
      { scanId: parseInt(scanId, 10) }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: '스캔 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    console.log('스캔 데이터 삭제 완료:', scanId);

    return NextResponse.json({
      success: true,
      message: '스캔 데이터가 삭제되었습니다.',
      scanId,
    });
  } catch (err: any) {
    console.error('스캔 데이터 삭제 실패:', err);
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
