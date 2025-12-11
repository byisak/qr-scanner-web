// POST /api/auth/register - 회원가입
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '@/lib/db';
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { RegisterRequest, User } from '@/types';

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password, name } = body;

    // 유효성 검사
    if (!email || !password || !name) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '이메일, 비밀번호, 이름은 필수입니다.'
        ),
        { status: 400 }
      );
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '올바른 이메일 형식이 아닙니다.'
        ),
        { status: 400 }
      );
    }

    // 비밀번호 길이 검사
    if (password.length < 8) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '비밀번호는 8자 이상이어야 합니다.'
        ),
        { status: 400 }
      );
    }

    connection = await getConnection();

    // 이메일 중복 확인
    const existingUser = await connection.execute(
      `SELECT id FROM users WHERE email = :email AND deleted_at IS NULL`,
      { email: email.toLowerCase() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingUser.rows && existingUser.rows.length > 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.EMAIL_EXISTS,
          '이미 가입된 이메일입니다.'
        ),
        { status: 409 }
      );
    }

    // 사용자 생성
    const userId = uuidv4();
    const passwordHash = hashPassword(password);
    const now = new Date();

    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, provider, created_at, updated_at)
       VALUES (:id, :email, :password_hash, :name, 'email', :created_at, :updated_at)`,
      {
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        created_at: now,
        updated_at: now,
      }
    );

    // 리프레시 토큰 생성 및 저장
    const refreshToken = generateRefreshToken();
    const refreshTokenId = uuidv4();
    const expiresAt = getRefreshTokenExpiry();

    await connection.execute(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES (:id, :user_id, :token, :expires_at, :created_at)`,
      {
        id: refreshTokenId,
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt,
        created_at: now,
      }
    );

    await connection.commit();

    // 액세스 토큰 생성
    const accessToken = generateAccessToken(userId, email.toLowerCase());

    // 사용자 정보 구성
    const user: User = {
      id: userId,
      email: email.toLowerCase(),
      name,
      profileImage: null,
      provider: 'email',
      createdAt: now.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        user,
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '회원가입 처리 중 오류가 발생했습니다.'
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
