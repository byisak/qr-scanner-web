// API: /api/users/[userId]/ad-records/sync
// 모바일 앱 광고 기록 동기화 (양방향 병합)

import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import type { UserAdRecords } from '@/types';

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

interface SyncRequest {
  unlockedFeatures: string[];
  adWatchCounts: Record<string, number>;
  bannerSettings?: Record<string, boolean>;
  lastSyncedAt?: string; // 앱의 마지막 동기화 시간
}

// POST: 양방향 동기화 (로컬 데이터와 서버 데이터 병합)
export async function POST(
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

    // 본인만 동기화 가능
    if (tokenUser.userId !== userId) {
      return NextResponse.json(
        createAuthErrorResponse(
          AuthErrorCodes.UNAUTHORIZED,
          '다른 사용자의 데이터를 동기화할 수 없습니다.'
        ),
        { status: 403 }
      );
    }

    const body = (await request.json()) as SyncRequest;
    const {
      unlockedFeatures: localUnlocked,
      adWatchCounts: localCounts,
      bannerSettings: localBannerSettings,
    } = body;

    client = await getConnection();

    // 서버의 현재 데이터 조회
    const existingResult = await client.query<AdRecordRow>(
      `SELECT id, user_id, unlocked_features, ad_watch_counts, banner_settings,
              admin_removed_features, last_synced_at, admin_modified_at, created_at, updated_at
       FROM user_ad_records
       WHERE user_id = $1`,
      [userId]
    );

    const now = new Date();
    let mergedUnlocked: string[];
    let mergedCounts: Record<string, number>;
    let mergedBannerSettings: Record<string, boolean>;
    let adminRemovedFeatures: string[] = [];
    let featuresRemovedByAdmin: string[] = [];

    if (existingResult.rows.length === 0) {
      // 서버에 데이터 없음 - 로컬 데이터 그대로 사용
      mergedUnlocked = localUnlocked || [];
      mergedCounts = localCounts || {};
      mergedBannerSettings = localBannerSettings || {};
    } else {
      // 서버 데이터 존재
      const serverData = existingResult.rows[0];
      const serverUnlocked = serverData.unlocked_features || [];
      const serverCounts = serverData.ad_watch_counts || {};
      const serverBannerSettings = serverData.banner_settings || {};
      adminRemovedFeatures = serverData.admin_removed_features || [];

      // 새로운 병합 로직:
      // merged = (앱_기능 - admin_removed) ∪ 서버_기능
      // 이렇게 하면:
      // - 관리자가 명시적으로 제거한 기능은 앱에서 가져와도 제외됨
      // - 앱에서 새로 해제한 기능(광고 시청)은 유지됨
      // - 서버에만 있는 기능도 유지됨

      const appFeaturesFiltered = (localUnlocked || []).filter(
        f => !adminRemovedFeatures.includes(f)
      );
      mergedUnlocked = [...new Set([...serverUnlocked, ...appFeaturesFiltered])];

      // 앱이 가지고 있었지만 admin_removed로 인해 제거된 기능 추적
      featuresRemovedByAdmin = (localUnlocked || []).filter(
        f => adminRemovedFeatures.includes(f)
      );

      // 광고 시청 횟수: 더 큰 값 사용 (각 기능별로)
      mergedCounts = { ...serverCounts };
      for (const [featureId, count] of Object.entries(localCounts || {})) {
        mergedCounts[featureId] = Math.max(mergedCounts[featureId] || 0, count);
      }

      // 배너 설정: 서버 값 우선 (관리자가 설정할 수 있으므로)
      mergedBannerSettings = { ...localBannerSettings, ...serverBannerSettings };
    }

    // 병합된 데이터 저장 (admin_modified_at, admin_removed_features는 유지)
    const result = await client.query<AdRecordRow>(
      `INSERT INTO user_ad_records (user_id, unlocked_features, ad_watch_counts, banner_settings, admin_removed_features, last_synced_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, '[]'::jsonb, $5, $5, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         unlocked_features = $2,
         ad_watch_counts = $3,
         banner_settings = $4,
         last_synced_at = $5,
         updated_at = $5
       RETURNING id, user_id, unlocked_features, ad_watch_counts, banner_settings, admin_removed_features, last_synced_at, admin_modified_at, created_at, updated_at`,
      [
        userId,
        JSON.stringify(mergedUnlocked),
        JSON.stringify(mergedCounts),
        JSON.stringify(mergedBannerSettings),
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
      adminRemovedFeatures: row.admin_removed_features || [],
      lastSyncedAt: row.last_synced_at?.toISOString() || null,
      adminModifiedAt: row.admin_modified_at?.toISOString() || null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };

    const hasAdminRemovals = featuresRemovedByAdmin.length > 0;

    return NextResponse.json({
      success: true,
      data,
      message: hasAdminRemovals
        ? '관리자가 제거한 기능이 반영되었습니다.'
        : '광고 기록이 동기화되었습니다.',
      adminOverride: hasAdminRemovals,
      merged: {
        // 앱에서 업데이트해야 할 데이터가 있는지 알려줌
        unlockedFeaturesAdded: mergedUnlocked.filter(f => !(localUnlocked || []).includes(f)),
        unlockedFeaturesRemoved: featuresRemovedByAdmin,
        countsUpdated: Object.entries(mergedCounts).filter(
          ([k, v]) => (localCounts?.[k] || 0) !== v
        ).length > 0,
      },
    });
  } catch (error) {
    console.error('Sync ad records error:', error);
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        '광고 기록 동기화 중 오류가 발생했습니다.'
      ),
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
