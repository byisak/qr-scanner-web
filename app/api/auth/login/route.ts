// POST /api/auth/login - 이메일 로그인
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
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
  ID: string;
  EMAIL: string;
  PASSWORD_HASH: string;
  NAME: string;
  PROFILE_IMAGE: string | null;
  PROVIDER: string;
  CREATED_AT: Date;
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

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

    connection = await getConnection();

    // 사용자 조회
    const result = await connection.execute<UserRow>(
      `SELECT id, email, password_hash, name, profile_image, provider, created_at
       FROM users
       WHERE email = :email AND deleted_at IS NULL`,
      { email: email.toLowerCase() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
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
    if (userRow.PROVIDER !== 'email') {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          `이 계정은 ${userRow.PROVIDER} 로그인으로 가입되었습니다.`
        ),
        { status: 401 }
      );
    }

    // 비밀번호 검증
    if (!userRow.PASSWORD_HASH || !verifyPassword(password, userRow.PASSWORD_HASH)) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.INVALID_CREDENTIALS,
          '이메일 또는 비밀번호가 올바르지 않습니다.'
        ),
        { status: 401 }
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

    // 사용자 정보 구성
    const user: User = {
      id: userRow.ID,
      email: userRow.EMAIL,
      name: userRow.NAME,
      profileImage: userRow.PROFILE_IMAGE,
      provider: 'email',
      createdAt: userRow.CREATED_AT.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.INVALID_CREDENTIALS,
        '로그인 처리 중 오류가 발생했습니다.'
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
