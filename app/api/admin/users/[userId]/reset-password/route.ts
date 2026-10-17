// POST /api/admin/users/[userId]/reset-password - 사용자에게 비밀번호 재설정 메일 발송
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
  generatePasswordResetToken,
  getPasswordResetExpiry,
} from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

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
      'SELECT id, email, name, provider FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.'),
        { status: 404 }
      );
    }

    const targetUser = targetResult.rows[0];

    // 소셜 로그인 사용자는 비밀번호 초기화 불가
    if (targetUser.provider !== 'email') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SOCIAL_ACCOUNT',
          message: '소셜 로그인 계정은 비밀번호를 초기화할 수 없습니다.',
        },
      }, { status: 400 });
    }

    // 비밀번호 재설정 토큰 생성
    const token = generatePasswordResetToken();
    const expiresAt = getPasswordResetExpiry();

    // 이전 토큰 무효화
    await client.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // 새 토큰 저장
    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, token, expiresAt]
    );

    // 비밀번호 재설정 링크 생성. 사용자 언어를 저장하지 않으므로 한국어 메일로 보낸다
    const locale = 'ko';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://scanview.app';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&lang=${locale}`;

    // 메일 발송. 링크는 응답에 넣지 않는다 (관리자 화면에 토큰이 노출되지 않게)
    const emailResult = await sendPasswordResetEmail(targetUser.email, targetUser.name, resetUrl, locale);

    // 감사 로그 기록
    await logAuditAction(
      client,
      tokenUser.userId,
      'send_password_reset',
      'user',
      userId,
      { email: targetUser.email, emailSent: emailResult.success },
      ipAddress || undefined,
      userAgent || undefined
    );

    if (!emailResult.success) {
      console.error('Admin password reset email failed:', emailResult.error);
      return NextResponse.json({
        success: false,
        error: { code: 'EMAIL_FAILED', message: '재설정 메일을 보내지 못했습니다.' },
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 메일을 보냈습니다.',
      data: { email: targetUser.email },
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '비밀번호 초기화 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
