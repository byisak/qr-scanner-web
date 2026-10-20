// app/api/sessions/[sessionId]/webhook/route.ts - 세션 스캔을 외부 주소(구글 시트 등)로 보내기 설정 (소유자·관리자만)
// GET  → { url, secret, lastStatus, lastAt }
// PUT  { url } → 저장 (빈 값이면 끄기). 처음 저장할 때 서명용 secret 생성
// POST { action: 'test' } → 시험 행 하나 보내고 결과
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { requireSessionOwner } from '@/lib/session-access';
import { validateWebhookUrl, generateWebhookSecret, postWebhook, buildWebhookBody } from '@/lib/webhook';

type Ctx = { params: Promise<{ sessionId: string }> };

async function loadRow(client: PoolClient, sessionId: string) {
  const r = await client.query(
    `SELECT ss.webhook_url, ss.webhook_secret, ss.webhook_last_status, ss.webhook_last_at, s.session_name
     FROM sessions s LEFT JOIN session_settings ss ON ss.session_id = s.session_id
     WHERE s.session_id = $1`,
    [sessionId]
  );
  return r.rows[0] || null;
}

const toJson = (row: any) => ({
  success: true,
  url: row?.webhook_url || null,
  secret: row?.webhook_secret || null,
  lastStatus: row?.webhook_last_status || null,
  lastAt: row?.webhook_last_at || null,
});

export async function GET(request: NextRequest, { params }: Ctx) {
  const { sessionId } = await params;
  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    const owner = await requireSessionOwner(client, request, sessionId, '웹훅 설정을 보려면');
    if (!owner.ok) return owner.response;
    return NextResponse.json(toJson(await loadRow(client, sessionId)));
  } catch (err) {
    if ((err as { code?: string })?.code === '42703') return apiError(503, 'NOT_READY', '서버 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    console.error('[GET webhook]', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '웹훅 설정을 불러오지 못했습니다.');
  } finally {
    client?.release();
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { sessionId } = await params;
  let body: any;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', '요청 본문이 올바른 JSON이 아닙니다.'); }
  const raw = typeof body?.url === 'string' ? body.url.trim() : '';
  const url = raw ? validateWebhookUrl(raw) : null;
  if (raw && !url) return apiError(400, 'INVALID_URL', 'https:// 로 시작하는 외부 주소만 쓸 수 있습니다.');

  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    const owner = await requireSessionOwner(client, request, sessionId, '웹훅을 설정하려면');
    if (!owner.ok) return owner.response;
    const current = await loadRow(client, sessionId);
    const secret = url ? current?.webhook_secret || generateWebhookSecret() : null;
    await client.query(
      `INSERT INTO session_settings (session_id, webhook_url, webhook_secret, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id) DO UPDATE SET webhook_url = $2, webhook_secret = $3,
         webhook_last_status = CASE WHEN $2::text IS NULL THEN NULL ELSE session_settings.webhook_last_status END,
         updated_at = CURRENT_TIMESTAMP`,
      [sessionId, url, secret]
    );
    return NextResponse.json(toJson(await loadRow(client, sessionId)));
  } catch (err) {
    if ((err as { code?: string })?.code === '42703') return apiError(503, 'NOT_READY', '서버 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    console.error('[PUT webhook]', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '웹훅을 저장하지 못했습니다.');
  } finally {
    client?.release();
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { sessionId } = await params;
  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    const owner = await requireSessionOwner(client, request, sessionId, '웹훅을 시험하려면');
    if (!owner.ok) return owner.response;
    const row = await loadRow(client, sessionId);
    const url = row?.webhook_url ? validateWebhookUrl(row.webhook_url) : null;
    if (!url || !row?.webhook_secret) return apiError(400, 'NO_WEBHOOK', '먼저 보낼 주소를 저장해 주세요.');
    const result = await postWebhook(
      client,
      sessionId,
      url,
      row.webhook_secret,
      buildWebhookBody(sessionId, row.session_name, { id: 'test', code: 'TEST-8801234002028', createdAt: new Date().toISOString(), userName: null }, true)
    );
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('[POST webhook test]', err instanceof Error ? err.message : err);
    return apiError(500, 'INTERNAL_ERROR', '시험 전송에 실패했습니다.');
  } finally {
    client?.release();
  }
}
