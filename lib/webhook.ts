// lib/webhook.ts - 세션에 스캔이 들어오면 사용자가 정한 주소(예: 구글 시트 Apps Script 웹 앱)로 보낸다
// - https 주소만, 내부망·localhost 주소는 막는다 (서버가 대신 요청을 보내므로)
// - 본문 서명: X-ScanView-Signature: sha256=<HMAC-SHA256(webhook_secret, 본문)>
// - 실패해도 스캔 저장에는 영향 없음. 마지막 결과만 session_settings 에 남겨 화면에 보여 준다
import { createHmac, randomBytes } from 'crypto';
import type { PoolClient } from 'pg';
import { getConnection } from './db';

const TIMEOUT_MS = 5000;

export function generateWebhookSecret(): string {
  return randomBytes(24).toString('hex');
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (h.includes(':')) return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80');
  return false;
}

/** 저장 가능한 웹훅 주소면 정규화한 문자열, 아니면 null */
export function validateWebhookUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s || s.length > 2000) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    if (isPrivateHost(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export interface WebhookScan {
  id: number | string;
  code: string;
  scan_timestamp?: number | string | null;
  createdAt?: string;
  userName?: string | null;
}

export function buildWebhookBody(sessionId: string, sessionName: string | null, scan: WebhookScan, test = false) {
  const ts = typeof scan.scan_timestamp === 'number' ? new Date(scan.scan_timestamp) : new Date(scan.createdAt || Date.now());
  return JSON.stringify({
    event: test ? 'test' : 'scan',
    sessionId,
    sessionName,
    scan: {
      id: scan.id,
      code: scan.code,
      scannedAt: ts.toISOString(),
      user: scan.userName || null,
    },
  });
}

/** 보내고 결과를 { ok, status, error } 로. 마지막 결과를 session_settings 에 남긴다 */
export async function postWebhook(
  client: PoolClient | null,
  sessionId: string,
  url: string,
  secret: string,
  body: string
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let result: { ok: boolean; status: number | null; error: string | null };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ScanView-Webhook/1.0',
        'X-ScanView-Event': JSON.parse(body).event,
        'X-ScanView-Signature': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
      },
      body,
      // 리다이렉트는 따라가지 않는다(내부망으로 돌려보내는 것 방지). Apps Script 웹 앱은 처리 뒤 302를 주므로 3xx도 성공
      redirect: 'manual',
      signal: ctrl.signal,
    });
    const ok = (res.status >= 200 && res.status < 400) || res.type === 'opaqueredirect';
    result = { ok, status: res.status, error: ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    result = { ok: false, status: null, error: err instanceof Error ? (err.name === 'AbortError' ? 'timeout' : err.message) : 'error' };
  } finally {
    clearTimeout(timer);
  }

  const own = !client;
  let c = client;
  try {
    if (own) c = await getConnection();
    await c!.query(
      `UPDATE session_settings SET webhook_last_status = $2, webhook_last_at = CURRENT_TIMESTAMP WHERE session_id = $1`,
      [sessionId, result.ok ? `ok ${result.status}` : `fail ${result.error}`.slice(0, 120)]
    );
  } catch {
    // 컬럼이 아직 없거나 DB 오류: 기록만 건너뛴다
  } finally {
    if (own) c?.release();
  }
  return result;
}

/** 스캔 저장 뒤 호출. 웹훅이 없으면 아무것도 하지 않는다 */
export async function deliverScanWebhook(sessionId: string, scan: WebhookScan): Promise<void> {
  let client: PoolClient | null = null;
  try {
    client = await getConnection();
    const r = await client.query(
      `SELECT ss.webhook_url, ss.webhook_secret, s.session_name
       FROM session_settings ss JOIN sessions s ON s.session_id = ss.session_id
       WHERE ss.session_id = $1`,
      [sessionId]
    );
    const row = r.rows[0];
    if (!row?.webhook_url || !row?.webhook_secret) return;
    const url = validateWebhookUrl(row.webhook_url);
    if (!url) return;
    await postWebhook(client, sessionId, url, row.webhook_secret, buildWebhookBody(sessionId, row.session_name, scan));
  } catch (err) {
    // 웹훅 컬럼이 없으면(마이그레이션 전) 조용히 넘어간다
    if ((err as { code?: string })?.code !== '42703') {
      console.warn('[webhook] deliver failed:', err instanceof Error ? err.message : err);
    }
  } finally {
    client?.release();
  }
}
