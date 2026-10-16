// app/api/sessions/[sessionId]/join/route.ts
// 웹 세션 화면용 "세션 참가" (소켓 join-session 의 REST 버전, Vercel + Supabase Realtime 환경에서 사용)
//
// body: { sessionAccessToken? }  (비밀번호 검증 POST /api/sessions/:id/settings 가 발급한 토큰)
// 헤더: Authorization: Bearer <accessToken> (선택, 소유자/관리자 확인 및 본인 스캔 필터)
//
// 열람 권한(공개 → 누구나, 비밀번호 → 접근 토큰, 비공개 → 소유자/관리자)이 확인되면
// 기존 스캔과 실시간 채널 키(realtimeKey)를 돌려준다. 거부 시 403 + code PRIVATE | PASSWORD_REQUIRED.
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getRequestUser } from '@/lib/session-access';
import {
  checkViewAccess,
  ensureRealtimeKey,
  isValidSessionId,
  loadSessionForAccess,
  loadSessionScans,
  type SessionAccessRow,
} from '@/lib/session-service';
import { apiError } from '@/lib/api-response';
import type { PoolClient } from 'pg';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    let body: any = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const user = getRequestUser(request);
    const userId = user?.userId || null;

    client = await getConnection();
    let session: SessionAccessRow | null = await loadSessionForAccess(client, sessionId);

    if (!session) {
      // 소켓 join-session 과 같이 세션이 없으면 만든다 (앱보다 웹 화면을 먼저 연 경우)
      if (!isValidSessionId(sessionId)) {
        return apiError(400, 'INVALID_SESSION_ID', '세션 ID 형식이 올바르지 않습니다.');
      }
      await client.query(
        `INSERT INTO sessions (session_id, socket_id, user_id, session_name, created_at, last_activity, status)
         VALUES ($1, NULL, $2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ACTIVE')
         ON CONFLICT (session_id) DO NOTHING`,
        [sessionId, userId]
      );
      session = await loadSessionForAccess(client, sessionId);
      if (!session) {
        return apiError(500, 'INTERNAL_ERROR', '세션 참가에 실패했습니다.');
      }
    } else {
      const isProtected = session.is_public === false || !!session.password_hash;
      // 소유자 없는 세션의 소유권 지정은 보호 설정이 없을 때만 (검증된 사용자만)
      const claim = !!userId && !session.user_id && !isProtected;
      await client.query(
        `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP,
           user_id = COALESCE(user_id, $1)
         WHERE session_id = $2`,
        [claim ? userId : null, sessionId]
      );
      if (claim) session.user_id = userId;
    }

    const isPublic = session.is_public ?? true;
    const hasPassword = !!session.password_hash;

    const allowed = await checkViewAccess(client, session, {
      verifiedUserId: userId,
      sessionAccessToken: body?.sessionAccessToken,
    });
    if (!allowed) {
      const reason = !isPublic ? 'PRIVATE' : 'PASSWORD_REQUIRED';
      return NextResponse.json(
        {
          success: false,
          error: reason === 'PRIVATE' ? '비공개 세션입니다.' : '세션 비밀번호가 필요합니다.',
          code: reason,
          settings: { isPublic, hasPassword },
        },
        { status: 403 }
      );
    }

    const realtimeKey = session.realtime_key || (await ensureRealtimeKey(client, sessionId));
    // 로그인 사용자는 본인 스캔만 (소켓 join-session 과 동일)
    const existingData = await loadSessionScans(client, sessionId, userId);

    return NextResponse.json({
      success: true,
      sessionId,
      existingData,
      settings: { isPublic, hasPassword },
      realtimeKey,
    });
  } catch (err) {
    console.error('[POST /api/sessions/:id/join] 실패:', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '세션 참가에 실패했습니다.');
  } finally {
    if (client) {
      client.release();
    }
  }
}
