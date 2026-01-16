// PUT /api/auth/profile - 프로필 수정
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { ProfileUpdateRequest, User } from '@/types';

interface UserRow {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function PUT(request: NextRequest) {
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

    const body = (await request.json()) as ProfileUpdateRequest;
    const { name, profileImage } = body;

    // 업데이트할 내용이 없는 경우
    if (!name && profileImage === undefined) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.VALIDATION_ERROR,
          '수정할 내용이 없습니다.'
        ),
        { status: 400 }
      );
    }

    client = await getConnection();

    // 동적으로 업데이트 쿼리 생성
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (profileImage !== undefined) {
      updates.push(`profile_image = $${paramIndex++}`);
      values.push(profileImage);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(tokenUser.userId);

    await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL`,
      values
    );

    // 업데이트된 사용자 정보 조회
    const result = await client.query<UserRow>(
      `SELECT id, email, name, profile_image, provider, role, is_active, created_at, updated_at
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
      createdAt: userRow.created_at.toISOString(),
      updatedAt: userRow.updated_at?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user,
      message: '프로필이 수정되었습니다.',
    });
  } catch (error) {
    // console.error('Update profile error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '프로필 수정 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
