// DELETE /api/auth/withdraw - 회원 탈퇴
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

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

    connection = await getConnection();

    // 리프레시 토큰 삭제
    await connection.execute(
      `DELETE FROM refresh_tokens WHERE user_id = :user_id`,
      { user_id: user.userId }
    );

    // 사용자 soft delete (deleted_at 설정)
    await connection.execute(
      `UPDATE users SET deleted_at = :deleted_at WHERE id = :id`,
      {
        deleted_at: new Date(),
        id: user.userId,
      }
    );

    // 사용자의 세션들에서 user_id 제거 (NULL로 설정)
    await connection.execute(
      `UPDATE sessions SET user_id = NULL WHERE user_id = :user_id`,
      { user_id: user.userId }
    );

    await connection.commit();

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
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}
