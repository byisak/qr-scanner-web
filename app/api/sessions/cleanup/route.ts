import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getRequestUser, isAdminUser, unauthorizedResponse } from '@/lib/session-access';
import type { PoolClient } from 'pg';

// 보안: 이전에는 인증 없이 누구나 전체 만료 세션 정리를 실행할 수 있었다.
// 로그인 필수. 일반 사용자는 본인 세션만, 관리자는 전체 세션을 대상으로 한다.
async function resolveScope(client: PoolClient, userId: string): Promise<{ ownerFilter: string; values: unknown[] }> {
  if (await isAdminUser(client, userId)) {
    return { ownerFilter: '', values: [] };
  }
  return { ownerFilter: 'AND user_id = $1', values: [userId] };
}

const DELETION_DAYS = 30;

// POST - 30일이 지난 삭제된 세션들을 영구 삭제
export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const user = getRequestUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    client = await getConnection();
    const { ownerFilter, values } = await resolveScope(client, user.userId);

    // 30일이 지난 DELETED 상태의 세션 조회
    const expiredResult = await client.query(
      `SELECT session_id FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'
       ${ownerFilter}`,
      values
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
export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const user = getRequestUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    client = await getConnection();
    const { ownerFilter, values } = await resolveScope(client, user.userId);

    const result = await client.query(
      `SELECT COUNT(*) as expired_count FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'
       ${ownerFilter}`,
      values
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
