// POST /api/auth/social/kakao - 카카오 소셜 로그인
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
import type { SocialLoginRequest, User } from '@/types';

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = (await request.json()) as SocialLoginRequest;
    const { accessToken: kakaoAccessToken } = body;

    if (!kakaoAccessToken) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '카카오 액세스 토큰이 필요합니다.'
        ),
        { status: 400 }
      );
    }

    // 카카오 API로 사용자 정보 조회
    const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
      },
    });

    if (!kakaoResponse.ok) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.PROVIDER_ERROR,
          '카카오 인증에 실패했습니다.'
        ),
        { status: 401 }
      );
    }

    const kakaoUser = (await kakaoResponse.json()) as KakaoUserResponse;
    const providerId = String(kakaoUser.id);
    const email = kakaoUser.kakao_account?.email || `kakao_${providerId}@kakao.local`;
    const name = kakaoUser.kakao_account?.profile?.nickname || '카카오 사용자';
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url || null;

    client = await getConnection();

    // 기존 사용자 확인 (provider_id로 검색)
    let userResult = await client.query<UserRow>(
      `SELECT id, email, name, profile_image, provider, created_at
       FROM users
       WHERE provider = 'kakao' AND provider_id = $1 AND deleted_at IS NULL`,
      [providerId]
    );

    let isNewUser = false;
    let userRow: UserRow;

    if (userResult.rows.length === 0) {
      // 이메일로 기존 계정 확인
      const emailCheck = await client.query<UserRow>(
        `SELECT id, email, name, profile_image, provider, created_at
         FROM users
         WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      if (emailCheck.rows.length > 0) {
        // 같은 이메일로 다른 방식으로 가입한 계정이 있음
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.EMAIL_EXISTS,
            `이 이메일은 이미 ${emailCheck.rows[0].provider} 로그인으로 가입되어 있습니다.`
          ),
          { status: 409 }
        );
      }

      // 신규 사용자 생성
      const userId = uuidv4();
      const now = new Date();

      await client.query(
        `INSERT INTO users (id, email, name, profile_image, provider, provider_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'kakao', $5, $6, $7)`,
        [userId, email.toLowerCase(), name, profileImage, providerId, now, now]
      );

      isNewUser = true;
      userRow = {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        profile_image: profileImage,
        provider: 'kakao',
        created_at: now,
      };
    } else {
      userRow = userResult.rows[0];

      // 프로필 정보 업데이트 (선택적)
      await client.query(
        `UPDATE users SET profile_image = $1, updated_at = $2
         WHERE id = $3`,
        [profileImage, new Date(), userRow.id]
      );
    }

    // 기존 리프레시 토큰 삭제
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [userRow.id]
    );

    // 새 리프레시 토큰 생성 및 저장
    const refreshToken = generateRefreshToken();
    const refreshTokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();
    const now = new Date();

    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [refreshTokenId, userRow.id, refreshToken, expiresAt, now]
    );

    // 액세스 토큰 생성
    const accessToken = generateAccessToken(userRow.id, userRow.email);

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileImage: userRow.profile_image,
      provider: 'kakao',
      createdAt: userRow.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken,
      isNewUser,
    });
  } catch (error) {
    // console.error('Kakao login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.PROVIDER_ERROR,
        '카카오 로그인 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
