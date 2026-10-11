import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getConnection } from '@/lib/db';
import { getUserFromRequest, AuthErrorCodes, createAuthErrorResponse } from '@/lib/auth';
import type { PoolClient } from 'pg';

const DELETION_DAYS = 30;

// CLEANUP_SECRET 일치 여부 (미설정 시 항상 false - fail closed)
function hasValidCleanupSecret(authHeader: string | null): boolean {
  const secret = process.env.CLEANUP_SECRET;
  if (!secret || !authHeader?.startsWith('Bearer ')) return false;
  const provided = Buffer.from(authHeader.slice(7));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

// 정리 범위 결정: 크론(CLEANUP_SECRET) 또는 관리자 → 전체, 일반 로그인 사용자 → 본인 세션만
async function resolveScope(
  request: NextRequest,
  client: PoolClient
): Promise<{ userId: string | null } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (hasValidCleanupSecret(authHeader)) return { userId: null };

  const tokenUser = getUserFromRequest(authHeader);
  if (!tokenUser) {
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
      { status: 401 }
    );
  }

  const roleResult = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [tokenUser.userId]
  );
  const role = roleResult.rows[0]?.role;
  if (role === 'admin' || role === 'super_admin') return { userId: null };
  return { userId: tokenUser.userId };
}

// POST - 30일이 지난 삭제된 세션들을 영구 삭제
export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    client = await getConnection();

    const scope = await resolveScope(request, client);
    if (scope instanceof NextResponse) return scope;

    // 30일이 지난 DELETED 상태의 세션 조회
    const expiredResult = await client.query(
      `SELECT session_id FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'
       AND ($1::varchar IS NULL OR user_id = $1)`,
      [scope.userId]
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
    client = await getConnection();

    const scope = await resolveScope(request, client);
    if (scope instanceof NextResponse) return scope;

    const result = await client.query(
      `SELECT COUNT(*) as expired_count FROM sessions
       WHERE status = 'DELETED'
       AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${DELETION_DAYS} days'
       AND ($1::varchar IS NULL OR user_id = $1)`,
      [scope.userId]
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
