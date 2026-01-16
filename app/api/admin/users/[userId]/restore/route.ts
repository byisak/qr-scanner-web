// POST /api/admin/users/[userId]/restore - 삭제된 사용자 복구
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

export async function POST(
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
    const role = await checkAdminRole(client, tokenUser.userId);
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 대상 사용자 조회
    const targetResult = await client.query(
      'SELECT id, email, name, deleted_at FROM users WHERE id = $1',
      [userId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.'),
        { status: 404 }
      );
    }

    const targetUser = targetResult.rows[0];

    if (!targetUser.deleted_at) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_DELETED',
          message: '삭제되지 않은 사용자입니다.',
        },
      }, { status: 400 });
    }

    // 사용자 복구
    await client.query(
      'UPDATE users SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // 감사 로그 기록
    await logAuditAction(
      client,
      tokenUser.userId,
      'restore_user',
      'user',
      userId,
      { email: targetUser.email, name: targetUser.name },
      ipAddress || undefined,
      userAgent || undefined
    );

    return NextResponse.json({
      success: true,
      message: '사용자가 복구되었습니다.',
    });
  } catch (error) {
    console.error('Admin user restore error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '사용자 복구 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
