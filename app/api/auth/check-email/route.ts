// POST /api/auth/check-email - 이메일 중복 확인
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

interface CheckEmailRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = (await request.json()) as CheckEmailRequest;
    const { email } = body;

    // 유효성 검사
    if (!email) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '이메일을 입력해주세요.'
        ),
        { status: 400 }
      );
    }

    // 이메일 형식 검사
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

    // 이메일 존재 여부 확인
    const result = await client.query(
      `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    const exists = result.rows.length > 0;

    return NextResponse.json({
      success: true,
      exists,
      message: exists ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.',
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '이메일 확인 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
