// PUT /api/auth/profile - 프로필 수정
import { NextRequest, NextResponse } from 'next/server';
import oracledb from 'oracledb';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { ProfileUpdateRequest, User } from '@/types';

interface UserRow {
  ID: string;
  EMAIL: string;
  NAME: string;
  PROFILE_IMAGE: string | null;
  PROVIDER: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export async function PUT(request: NextRequest) {
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

    connection = await getConnection();

    // 동적으로 업데이트 쿼리 생성
    const updates: string[] = [];
    const binds: Record<string, string | Date | null> = { id: tokenUser.userId };

    if (name) {
      updates.push('name = :name');
      binds.name = name;
    }

    if (profileImage !== undefined) {
      updates.push('profile_image = :profile_image');
      binds.profile_image = profileImage;
    }

    updates.push('updated_at = :updated_at');
    binds.updated_at = new Date();

    await connection.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = :id AND deleted_at IS NULL`,
      binds
    );

    // 업데이트된 사용자 정보 조회
    const result = await connection.execute<UserRow>(
      `SELECT id, email, name, profile_image, provider, created_at, updated_at
       FROM users
       WHERE id = :id AND deleted_at IS NULL`,
      { id: tokenUser.userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.commit();

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
      message: '프로필이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '프로필 수정 중 오류가 발생했습니다.'
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
