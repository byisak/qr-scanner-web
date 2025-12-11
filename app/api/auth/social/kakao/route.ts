// POST /api/auth/social/kakao - 카카오 소셜 로그인
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
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
  ID: string;
  EMAIL: string;
  NAME: string;
  PROFILE_IMAGE: string | null;
  PROVIDER: string;
  CREATED_AT: Date;
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

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

    connection = await getConnection();

    // 기존 사용자 확인 (provider_id로 검색)
    let userResult = await connection.execute<UserRow>(
      `SELECT id, email, name, profile_image, provider, created_at
       FROM users
       WHERE provider = 'kakao' AND provider_id = :provider_id AND deleted_at IS NULL`,
      { provider_id: providerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let isNewUser = false;
    let userRow: UserRow;

    if (!userResult.rows || userResult.rows.length === 0) {
      // 이메일로 기존 계정 확인
      const emailCheck = await connection.execute<UserRow>(
        `SELECT id, email, name, profile_image, provider, created_at
         FROM users
         WHERE email = :email AND deleted_at IS NULL`,
        { email: email.toLowerCase() },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (emailCheck.rows && emailCheck.rows.length > 0) {
        // 같은 이메일로 다른 방식으로 가입한 계정이 있음
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.EMAIL_EXISTS,
            `이 이메일은 이미 ${emailCheck.rows[0].PROVIDER} 로그인으로 가입되어 있습니다.`
          ),
          { status: 409 }
        );
      }

      // 신규 사용자 생성
      const userId = uuidv4();
      const now = new Date();

      await connection.execute(
        `INSERT INTO users (id, email, name, profile_image, provider, provider_id, created_at, updated_at)
         VALUES (:id, :email, :name, :profile_image, 'kakao', :provider_id, :created_at, :updated_at)`,
        {
          id: userId,
          email: email.toLowerCase(),
          name,
          profile_image: profileImage,
          provider_id: providerId,
          created_at: now,
          updated_at: now,
        }
      );

      isNewUser = true;
      userRow = {
        ID: userId,
        EMAIL: email.toLowerCase(),
        NAME: name,
        PROFILE_IMAGE: profileImage,
        PROVIDER: 'kakao',
        CREATED_AT: now,
      };
    } else {
      userRow = userResult.rows[0];

      // 프로필 정보 업데이트 (선택적)
      await connection.execute(
        `UPDATE users SET profile_image = :profile_image, updated_at = :updated_at
         WHERE id = :id`,
        {
          profile_image: profileImage,
          updated_at: new Date(),
          id: userRow.ID,
        }
      );
    }

    // 기존 리프레시 토큰 삭제
    await connection.execute(
      `DELETE FROM refresh_tokens WHERE user_id = :user_id`,
      { user_id: userRow.ID }
    );

    // 새 리프레시 토큰 생성 및 저장
    const refreshToken = generateRefreshToken();
    const refreshTokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();
    const now = new Date();

    await connection.execute(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES (:id, :user_id, :token, :expires_at, :created_at)`,
      {
        id: refreshTokenId,
        user_id: userRow.ID,
        token: refreshToken,
        expires_at: expiresAt,
        created_at: now,
      }
    );

    await connection.commit();

    // 액세스 토큰 생성
    const accessToken = generateAccessToken(userRow.ID, userRow.EMAIL);

    const user: User = {
      id: userRow.ID,
      email: userRow.EMAIL,
      name: userRow.NAME,
      profileImage: userRow.PROFILE_IMAGE,
      provider: 'kakao',
      createdAt: userRow.CREATED_AT.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken,
      isNewUser,
    });
  } catch (error) {
    console.error('Kakao login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.PROVIDER_ERROR,
        '카카오 로그인 처리 중 오류가 발생했습니다.'
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
