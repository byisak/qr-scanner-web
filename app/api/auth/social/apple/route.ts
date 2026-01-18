// POST /api/auth/social/apple - 애플 소셜 로그인
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
  deviceId?: string;  // 다중 기기 지원: 'web' | 앱 기기 ID
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
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  created_at: Date;
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
  let client: PoolClient | null = null;

  try {
    const body = (await request.json()) as AppleLoginRequest;
    const { idToken, user: appleUser, deviceId = 'web' } = body;

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

    client = await getConnection();

    // 기존 사용자 확인 (provider_id로 검색)
    let userResult = await client.query<UserRow>(
      `SELECT id, email, name, profile_image, provider, role, is_active, created_at
       FROM users
       WHERE provider = 'apple' AND provider_id = $1 AND deleted_at IS NULL`,
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
      const nowDate = new Date();

      await client.query(
        `INSERT INTO users (id, email, name, provider, provider_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'apple', $4, $5, $6)`,
        [userId, email.toLowerCase(), name, providerId, nowDate, nowDate]
      );

      isNewUser = true;
      userRow = {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        profile_image: null,
        provider: 'apple',
        role: 'user',
        is_active: true,
        created_at: nowDate,
      };
    } else {
      userRow = userResult.rows[0];

      // 이름이 제공된 경우 이름도 업데이트 (Apple은 첫 로그인 시에만 이름 제공)
      // 마지막 로그인 시간은 항상 업데이트
      if (appleUser?.name) {
        await client.query(
          `UPDATE users SET name = $1, last_login_at = $2, updated_at = $2
           WHERE id = $3`,
          [name, new Date(), userRow.id]
        );
      } else {
        await client.query(
          `UPDATE users SET last_login_at = $1, updated_at = $1
           WHERE id = $2`,
          [new Date(), userRow.id]
        );
      }
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
    const nowDate = new Date();

    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token, device_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [refreshTokenId, userRow.id, refreshToken, deviceId, expiresAt, nowDate]
    );

    // 액세스 토큰 생성
    const accessToken = generateAccessToken(userRow.id, userRow.email);

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileImage: userRow.profile_image,
      provider: 'apple',
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
    // console.error('Apple login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.PROVIDER_ERROR,
        '애플 로그인 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
