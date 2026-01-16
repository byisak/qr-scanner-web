// API: /api/users/[userId]/ad-records
// 사용자 광고 기록 조회, 수정, 동기화

import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { UserAdRecords, AdRecordsSyncRequest } from '@/types';

interface AdRecordRow {
  id: number;
  user_id: string;
  unlocked_features: string[];
  ad_watch_counts: Record<string, number>;
  banner_settings: Record<string, boolean>;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// GET: 사용자 광고 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
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

    // 본인 또는 관리자만 조회 가능 (현재는 본인만)
    if (tokenUser.userId !== userId) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '다른 사용자의 데이터에 접근할 수 없습니다.'
        ),
        { status: 403 }
      );
    }

    client = await getConnection();

    // 광고 기록 조회
    const result = await client.query<AdRecordRow>(
      `SELECT id, user_id, unlocked_features, ad_watch_counts, banner_settings,
              last_synced_at, created_at, updated_at
       FROM user_ad_records
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // 기록이 없으면 빈 데이터 반환
      return NextResponse.json({
        success: true,
        data: {
          userId,
          unlockedFeatures: [],
          adWatchCounts: {},
          bannerSettings: {},
          lastSyncedAt: null,
          createdAt: null,
          updatedAt: null,
        },
      });
    }

    const row = result.rows[0];
    const data: UserAdRecords = {
      id: row.id,
      userId: row.user_id,
      unlockedFeatures: row.unlocked_features || [],
      adWatchCounts: row.ad_watch_counts || {},
      bannerSettings: row.banner_settings || {},
      lastSyncedAt: row.last_synced_at?.toISOString() || null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get ad records error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '광고 기록 조회 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// PUT: 사용자 광고 기록 수정 (관리자용 또는 동기화용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
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

    // 본인만 수정 가능 (추후 관리자 권한 추가 가능)
    if (tokenUser.userId !== userId) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '다른 사용자의 데이터를 수정할 수 없습니다.'
        ),
        { status: 403 }
      );
    }

    const body = (await request.json()) as AdRecordsSyncRequest;
    const { unlockedFeatures, adWatchCounts, bannerSettings } = body;

    client = await getConnection();
    const now = new Date();

    // UPSERT: 기록이 있으면 업데이트, 없으면 삽입
    const result = await client.query<AdRecordRow>(
      `INSERT INTO user_ad_records (user_id, unlocked_features, ad_watch_counts, banner_settings, last_synced_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         unlocked_features = $2,
         ad_watch_counts = $3,
         banner_settings = $4,
         last_synced_at = $5,
         updated_at = $5
       RETURNING id, user_id, unlocked_features, ad_watch_counts, banner_settings, last_synced_at, created_at, updated_at`,
      [
        userId,
        JSON.stringify(unlockedFeatures || []),
        JSON.stringify(adWatchCounts || {}),
        JSON.stringify(bannerSettings || {}),
        now,
      ]
    );

    const row = result.rows[0];
    const data: UserAdRecords = {
      id: row.id,
      userId: row.user_id,
      unlockedFeatures: row.unlocked_features || [],
      adWatchCounts: row.ad_watch_counts || {},
      bannerSettings: row.banner_settings || {},
      lastSyncedAt: row.last_synced_at?.toISOString() || null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
      message: '광고 기록이 동기화되었습니다.',
    });
  } catch (error) {
    console.error('Update ad records error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '광고 기록 수정 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// DELETE: 사용자 광고 기록 초기화
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { userId } = await params;
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

    // 본인만 삭제 가능
    if (tokenUser.userId !== userId) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '다른 사용자의 데이터를 삭제할 수 없습니다.'
        ),
        { status: 403 }
      );
    }

    client = await getConnection();

    await client.query(
      `DELETE FROM user_ad_records WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: '광고 기록이 초기화되었습니다.',
    });
  } catch (error) {
    console.error('Delete ad records error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '광고 기록 삭제 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
