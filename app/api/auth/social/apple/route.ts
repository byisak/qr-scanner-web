// POST /api/auth/social/apple - 애플 소셜 로그인
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
import type { User } from '@/types';

interface AppleLoginRequest {
  idToken: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
}

interface AppleJWTPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: boolean;
}

interface UserRow {
  ID: string;
  EMAIL: string;
  NAME: string;
  PROFILE_IMAGE: string | null;
  PROVIDER: string;
  CREATED_AT: Date;
}

/**
 * Apple ID 토큰 디코딩 (단순 Base64 디코딩)
 * 주의: 실제 프로덕션에서는 Apple의 공개 키로 서명 검증 필요
 */
function decodeAppleIdToken(idToken: string): AppleJWTPayload | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as AppleJWTPayload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

  try {
    const body = (await request.json()) as AppleLoginRequest;
    const { idToken, user: appleUser } = body;

    if (!idToken) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '애플 ID 토큰이 필요합니다.'
        ),
        { status: 400 }
      );
    }

    // ID 토큰 디코딩
    const decoded = decodeAppleIdToken(idToken);

    if (!decoded) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.PROVIDER_ERROR,
          '애플 ID 토큰 검증에 실패했습니다.'
        ),
        { status: 401 }
      );
    }

    // 토큰 만료 확인
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.TOKEN_EXPIRED,
          '애플 ID 토큰이 만료되었습니다.'
        ),
        { status: 401 }
      );
    }

    const providerId = decoded.sub;
    // Apple은 첫 로그인 시에만 이메일과 이름을 제공
    const email = decoded.email || appleUser?.email || `apple_${providerId}@privaterelay.appleid.com`;

    // 이름 구성 (첫 로그인 시에만 제공됨)
    let name = 'Apple User';
    if (appleUser?.name) {
      const firstName = appleUser.name.firstName || '';
      const lastName = appleUser.name.lastName || '';
      name = `${firstName} ${lastName}`.trim() || 'Apple User';
    }

    connection = await getConnection();

    // 기존 사용자 확인 (provider_id로 검색)
    let userResult = await connection.execute<UserRow>(
      `SELECT id, email, name, profile_image, provider, created_at
       FROM users
       WHERE provider = 'apple' AND provider_id = :provider_id AND deleted_at IS NULL`,
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
      const nowDate = new Date();

      await connection.execute(
        `INSERT INTO users (id, email, name, provider, provider_id, created_at, updated_at)
         VALUES (:id, :email, :name, 'apple', :provider_id, :created_at, :updated_at)`,
        {
          id: userId,
          email: email.toLowerCase(),
          name,
          provider_id: providerId,
          created_at: nowDate,
          updated_at: nowDate,
        }
      );

      isNewUser = true;
      userRow = {
        ID: userId,
        EMAIL: email.toLowerCase(),
        NAME: name,
        PROFILE_IMAGE: null,
        PROVIDER: 'apple',
        CREATED_AT: nowDate,
      };
    } else {
      userRow = userResult.rows[0];

      // 이름이 제공된 경우에만 업데이트 (Apple은 첫 로그인 시에만 이름 제공)
      if (appleUser?.name) {
        await connection.execute(
          `UPDATE users SET name = :name, updated_at = :updated_at
           WHERE id = :id`,
          {
            name,
            updated_at: new Date(),
            id: userRow.ID,
          }
        );
      }
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
    const nowDate = new Date();

    await connection.execute(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES (:id, :user_id, :token, :expires_at, :created_at)`,
      {
        id: refreshTokenId,
        user_id: userRow.ID,
        token: refreshToken,
        expires_at: expiresAt,
        created_at: nowDate,
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
      provider: 'apple',
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
    console.error('Apple login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.PROVIDER_ERROR,
        '애플 로그인 처리 중 오류가 발생했습니다.'
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
