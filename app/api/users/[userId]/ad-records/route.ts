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
  admin_removed_features: string[];
  last_synced_at: Date | null;
  admin_modified_at: Date | null;
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

    client = await getConnection();

    // 본인 또는 관리자만 조회 가능
    if (tokenUser.userId !== userId) {
      // 관리자 권한 확인
      const roleCheck = await client.query(
        'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
        [tokenUser.userId]
      );
      const userRole = roleCheck.rows[0]?.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        client.release();
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.UNAUTHORIZED,
            '다른 사용자의 데이터에 접근할 수 없습니다.'
          ),
          { status: 403 }
        );
      }
    }

    // 광고 기록 조회
    const result = await client.query<AdRecordRow>(
      `SELECT id, user_id, unlocked_features, ad_watch_counts, banner_settings,
              admin_removed_features, last_synced_at, admin_modified_at, created_at, updated_at
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
          adminRemovedFeatures: [],
          lastSyncedAt: null,
          adminModifiedAt: null,
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
      adminRemovedFeatures: row.admin_removed_features || [],
      lastSyncedAt: row.last_synced_at?.toISOString() || null,
      adminModifiedAt: row.admin_modified_at?.toISOString() || null,
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

    client = await getConnection();

    // 본인 또는 관리자만 수정 가능
    if (tokenUser.userId !== userId) {
      // 관리자 권한 확인
      const roleCheck = await client.query(
        'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
        [tokenUser.userId]
      );
      const userRole = roleCheck.rows[0]?.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        client.release();
        return NextResponse.json(
          createAuthErrorResponse(
            AuthErrorCodes.UNAUTHORIZED,
            '다른 사용자의 데이터를 수정할 수 없습니다.'
          ),
          { status: 403 }
        );
      }
    }

    const body = (await request.json()) as AdRecordsSyncRequest;
    const { unlockedFeatures, adWatchCounts, bannerSettings } = body;

    const now = new Date();

    // 관리자 권한 확인
    const roleCheck = await client.query(
      'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [tokenUser.userId]
    );
    const userRole = roleCheck.rows[0]?.role;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    // 관리자인 경우 기존 데이터 조회하여 제거된 기능 추적
    let adminRemovedFeatures: string[] = [];
    if (isAdmin) {
      const existingResult = await client.query<AdRecordRow>(
        `SELECT unlocked_features, admin_removed_features FROM user_ad_records WHERE user_id = $1`,
        [userId]
      );

      if (existingResult.rows.length > 0) {
        const existingUnlocked = existingResult.rows[0].unlocked_features || [];
        const existingRemoved = existingResult.rows[0].admin_removed_features || [];
        const newUnlocked = unlockedFeatures || [];

        // 기존에 있었는데 새로 없어진 기능 = 관리자가 제거한 기능
        const newlyRemoved = existingUnlocked.filter(f => !newUnlocked.includes(f));
        // 새로 추가된 기능은 admin_removed_features에서 제거
        const newlyAdded = newUnlocked.filter(f => !existingUnlocked.includes(f));

        // admin_removed_features 업데이트: 기존 + 새로 제거된 - 새로 추가된
        adminRemovedFeatures = [
          ...new Set([...existingRemoved, ...newlyRemoved])
        ].filter(f => !newlyAdded.includes(f));
      }
    }

    // UPSERT: 기록이 있으면 업데이트, 없으면 삽입
    const result = await client.query<AdRecordRow>(
      `INSERT INTO user_ad_records (user_id, unlocked_features, ad_watch_counts, banner_settings, admin_removed_features, last_synced_at, admin_modified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $6, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         unlocked_features = $2,
         ad_watch_counts = $3,
         banner_settings = $4,
         admin_removed_features = CASE WHEN $8 THEN $5 ELSE user_ad_records.admin_removed_features END,
         last_synced_at = $6,
         admin_modified_at = CASE WHEN $8 THEN $6 ELSE user_ad_records.admin_modified_at END,
         updated_at = $6
       RETURNING id, user_id, unlocked_features, ad_watch_counts, banner_settings, admin_removed_features, last_synced_at, admin_modified_at, created_at, updated_at`,
      [
        userId,
        JSON.stringify(unlockedFeatures || []),
        JSON.stringify(adWatchCounts || {}),
        JSON.stringify(bannerSettings || {}),
        JSON.stringify(adminRemovedFeatures),
        now,
        isAdmin ? now : null,  // INSERT용 admin_modified_at
        isAdmin,               // UPDATE 조건용 (관리자면 true)
      ]
    );

    const row = result.rows[0];
    const data: UserAdRecords = {
      id: row.id,
      userId: row.user_id,
      unlockedFeatures: row.unlocked_features || [],
      adWatchCounts: row.ad_watch_counts || {},
      bannerSettings: row.banner_settings || {},
      adminRemovedFeatures: row.admin_removed_features || [],
      lastSyncedAt: row.last_synced_at?.toISOString() || null,
      adminModifiedAt: row.admin_modified_at?.toISOString() || null,
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
