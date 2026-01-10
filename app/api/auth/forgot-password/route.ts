// POST /api/auth/forgot-password - 비밀번호 재설정 요청
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '@/lib/db';
import {
  generatePasswordResetToken,
  getPasswordResetExpiry,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

// 테이블 생성 여부 (앱 시작 시 한 번만 체크)
let tableChecked = false;

async function ensureTableExists(client: PoolClient) {
  if (tableChecked) return;

  await client.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP DEFAULT NULL,
      CONSTRAINT fk_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id)`);

  tableChecked = true;
  console.log('✅ password_reset_tokens table ready');
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = await request.json();
    const { email } = body;

    // 이메일 유효성 검사
    if (!email) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '이메일을 입력해주세요.'
        ),
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '올바른 이메일 형식이 아닙니다.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 테이블 존재 확인 및 생성
    await ensureTableExists(client);

    // 사용자 조회 (이메일 로그인 사용자만)
    const userResult = await client.query(
      `SELECT id, email, name FROM users
       WHERE email = $1 AND provider = 'email' AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    // 보안: 사용자 존재 여부와 관계없이 동일한 응답 반환
    // 사용자가 없어도 성공 응답을 보내 이메일 존재 여부를 노출하지 않음
    if (userResult.rows.length === 0) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: '비밀번호 재설정 이메일을 발송했습니다.',
      });
    }

    const user = userResult.rows[0];

    // 기존 미사용 토큰 무효화
    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // 새 토큰 생성
    const token = generatePasswordResetToken();
    const expiresAt = getPasswordResetExpiry();
    const tokenId = uuidv4();

    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [tokenId, user.id, token, expiresAt]
    );

    // 실제 서비스에서는 여기서 이메일 발송
    // 현재는 콘솔에 토큰 출력 (개발용)
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://scanview.app'}/reset-password?token=${token}`;
    console.log(`=== Password Reset ===`);
    console.log(`Email: ${user.email}`);
    console.log(`Token: ${token}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires: ${expiresAt}`);
    console.log(`======================`);

    // TODO: 이메일 발송 로직 추가
    // await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 이메일을 발송했습니다.',
      // 개발 환경에서만 토큰 반환 (프로덕션에서는 제거)
      ...(process.env.NODE_ENV === 'development' && {
        debug: { token, resetUrl }
      }),
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '비밀번호 재설정 요청 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
