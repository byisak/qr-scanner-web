// DELETE /api/auth/withdraw - 회원 탈퇴
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromRequest(authHeader);

    if (!user) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '인증이 필요합니다.'
        ),
        { status: 401 }
      );
    }

    client = await getConnection();

    // 리프레시 토큰 삭제
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [user.userId]
    );

    // 사용자 soft delete (deleted_at 설정)
    await client.query(
      `UPDATE users SET deleted_at = $1 WHERE id = $2`,
      [new Date(), user.userId]
    );

    // 사용자의 세션들에서 user_id 제거 (NULL로 설정)
    await client.query(
      `UPDATE sessions SET user_id = NULL WHERE user_id = $1`,
      [user.userId]
    );

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '회원 탈퇴 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
