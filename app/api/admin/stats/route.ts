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

    // 사용자 통계
    const userStatsResult = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = true) as active_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_login_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week,
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
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE) as new_sessions_today,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_activity >= CURRENT_DATE - INTERVAL '7 days') as active_sessions_week
      FROM sessions
    `);

    // 스캔 통계
    const scanStatsResult = await client.query(`
      SELECT
        COUNT(*) as total_scans,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as scans_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as scans_week
      FROM scan_data
    `);

    // 기간별 일별 가입자 수
    const dailySignupsResult = await client.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '${chartPeriod - 1} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 기간별 일별 스캔 수
    const dailyScansResult = await client.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM scan_data
      WHERE created_at >= CURRENT_DATE - INTERVAL '${chartPeriod - 1} days'
      GROUP BY DATE(created_at)
      ORDER BY date
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
            date: row.date.toISOString().split('T')[0],
            count: parseInt(row.count),
          })),
          dailyScans: dailyScansResult.rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: parseInt(row.count),
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
