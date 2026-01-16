// GET /api/auth/me - 내 정보 조회
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { User } from '@/types';

interface UserRow {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;

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

    client = await getConnection();

    // 사용자 정보 조회
    const result = await client.query<UserRow>(
      `SELECT id, email, name, profile_image, provider, role, is_active, last_login_at, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [tokenUser.userId]
    );

    if (result.rows.length === 0) {
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
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileImage: userRow.profile_image,
      provider: userRow.provider as User['provider'],
      role: (userRow.role || 'user') as User['role'],
      isActive: userRow.is_active ?? true,
      lastLoginAt: userRow.last_login_at?.toISOString(),
      createdAt: userRow.created_at.toISOString(),
      updatedAt: userRow.updated_at?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    // console.error('Get me error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '사용자 정보 조회 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
