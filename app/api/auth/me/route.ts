// GET /api/auth/me - 내 정보 조회
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { User } from '@/types';

interface UserRow {
  ID: string;
  EMAIL: string;
  NAME: string;
  PROFILE_IMAGE: string | null;
  PROVIDER: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export async function GET(request: NextRequest) {
  let connection: oracledb.Connection | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '인증이 필요합니다.'
        ),
        { status: 401 }
      );
    }

    connection = await getConnection();

    // 사용자 정보 조회
    const result = await connection.execute<UserRow>(
      `SELECT id, email, name, profile_image, provider, created_at, updated_at
       FROM users
       WHERE id = :id AND deleted_at IS NULL`,
      { id: tokenUser.userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        ),
        { status: 404 }
      );
    }

    const userRow = result.rows[0];

    const user: User = {
      id: userRow.ID,
      email: userRow.EMAIL,
      name: userRow.NAME,
      profileImage: userRow.PROFILE_IMAGE,
      provider: userRow.PROVIDER as User['provider'],
      createdAt: userRow.CREATED_AT.toISOString(),
      updatedAt: userRow.UPDATED_AT?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '사용자 정보 조회 중 오류가 발생했습니다.'
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
