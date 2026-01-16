// POST /api/auth/login - 이메일 로그인
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '@/lib/db';
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { LoginRequest, User } from '@/types';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
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
    const body = (await request.json()) as LoginRequest;
    const { email, password, deviceId = 'web' } = body;

    // 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '이메일과 비밀번호를 입력해주세요.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 사용자 조회
    const result = await client.query<UserRow>(
      `SELECT id, email, password_hash, name, profile_image, provider, role, is_active, created_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          '이메일 또는 비밀번호가 올바르지 않습니다.'
        ),
        { status: 401 }
      );
    }

    const userRow = result.rows[0];

    // 소셜 로그인 계정인 경우
    if (userRow.provider !== 'email') {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          `이 계정은 ${userRow.provider} 로그인으로 가입되었습니다.`
        ),
        { status: 401 }
      );
    }

    // 비밀번호 검증
    if (!userRow.password_hash || !verifyPassword(password, userRow.password_hash)) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          '이메일 또는 비밀번호가 올바르지 않습니다.'
        ),
        { status: 401 }
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

    // 사용자 정보 구성
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileImage: userRow.profile_image,
      provider: 'email',
      role: (userRow.role || 'user') as User['role'],
      isActive: userRow.is_active ?? true,
      createdAt: userRow.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    // console.error('Login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.INVALID_CREDENTIALS,
        '로그인 처리 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
