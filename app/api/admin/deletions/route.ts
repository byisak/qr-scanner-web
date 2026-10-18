// GET /api/admin/deletions - 파기 예정 목록 (관리자 전용)
// 탈퇴한 일반 회원은 탈퇴 29일 뒤 새벽 정리 크론이 영구 삭제한다 (app/api/cron/cleanup).
// 계정 삭제 안내의 "30일 이내 영구 삭제" 약속을 지키는지 남은 날짜로 보여 준다.
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const WITHDRAWN_PURGE_DAYS = 29;
const TRASH_PURGE_DAYS = 30;

// a***@gmail.com 처럼 가린다 (관리 화면 어깨너머 노출 줄이기)
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    const tokenUser = getUserFromRequest(request.headers.get('authorization'));
    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }
    client = await getConnection();
    const roleResult = await client.query(
      'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [tokenUser.userId]
    );
    const role = roleResult.rows[0]?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 탈퇴 회원: 파기 예정 시각 = 탈퇴 + 29일 (그 뒤 첫 새벽 크론에서 삭제)
    const users = await client.query(
      `SELECT id, email, deleted_at,
              deleted_at + make_interval(days => $1) AS purge_at
       FROM users
       WHERE deleted_at IS NOT NULL AND COALESCE(role, 'user') = 'user'
       ORDER BY deleted_at ASC
       LIMIT 100`,
      [WITHDRAWN_PURGE_DAYS]
    );

    // 휴지통 세션: 삭제 + 30일
    const trash = await client.query(
      `SELECT COUNT(*)::int AS n,
              MIN(deleted_at + make_interval(days => $1)) AS next_purge_at
       FROM sessions WHERE status = 'DELETED' AND deleted_at IS NOT NULL`,
      [TRASH_PURGE_DAYS]
    );

    return NextResponse.json({
      success: true,
      withdrawn: users.rows.map((r) => ({
        id: r.id,
        email: maskEmail(r.email),
        deletedAt: r.deleted_at.toISOString(),
        purgeAt: r.purge_at.toISOString(),
      })),
      trash: {
        count: trash.rows[0].n,
        nextPurgeAt: trash.rows[0].next_purge_at ? trash.rows[0].next_purge_at.toISOString() : null,
      },
      purgeDays: WITHDRAWN_PURGE_DAYS,
    });
  } catch (error) {
    console.error('Admin deletions error:', error);
    return NextResponse.json({ success: false, error: '파기 예정 목록을 불러오지 못했습니다.' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
