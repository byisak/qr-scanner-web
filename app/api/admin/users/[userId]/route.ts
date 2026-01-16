// GET /api/admin/users/[userId] - 사용자 상세 조회
// PATCH /api/admin/users/[userId] - 사용자 정보 수정
// DELETE /api/admin/users/[userId] - 사용자 삭제
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

// 감사 로그 기록
async function logAuditAction(
  client: PoolClient,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  await client.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [adminId, action, targetType, targetId, JSON.stringify(details), ipAddress, userAgent]
  );
}

// GET - 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
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

    // 사용자 상세 정보 조회
    const userResult = await client.query(
      `SELECT
        u.id, u.email, u.name, u.profile_image, u.provider, u.role,
        u.is_active, u.last_login_at, u.created_at, u.updated_at, u.deleted_at
      FROM users u
      WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.'),
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // 세션 목록 조회
    const sessionsResult = await client.query(
      `SELECT session_id, session_name, created_at, last_activity, status, deleted_at,
        (SELECT COUNT(*) FROM scan_data WHERE session_id = sessions.session_id) as scan_count
      FROM sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [userId]
    );

    // 통계 조회
    const statsResult = await client.query(
      `SELECT
        (SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND deleted_at IS NULL) as session_count,
        (SELECT COUNT(*) FROM scan_data WHERE user_id = $1) as scan_count`,
      [userId]
    );

    // 광고 기록 조회
    const adRecordsResult = await client.query(
      `SELECT unlocked_features, ad_watch_counts, banner_settings, last_synced_at
      FROM user_ad_records
      WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profile_image,
        provider: user.provider,
        role: user.role || 'user',
        isActive: user.is_active ?? true,
        lastLoginAt: user.last_login_at?.toISOString(),
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at?.toISOString(),
        deletedAt: user.deleted_at?.toISOString(),
      },
      sessions: sessionsResult.rows.map(s => ({
        sessionId: s.session_id,
        sessionName: s.session_name,
        createdAt: s.created_at.toISOString(),
        lastActivity: s.last_activity.toISOString(),
        status: s.status,
        deletedAt: s.deleted_at?.toISOString(),
        scanCount: parseInt(s.scan_count),
      })),
      stats: {
        sessionCount: parseInt(statsResult.rows[0].session_count),
        scanCount: parseInt(statsResult.rows[0].scan_count),
      },
      adRecords: adRecordsResult.rows.length > 0 ? {
        unlockedFeatures: adRecordsResult.rows[0].unlocked_features || [],
        adWatchCounts: adRecordsResult.rows[0].ad_watch_counts || {},
        bannerSettings: adRecordsResult.rows[0].banner_settings || {},
        lastSyncedAt: adRecordsResult.rows[0].last_synced_at?.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '사용자 조회 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// PATCH - 사용자 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    client = await getConnection();

    // 관리자 권한 확인
    const adminRole = await checkAdminRole(client, tokenUser.userId);
    if (!adminRole || (adminRole !== 'admin' && adminRole !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role, isActive } = body;

    // 대상 사용자 조회
    const targetResult = await client.query(
      'SELECT id, name, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.'),
        { status: 404 }
      );
    }

    const targetUser = targetResult.rows[0];

    // 역할 변경은 super_admin만 가능
    if (role !== undefined && role !== targetUser.role) {
      if (adminRole !== 'super_admin') {
        return NextResponse.json(
          createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '역할 변경은 최고 관리자만 가능합니다.'),
          { status: 403 }
        );
      }
      // super_admin은 변경 불가
      if (targetUser.role === 'super_admin') {
        return NextResponse.json(
          createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '최고 관리자 역할은 변경할 수 없습니다.'),
          { status: 403 }
        );
      }
    }

    // 업데이트 쿼리 빌드
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (name !== undefined && name !== targetUser.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
      changes.name = { old: targetUser.name, new: name };
    }

    if (role !== undefined && role !== targetUser.role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
      changes.role = { old: targetUser.role, new: role };
    }

    if (isActive !== undefined && isActive !== targetUser.is_active) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
      changes.isActive = { old: targetUser.is_active, new: isActive };
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: '변경 사항이 없습니다.',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    // 감사 로그 기록
    await logAuditAction(
      client,
      tokenUser.userId,
      'update_user',
      'user',
      userId,
      { changes },
      ipAddress || undefined,
      userAgent || undefined
    );

    return NextResponse.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '사용자 수정 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// DELETE - 사용자 삭제 (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    client = await getConnection();

    // 관리자 권한 확인
    const adminRole = await checkAdminRole(client, tokenUser.userId);
    if (!adminRole || (adminRole !== 'admin' && adminRole !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 대상 사용자 조회
    const targetResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [userId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.'),
        { status: 404 }
      );
    }

    const targetUser = targetResult.rows[0];

    // super_admin은 삭제 불가
    if (targetUser.role === 'super_admin') {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '최고 관리자는 삭제할 수 없습니다.'),
        { status: 403 }
      );
    }

    // admin 삭제는 super_admin만 가능
    if (targetUser.role === 'admin' && adminRole !== 'super_admin') {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 삭제는 최고 관리자만 가능합니다.'),
        { status: 403 }
      );
    }

    // 자기 자신 삭제 방지
    if (userId === tokenUser.userId) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '자신의 계정은 삭제할 수 없습니다.'),
        { status: 403 }
      );
    }

    // 영구 삭제 여부 확인
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // 영구 삭제 (super_admin만 가능)
      if (adminRole !== 'super_admin') {
        return NextResponse.json(
          createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '영구 삭제는 최고 관리자만 가능합니다.'),
          { status: 403 }
        );
      }
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    } else {
      // Soft delete
      await client.query(
        'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    }

    // 감사 로그 기록
    await logAuditAction(
      client,
      tokenUser.userId,
      permanent ? 'permanent_delete_user' : 'delete_user',
      'user',
      userId,
      { email: targetUser.email, name: targetUser.name },
      ipAddress || undefined,
      userAgent || undefined
    );

    return NextResponse.json({
      success: true,
      message: permanent ? '사용자가 영구 삭제되었습니다.' : '사용자가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '사용자 삭제 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
