// GET /api/admin/users - 사용자 목록 조회 (관리자 전용)
// POST /api/admin/users - 사용자 생성 (관리자 전용)
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { AdminUser } from '@/types';
import * as XLSX from 'xlsx';

// 엑셀이 수식으로 실행하지 않도록 =, +, -, @, 탭, CR 로 시작하는 값 앞에 작은따옴표
const safeCell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
// 전체 내보내기 상한 (한 번에 내려받는 행 수)
const EXPORT_MAX_ROWS = 10000;

interface UserRow {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  session_count: string;
  scan_count: string;
  ad_watch_counts: Record<string, number> | null;
  unlocked_features: string[] | null;
}

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

    client = await getConnection();

    // 관리자 권한 확인
    const role = await checkAdminRole(client, tokenUser.userId);
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    // format=csv: 필터·정렬에 맞는 전체 사용자를 CSV로 (페이지 무시, 감사 로그 기록)
    const isExport = searchParams.get('format') === 'csv';
    const page = isExport ? 1 : Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = isExport ? EXPORT_MAX_ROWS : Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const search = searchParams.get('search') || '';
    const provider = searchParams.get('provider') || '';
    const roleFilter = searchParams.get('role') || '';
    const status = searchParams.get('status') || ''; // active, inactive, deleted
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // 동적 쿼리 빌드
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // 휴면 기준: 1년 (365일)
    const DORMANT_DAYS = 365;

    // 삭제된 사용자 필터
    if (status === 'deleted') {
      conditions.push('u.deleted_at IS NOT NULL');
    } else if (status === 'active') {
      conditions.push('u.deleted_at IS NULL AND u.is_active = true');
      conditions.push(`(u.last_login_at IS NULL OR u.last_login_at > CURRENT_TIMESTAMP - INTERVAL '${DORMANT_DAYS} days')`);
    } else if (status === 'inactive') {
      conditions.push('u.deleted_at IS NULL AND u.is_active = false');
    } else if (status === 'dormant') {
      // 휴면회원: 1년 이상 로그인하지 않은 활성 사용자
      conditions.push('u.deleted_at IS NULL AND u.is_active = true');
      conditions.push(`u.last_login_at IS NOT NULL AND u.last_login_at <= CURRENT_TIMESTAMP - INTERVAL '${DORMANT_DAYS} days'`);
    } else {
      conditions.push('u.deleted_at IS NULL');
    }

    // 검색 조건
    if (search) {
      conditions.push(`(u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 제공자 필터
    if (provider) {
      conditions.push(`u.provider = $${paramIndex}`);
      params.push(provider);
      paramIndex++;
    }

    // 역할 필터
    if (roleFilter) {
      conditions.push(`u.role = $${paramIndex}`);
      params.push(roleFilter);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 정렬 컬럼 검증
    const allowedSortColumns = ['created_at', 'last_login_at', 'email', 'name', 'session_count', 'scan_count'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // 전체 개수 조회
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // 사용자 목록 조회 (세션 수, 스캔 수, 광고 기록 포함)
    const usersResult = await client.query<UserRow>(
      `SELECT
        u.id, u.email, u.name, u.profile_image, u.provider, u.role,
        u.is_active, u.last_login_at, u.created_at, u.updated_at, u.deleted_at,
        COALESCE(s.session_count, 0) as session_count,
        COALESCE(sc.scan_count, 0) as scan_count,
        ar.ad_watch_counts,
        ar.unlocked_features
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as session_count
        FROM sessions
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) s ON u.id = s.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as scan_count
        FROM scan_data
        GROUP BY user_id
      ) sc ON u.id = sc.user_id
      LEFT JOIN user_ad_records ar ON u.id = ar.user_id
      ${whereClause}
      ORDER BY ${sortColumn === 'session_count' || sortColumn === 'scan_count' ? sortColumn : 'u.' + sortColumn} ${order} NULLS LAST, u.id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const users: AdminUser[] = usersResult.rows.map(row => {
      // 광고 시청 횟수 합계 계산
      const adWatchCounts = row.ad_watch_counts || {};
      const adWatchedCount = Object.values(adWatchCounts).reduce((sum, count) => sum + count, 0);
      const adUnlockedCount = (row.unlocked_features || []).length;

      return {
        id: row.id,
        email: row.email,
        name: row.name,
        profileImage: row.profile_image,
        provider: row.provider as AdminUser['provider'],
        role: (row.role || 'user') as AdminUser['role'],
        isActive: row.is_active ?? true,
        lastLoginAt: row.last_login_at?.toISOString(),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at?.toISOString(),
        deletedAt: row.deleted_at?.toISOString(),
        sessionCount: parseInt(row.session_count),
        scanCount: parseInt(row.scan_count),
        adWatchedCount,
        adUnlockedCount,
      };
    });

    if (isExport) {
      const rows = users.map((u) => ({
        ID: u.id,
        Email: safeCell(u.email),
        Name: safeCell(u.name || ''),
        Role: u.role,
        Provider: u.provider,
        Status: u.deletedAt ? 'deleted' : u.isActive ? 'active' : 'inactive',
        Sessions: u.sessionCount,
        Scans: u.scanCount,
        'Created (UTC)': u.createdAt,
        'Last login (UTC)': u.lastLoginAt || '',
      }));
      const csv = '\uFEFF' + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address, user_agent)
         VALUES ($1, 'export_users', 'user', '*', $2, $3, $4)`,
        [
          tokenUser.userId,
          JSON.stringify({ count: rows.length, total, search, provider, role: roleFilter, status, sortBy: sortColumn, sortOrder: order }),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          request.headers.get('user-agent'),
        ]
      );
      const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="users_${day}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '사용자 목록 조회 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
