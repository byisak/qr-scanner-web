// lib/url-check.ts - 스캔한 URL이 알려진 위험 사이트(피싱·악성코드·원치 않는 소프트웨어)인지 Google 목록과 대조
// 공급자: WEB_RISK_API_KEY(상업용 Web Risk API) 가 있으면 그것, 없으면 SAFE_BROWSING_API_KEY(Safe Browsing v4, 비상업용)
// 키가 없으면 status 'unknown' — 앱은 아무 표시도 하지 않는다.

export type UrlCheckStatus = 'safe' | 'danger' | 'unknown';
export interface UrlCheckResult {
  status: UrlCheckStatus;
  threats: string[]; // MALWARE | SOCIAL_ENGINEERING | UNWANTED_SOFTWARE ...
}

const THREATS = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];
const TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; result: UrlCheckResult }>();

export function normalizeCheckUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s || s.length > 2048) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function checkWithWebRisk(url: string, key: string): Promise<UrlCheckResult> {
  const qs = THREATS.map((t) => `threatTypes=${t}`).join('&');
  const data = await fetchJson(
    `https://webrisk.googleapis.com/v1/uris:search?${qs}&uri=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}`
  );
  const threats: string[] = data?.threat?.threatTypes || [];
  return { status: threats.length ? 'danger' : 'safe', threats };
}

async function checkWithSafeBrowsing(url: string, key: string): Promise<UrlCheckResult> {
  const data = await fetchJson(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'scanview', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: THREATS,
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    }
  );
  const threats: string[] = Array.from(new Set((data?.matches || []).map((m: any) => m.threatType).filter(Boolean)));
  return { status: threats.length ? 'danger' : 'safe', threats };
}

export function urlCheckConfigured(): boolean {
  return !!(process.env.WEB_RISK_API_KEY || process.env.SAFE_BROWSING_API_KEY);
}

export async function checkUrl(url: string): Promise<UrlCheckResult> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;

  const webRiskKey = process.env.WEB_RISK_API_KEY;
  const safeBrowsingKey = process.env.SAFE_BROWSING_API_KEY;
  let result: UrlCheckResult = { status: 'unknown', threats: [] };
  try {
    if (webRiskKey) result = await checkWithWebRisk(url, webRiskKey);
    else if (safeBrowsingKey) result = await checkWithSafeBrowsing(url, safeBrowsingKey);
  } catch (err) {
    console.warn('[url-check] provider failed:', err instanceof Error ? err.message : err);
    return { status: 'unknown', threats: [] }; // 실패는 캐시하지 않는다
  }
  if (result.status !== 'unknown') {
    if (cache.size > 5000) cache.clear();
    cache.set(url, { at: Date.now(), result });
  }
  return result;
}
