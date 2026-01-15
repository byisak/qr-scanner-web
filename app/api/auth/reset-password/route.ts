// POST /api/auth/reset-password - 비밀번호 재설정 실행
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  hashPassword,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = await request.json();
    const { token, password } = body;

    // 유효성 검사
    if (!token) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.RESET_TOKEN_INVALID,
          '유효하지 않은 요청입니다.'
        ),
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '새 비밀번호를 입력해주세요.'
        ),
        { status: 400 }
      );
    }

    // 비밀번호 길이 검사
    if (password.length < 8) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '비밀번호는 8자 이상이어야 합니다.'
        ),
        { status: 400 }
      );
    }

    // 비밀번호 복잡성 검사 (영문 + 숫자)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 토큰 조회 (유효하고 사용되지 않은 토큰)
    const tokenResult = await client.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.RESET_TOKEN_INVALID,
          '유효하지 않거나 이미 사용된 링크입니다.'
        ),
        { status: 400 }
      );
    }

    const resetToken = tokenResult.rows[0];

    // 토큰 만료 확인
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.RESET_TOKEN_EXPIRED,
          '링크가 만료되었습니다. 다시 비밀번호 찾기를 진행해주세요.'
        ),
        { status: 400 }
      );
    }

    // 비밀번호 업데이트
    const passwordHash = hashPassword(password);
    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );

    // 토큰 사용 처리
    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [resetToken.id]
    );

    // 해당 사용자의 모든 리프레시 토큰 무효화 (보안)
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [resetToken.user_id]
    );

    // console.log(`Password reset successful for user: ${resetToken.email}`);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });

  } catch (error) {
    // console.error('Reset password error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '비밀번호 재설정 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
