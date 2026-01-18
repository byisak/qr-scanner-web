// POST /api/auth/social/google - 구글 소셜 로그인
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

interface GoogleTokenInfo {
  sub: string;           // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const body = (await request.json()) as SocialLoginRequest;
    const { accessToken: googleAccessToken, idToken, deviceId = 'web' } = body;

    // ID 토큰 또는 액세스 토큰 중 하나가 필요
    if (!googleAccessToken && !idToken) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '구글 액세스 토큰 또는 ID 토큰이 필요합니다.'
        ),
        { status: 400 }
      );
    }

    let googleUser: GoogleTokenInfo;

    // ID 토큰이 있으면 ID 토큰 검증
    if (idToken) {
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );

      if (!tokenInfoResponse.ok) {
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.PROVIDER_ERROR,
            '구글 ID 토큰 검증에 실패했습니다.'
          ),
          { status: 401 }
        );
      }

      googleUser = (await tokenInfoResponse.json()) as GoogleTokenInfo;
    } else {
      // 액세스 토큰으로 사용자 정보 조회
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.PROVIDER_ERROR,
            '구글 인증에 실패했습니다.'
          ),
          { status: 401 }
        );
      }

      googleUser = (await userInfoResponse.json()) as GoogleTokenInfo;
    }

    const providerId = googleUser.sub;
    const email = googleUser.email;
    const name = googleUser.name || googleUser.given_name || 'Google User';
    const profileImage = googleUser.picture || null;

    if (!email) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.PROVIDER_ERROR,
          '구글 계정에서 이메일 정보를 가져올 수 없습니다.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 기존 사용자 확인 (provider_id로 검색)
    let userResult = await client.query<UserRow>(
      `SELECT id, email, name, profile_image, provider, role, is_active, created_at
       FROM users
       WHERE provider = 'google' AND provider_id = $1 AND deleted_at IS NULL`,
      [providerId]
    );

    let isNewUser = false;
    let userRow: UserRow;

    if (userResult.rows.length === 0) {
      // 이메일로 기존 계정 확인
      const emailCheck = await client.query<UserRow>(
        `SELECT id, email, name, profile_image, provider, role, is_active, created_at
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
         VALUES ($1, $2, $3, $4, 'google', $5, $6, $7)`,
        [userId, email.toLowerCase(), name, profileImage, providerId, now, now]
      );

      isNewUser = true;
      userRow = {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        profile_image: profileImage,
        provider: 'google',
        role: 'user',
        is_active: true,
        created_at: now,
      };
    } else {
      userRow = userResult.rows[0];

      // 프로필 정보 및 마지막 로그인 시간 업데이트
      await client.query(
        `UPDATE users SET profile_image = $1, last_login_at = $2, updated_at = $2
         WHERE id = $3`,
        [profileImage, new Date(), userRow.id]
      );
    }

    // 해당 기기의 기존 리프레시 토큰만 삭제 (다중 기기 지원)
    await client.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1 AND device_id = $2`,
      [userRow.id, deviceId]
    );

    // 새 리프레시 토큰 생성 및 저장
    const refreshToken = generateRefreshToken();
    const refreshTokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();
    const now = new Date();

    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token, device_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [refreshTokenId, userRow.id, refreshToken, deviceId, expiresAt, now]
    );

    // 액세스 토큰 생성
    const accessToken = generateAccessToken(userRow.id, userRow.email);

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileImage: userRow.profile_image,
      provider: 'google',
      role: (userRow.role || 'user') as User['role'],
      isActive: userRow.is_active ?? true,
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
    // console.error('Google login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.PROVIDER_ERROR,
        '구글 로그인 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
