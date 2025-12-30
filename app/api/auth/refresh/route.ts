// POST /api/auth/refresh - 토큰 갱신
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { RefreshTokenRequest } from '@/types';

interface TokenRow {
  user_id: string;
  expires_at: Date;
}

interface UserRow {
  id: string;
  email: string;
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = (await request.json()) as RefreshTokenRequest;
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.TOKEN_INVALID,
          '리프레시 토큰이 필요합니다.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 리프레시 토큰 조회
    const tokenResult = await client.query<TokenRow>(
      `SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.TOKEN_INVALID,
          '유효하지 않은 리프레시 토큰입니다.'
        ),
        { status: 401 }
      );
    }

    const tokenRow = tokenResult.rows[0];

    // 만료 확인
    if (new Date(tokenRow.expires_at) < new Date()) {
      // 만료된 토큰 삭제
      await client.query(
        `DELETE FROM refresh_tokens WHERE token = $1`,
        [refreshToken]
      );

      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.TOKEN_EXPIRED,
          '리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.'
        ),
        { status: 401 }
      );
    }

    // 사용자 정보 조회
    const userResult = await client.query<UserRow>(
      `SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [tokenRow.user_id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        ),
        { status: 401 }
      );
    }

    const userRow = userResult.rows[0];

    // 기존 리프레시 토큰 삭제
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [userRow.id]
    );

    // 새 리프레시 토큰 생성 및 저장
    const newRefreshToken = generateRefreshToken();
    const refreshTokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();
    const now = new Date();

    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [refreshTokenId, userRow.id, newRefreshToken, expiresAt, now]
    );

    // 새 액세스 토큰 생성
    const accessToken = generateAccessToken(userRow.id, userRow.email);

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.TOKEN_INVALID,
        '토큰 갱신 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
