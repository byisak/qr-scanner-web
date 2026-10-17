// app/api/cron/cleanup/route.ts - 정기 정리 작업 (Vercel Cron, vercel.json 에서 하루 1회 호출)
//
// 보호: Authorization: Bearer <CRON_SECRET> (Vercel Cron 은 CRON_SECRET 이 설정돼 있으면 이 헤더를 자동으로 붙인다)
// 작업: 1) 삭제(DELETED) 후 30일이 지난 세션과 그 스캔·설정을 영구 삭제
//          (POST /api/sessions/cleanup 의 관리자 범위와 같은 기준, 전체 사용자 대상)
//       2) 탈퇴 후 29일이 지난 일반 회원과 그 데이터를 영구 삭제
//          (계정 삭제 안내의 "30일 이내 영구 삭제" 약속을 지키려고 하루 여유를 둠.
//           기준은 scripts/purge-withdrawn-users.sql 과 같다. 관리자 계정은 제외)
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

export const dynamic = 'force-dynamic';

const DELETION_DAYS = 30;
const WITHDRAWN_PURGE_DAYS = 29;

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

    const purged = await purgeWithdrawnUsers(client);

    await client.query('COMMIT');
    return NextResponse.json({
      success: true,
      deletedSessionCount: ids.length,
      deletedScanCount,
      purgedUserCount: purged.users,
      purgedSessionCount: purged.sessions,
      purgedScanCount: purged.scans,
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[cron/cleanup] 실패:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: '정리 작업에 실패했습니다.', code: 'INTERNAL_ERROR' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// 탈퇴한 지 WITHDRAWN_PURGE_DAYS 일이 지난 일반 회원의 남은 데이터를 지운다 (같은 트랜잭션 안에서)
async function purgeWithdrawnUsers(client: PoolClient): Promise<{ users: number; sessions: number; scans: number }> {
  await client.query(
    `CREATE TEMP TABLE purge_users ON COMMIT DROP AS
       SELECT id FROM users
       WHERE deleted_at IS NOT NULL
         AND deleted_at < CURRENT_TIMESTAMP - make_interval(days => $1)
         AND COALESCE(role, 'user') = 'user'`,
    [WITHDRAWN_PURGE_DAYS]
  );
  const users = (await client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM purge_users`)).rows[0].n;
  if (users === '0') return { users: 0, sessions: 0, scans: 0 };

  // 지울 세션: 아직 연결된 세션 + 탈퇴 때 user_id 가 NULL 이 된 세션 중 탈퇴자 스캔만 들어 있는 세션
  await client.query(
    `CREATE TEMP TABLE purge_sessions ON COMMIT DROP AS
       SELECT s.session_id FROM sessions s
       WHERE s.user_id IN (SELECT id FROM purge_users)
       UNION
       SELECT s.session_id FROM sessions s
       WHERE s.user_id IS NULL
         AND EXISTS (SELECT 1 FROM scan_data d
                     WHERE d.session_id = s.session_id AND d.user_id IN (SELECT id FROM purge_users))
         AND NOT EXISTS (SELECT 1 FROM scan_data d
                         WHERE d.session_id = s.session_id
                           AND d.user_id IS NOT NULL
                           AND d.user_id NOT IN (SELECT id FROM purge_users))`
  );
  const scans = await client.query(
    `DELETE FROM scan_data
     WHERE user_id IN (SELECT id FROM purge_users)
        OR session_id IN (SELECT session_id FROM purge_sessions)`
  );
  await client.query(`DELETE FROM session_settings WHERE session_id IN (SELECT session_id FROM purge_sessions)`);
  const sessions = await client.query(`DELETE FROM sessions WHERE session_id IN (SELECT session_id FROM purge_sessions)`);
  await client.query(`DELETE FROM user_ad_records WHERE user_id IN (SELECT id FROM purge_users)`);
  await client.query(`DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM purge_users)`);
  await client.query(`DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM purge_users)`);
  const deleted = await client.query(`DELETE FROM users WHERE id IN (SELECT id FROM purge_users)`);

  return { users: deleted.rowCount || 0, sessions: sessions.rowCount || 0, scans: scans.rowCount || 0 };
}
