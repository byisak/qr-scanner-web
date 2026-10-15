// app/api/cron/cleanup/route.ts - 정기 정리 작업 (Vercel Cron, vercel.json 에서 하루 1회 호출)
//
// 보호: Authorization: Bearer <CRON_SECRET> (Vercel Cron 은 CRON_SECRET 이 설정돼 있으면 이 헤더를 자동으로 붙인다)
// 작업: 삭제(DELETED) 후 30일이 지난 세션과 그 스캔·설정을 영구 삭제
//       (POST /api/sessions/cleanup 의 관리자 범위와 같은 기준, 전체 사용자 대상)
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

export const dynamic = 'force-dynamic';

const DELETION_DAYS = 30;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '권한이 없습니다.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    await client.query('BEGIN');

    const expired = await client.query<{ session_id: string }>(
      `SELECT session_id FROM sessions
       WHERE status = 'DELETED'
         AND deleted_at < CURRENT_TIMESTAMP - make_interval(days => $1)`,
      [DELETION_DAYS]
    );
    const ids = expired.rows.map((r) => r.session_id);

    let deletedScanCount = 0;
    if (ids.length > 0) {
      const scans = await client.query(`DELETE FROM scan_data WHERE session_id = ANY($1::varchar[])`, [ids]);
      deletedScanCount = scans.rowCount || 0;
      await client.query(`DELETE FROM session_settings WHERE session_id = ANY($1::varchar[])`, [ids]);
      await client.query(`DELETE FROM sessions WHERE session_id = ANY($1::varchar[])`, [ids]);
    }

    await client.query('COMMIT');
    return NextResponse.json({
      success: true,
      deletedSessionCount: ids.length,
      deletedScanCount,
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[cron/cleanup] 실패:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: '정리 작업에 실패했습니다.', code: 'INTERNAL_ERROR' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
