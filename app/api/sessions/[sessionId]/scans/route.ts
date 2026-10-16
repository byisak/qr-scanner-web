import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getRequestUser } from '@/lib/session-access';
import {
  ensureRealtimeKey,
  insertScan,
  isAdminUserId,
  loadSessionForAccess,
  validateScanCode,
} from '@/lib/session-service';
import { broadcastNewScan } from '@/lib/realtime';
import { apiError } from '@/lib/api-response';
import type { PoolClient } from 'pg';

// POST - 스캔 보내기  — docs/REALTIME_REST_CONTRACT.md 2절
// body: { code (필수, 최대 4096자), timestamp? }
// - 세션 없음: 404 SESSION_NOT_FOUND (앱이 POST /api/sessions 로 등록 후 한 번 재시도)
// - 세션 소유자 또는 관리자만 저장, 아니면 403
// - 저장 후 new-scan 실시간 알림 (Socket.IO 방 + Supabase Realtime), 알림 실패는 응답에 영향 없음
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    const user = getRequestUser(request);
    if (!user) {
      return apiError(401, 'UNAUTHORIZED', '인증이 필요합니다.');
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'INVALID_JSON', '요청 본문이 올바른 JSON이 아닙니다.');
    }
    const codeCheck = validateScanCode(body?.code);
    if (!codeCheck.ok) {
      return apiError(400, codeCheck.code, codeCheck.error);
    }

    client = await getConnection();

    const session = await loadSessionForAccess(client, sessionId);
    if (!session) {
      return apiError(404, 'SESSION_NOT_FOUND', '세션을 찾을 수 없습니다.');
    }

    const isOwner = !!session.user_id && session.user_id === user.userId;
    if (!isOwner && !(await isAdminUserId(client, user.userId))) {
      return apiError(403, 'FORBIDDEN', '이 세션에 스캔을 보낼 권한이 없습니다.');
    }

    const scan = await insertScan(client, {
      sessionId,
      code: codeCheck.code,
      timestamp: body?.timestamp,
      userId: user.userId,
    });

    const realtimeKey = session.realtime_key || (await ensureRealtimeKey(client, sessionId));
    client.release();
    client = null;

    await broadcastNewScan(sessionId, realtimeKey, scan);

    return NextResponse.json({ success: true, scan }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sessions/:id/scans] 실패:', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '스캔 저장에 실패했습니다.');
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    const authHeader = request.headers.get('authorization');
    const user = getUserFromRequest(authHeader);

    // 비로그인: 빈 배열 반환
    if (!user) {
      return NextResponse.json([]);
    }

    client = await getConnection();

    // 로그인: 내가 스캔한 것만
    const query = `SELECT sd.id, sd.session_id, sd.user_id, sd.code, sd.scan_timestamp, sd.created_at,
                    u.name as user_name, u.email as user_email
             FROM scan_data sd
             LEFT JOIN users u ON sd.user_id = u.id
             WHERE sd.session_id = $1 AND sd.user_id = $2
             ORDER BY sd.created_at ASC`;

    const result = await client.query(query, [sessionId, user.userId]);

    const scans = result.rows.map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      code: row.code,
      scan_timestamp: parseInt(row.scan_timestamp, 10) || 0,
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      userId: row.user_id || null,
      userName: row.user_name || row.user_email || null,
    }));

    return NextResponse.json(scans);
  } catch (err: any) {
    // console.error('스캔 데이터 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
