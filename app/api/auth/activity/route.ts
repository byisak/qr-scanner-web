// POST /api/auth/activity - 마지막 접속 시간 업데이트
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import { verifyAccessToken, AuthErrorCodes, createAuthErrorResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '인증이 필요합니다.'
        ),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyAccessToken(token);

    if (!user) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.TOKEN_INVALID,
          '유효하지 않은 토큰입니다.'
        ),
        { status: 401 }
      );
    }

    client = await getConnection();

    // last_login_at 업데이트
    await client.query(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [user.userId]
    );

    return NextResponse.json({
      success: true,
      message: '마지막 접속 시간이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('Activity update error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.INTERNAL_ERROR,
        '접속 시간 업데이트 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
