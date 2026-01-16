// POST /api/auth/logout - 로그아웃
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

interface LogoutRequest {
  deviceId?: string;  // 특정 기기만 로그아웃, 없으면 모든 기기 로그아웃
}

export async function POST(request: NextRequest) {
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

    // body에서 deviceId 추출 (선택적)
    let deviceId: string | undefined;
    try {
      const body = (await request.json()) as LogoutRequest;
      deviceId = body.deviceId;
    } catch {
      // body가 없거나 파싱 실패 시 무시 (모든 기기 로그아웃)
    }

    client = await getConnection();

    if (deviceId) {
      // 특정 기기의 리프레시 토큰만 삭제
      await client.query(
        `DELETE FROM refresh_tokens WHERE user_id = $1 AND device_id = $2`,
        [user.userId, deviceId]
      );
    } else {
      // 사용자의 모든 리프레시 토큰 삭제 (모든 기기 로그아웃)
      await client.query(
        `DELETE FROM refresh_tokens WHERE user_id = $1`,
        [user.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  } catch (error) {
    // console.error('Logout error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '로그아웃 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
