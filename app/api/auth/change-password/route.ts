// PUT /api/auth/change-password - 비밀번호 변경
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  verifyPassword,
  hashPassword,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserRow {
  id: string;
  password_hash: string;
  provider: string;
}

// 비밀번호 강도 검사
function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  if (password.length > 100) {
    return { valid: false, message: '비밀번호는 100자를 초과할 수 없습니다.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: '비밀번호에 영문자를 포함해야 합니다.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '비밀번호에 숫자를 포함해야 합니다.' };
  }
  return { valid: true, message: '' };
}

export async function PUT(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '인증이 필요합니다.'
        ),
        { status: 401 }
      );
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const { currentPassword, newPassword, confirmPassword } = body;

    // 필수 필드 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '모든 필드를 입력해주세요.'
        ),
        { status: 400 }
      );
    }

    // 새 비밀번호 확인 일치 검사
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
        ),
        { status: 400 }
      );
    }

    // 현재 비밀번호와 새 비밀번호 동일 여부 검사
    if (currentPassword === newPassword) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
        ),
        { status: 400 }
      );
    }

    // 새 비밀번호 강도 검사
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          strengthCheck.message
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 사용자 조회
    const result = await client.query<UserRow>(
      `SELECT id, password_hash, provider
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [tokenUser.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        ),
        { status: 404 }
      );
    }

    const userRow = result.rows[0];

    // 소셜 로그인 계정인 경우 비밀번호 변경 불가
    if (userRow.provider !== 'email') {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.'
        ),
        { status: 400 }
      );
    }

    // 현재 비밀번호 검증
    if (!userRow.password_hash || !verifyPassword(currentPassword, userRow.password_hash)) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          '현재 비밀번호가 올바르지 않습니다.'
        ),
        { status: 401 }
      );
    }

    // 새 비밀번호 해싱 및 저장
    const newPasswordHash = hashPassword(newPassword);

    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`,
      [newPasswordHash, new Date(), tokenUser.userId]
    );

    // 모든 리프레시 토큰 삭제 (보안상 모든 기기에서 로그아웃)
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [tokenUser.userId]
    );

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '비밀번호 변경 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
