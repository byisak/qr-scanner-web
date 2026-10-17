// GET /api/admin/stats - 관리자 대시보드 통계
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

// 관리자 권한 체크
async function checkAdminRole(client: PoolClient, userId: string): Promise<string | null> {
  const result = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].role;
}

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    // 기간 파라미터 (기본값: 7일)
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '7');
    const validPeriods = [7, 30, 90];
    const chartPeriod = validPeriods.includes(period) ? period : 7;

    client = await getConnection();

    // 관리자 권한 확인
    const role = await checkAdminRole(client, tokenUser.userId);
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 휴면 기준: 1년 (365일)
    const DORMANT_DAYS = 365;

    // 날짜 기준은 한국 시간. DB 시각 컬럼은 시간대 없는 UTC라서
    // "오늘 0시(KST)"를 UTC 시각으로 바꿔 비교하고, 날짜로 묶을 때는 9시간을 더한다
    const KST_TODAY = `(((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date)::timestamp - INTERVAL '9 hours')`;
    const KST_DAY = (col: string) => `(${col} + INTERVAL '9 hours')::date`;
    const PERIOD_START = `(${KST_TODAY} - INTERVAL '${chartPeriod - 1} days')`;
    // 기간 안의 모든 날짜(KST). 빈 날도 0으로 나오게 한다
    const DAYS = `generate_series(${KST_DAY(PERIOD_START)}, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date, INTERVAL '1 day')`;

    // 사용자 통계
    const userStatsResult = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = true) as active_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= ${KST_TODAY}) as new_users_today,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= ${KST_TODAY} - INTERVAL '6 days') as new_users_week,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_login_at >= ${KST_TODAY} - INTERVAL '6 days') as active_users_week,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = true AND last_login_at IS NOT NULL AND last_login_at <= CURRENT_TIMESTAMP - INTERVAL '${DORMANT_DAYS} days') as dormant_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND provider = 'email') as provider_email,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND provider = 'google') as provider_google,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND provider = 'apple') as provider_apple,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND provider = 'kakao') as provider_kakao
      FROM users
    `);

    // 세션 통계
    const sessionStatsResult = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_sessions,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= ${KST_TODAY}) as new_sessions_today,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_activity >= ${KST_TODAY} - INTERVAL '6 days') as active_sessions_week
      FROM sessions
    `);

    // 스캔 통계
    const scanStatsResult = await client.query(`
      SELECT
        COUNT(*) as total_scans,
        COUNT(*) FILTER (WHERE created_at >= ${KST_TODAY}) as scans_today,
        COUNT(*) FILTER (WHERE created_at >= ${KST_TODAY} - INTERVAL '6 days') as scans_week
      FROM scan_data
    `);

    // 기간별 일별 가입자 수 (KST 날짜, 빈 날 포함)
    const dailySignupsResult = await client.query(`
      SELECT to_char(d, 'YYYY-MM-DD') as date, COUNT(u.id) as count
      FROM ${DAYS} d
      LEFT JOIN users u ON u.deleted_at IS NULL AND ${KST_DAY('u.created_at')} = d::date
      GROUP BY d ORDER BY d
    `);

    // 기간별 일별 스캔 수
    const dailyScansResult = await client.query(`
      SELECT to_char(d, 'YYYY-MM-DD') as date, COUNT(s.id) as count
      FROM ${DAYS} d
      LEFT JOIN scan_data s ON s.created_at >= ${PERIOD_START} AND ${KST_DAY('s.created_at')} = d::date
      GROUP BY d ORDER BY d
    `);

    // 사용자 증가: 그날 끝 시점에 가입돼 있던(아직 탈퇴 전인) 사용자 수.
    // 지금 탈퇴한 사람이 과거 그래프를 바꾸지 않게 그 날짜 기준으로 센다
    const userGrowthResult = await client.query(`
      SELECT
        to_char(d, 'YYYY-MM-DD') as date,
        COUNT(u.id) FILTER (WHERE ${KST_DAY('u.created_at')} = d::date) as new_users,
        COUNT(u.id) FILTER (
          WHERE ${KST_DAY('u.created_at')} <= d::date
            AND (u.deleted_at IS NULL OR ${KST_DAY('u.deleted_at')} > d::date)
        ) as total_users
      FROM ${DAYS} d
      CROSS JOIN users u
      GROUP BY d ORDER BY d
    `);

    const userStats = userStatsResult.rows[0];
    const sessionStats = sessionStatsResult.rows[0];
    const scanStats = scanStatsResult.rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: parseInt(userStats.total_users),
          active: parseInt(userStats.active_users),
          newToday: parseInt(userStats.new_users_today),
          newWeek: parseInt(userStats.new_users_week),
          activeWeek: parseInt(userStats.active_users_week),
          dormant: parseInt(userStats.dormant_users),
        },
        sessions: {
          total: parseInt(sessionStats.total_sessions),
          newToday: parseInt(sessionStats.new_sessions_today),
          activeWeek: parseInt(sessionStats.active_sessions_week),
        },
        scans: {
          total: parseInt(scanStats.total_scans),
          today: parseInt(scanStats.scans_today),
          week: parseInt(scanStats.scans_week),
        },
        providers: {
          email: parseInt(userStats.provider_email),
          google: parseInt(userStats.provider_google),
          apple: parseInt(userStats.provider_apple),
          kakao: parseInt(userStats.provider_kakao),
        },
        charts: {
          dailySignups: dailySignupsResult.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count),
          })),
          dailyScans: dailyScansResult.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count),
          })),
          userGrowth: userGrowthResult.rows.map(row => ({
            date: row.date,
            newUsers: parseInt(row.new_users),
            totalUsers: parseInt(row.total_users),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '통계 조회 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
