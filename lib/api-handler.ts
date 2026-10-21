// lib/api-handler.ts - 로그인이 필요한 API 공통: 사용자 확인 → DB 연결 → 오류를 REST 계약 형식으로
import type { NextRequest } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from './db';
import { apiError } from './api-response';
import { getRequestUser } from './session-access';
import { isMissingTable } from './team';

export async function withUser(
  request: NextRequest,
  label: string,
  fn: (client: PoolClient, userId: string) => Promise<Response>
): Promise<Response> {
  const user = getRequestUser(request);
  if (!user) return apiError(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    return await fn(client, user.userId);
  } catch (err) {
    if (isMissingTable(err)) return apiError(503, 'NOT_READY', '서버 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    console.error(`[${label}]`, err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '요청을 처리하지 못했습니다.');
  } finally {
    client?.release();
  }
}

export async function readJson(request: NextRequest): Promise<any | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
