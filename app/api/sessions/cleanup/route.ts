import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

const DELETION_DAYS = 30;

// POST - 30일이 지난 삭제된 세션들을 영구 삭제
export async function POST() {
  let client: PoolClient | null = null;
  try {
    client = await getConnection();

    // 30일이 지난 DELETED 상태의 세션 조회
    const expiredResult = await client.query(
      `SELECT session_id FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'`
    );

    const expiredSessions = expiredResult.rows;

    if (expiredSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '만료된 세션이 없습니다.',
        deletedCount: 0,
      });
    }

    let totalDeletedScans = 0;

    // 각 세션의 스캔 데이터와 세션 삭제
    for (const session of expiredSessions) {
      const sessionId = session.session_id;

      // 스캔 데이터 삭제
      const scanResult = await client.query(
        `DELETE FROM scan_data WHERE session_id = $1`,
        [sessionId]
      );
      totalDeletedScans += scanResult.rowCount || 0;

      // 세션 삭제
      await client.query(
        `DELETE FROM sessions WHERE session_id = $1`,
        [sessionId]
      );
    }

    // console.log(`만료된 세션 정리 완료: ${expiredSessions.length}개 세션, ${totalDeletedScans}개 스캔 데이터 삭제`);

    return NextResponse.json({
      success: true,
      message: `${expiredSessions.length}개의 만료된 세션이 영구 삭제되었습니다.`,
      deletedCount: expiredSessions.length,
      deletedScanCount: totalDeletedScans,
    });
  } catch (err: any) {
    // console.error('만료된 세션 정리 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// GET - 만료된 세션 수 조회
export async function GET() {
  let client: PoolClient | null = null;
  try {
    client = await getConnection();

    const result = await client.query(
      `SELECT COUNT(*) as expired_count FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'`
    );

    const row = result.rows[0];
    const expiredCount = parseInt(row?.expired_count) || 0;

    return NextResponse.json({
      expiredCount,
      deletionDays: DELETION_DAYS,
    });
  } catch (err: any) {
    // console.error('만료된 세션 수 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
