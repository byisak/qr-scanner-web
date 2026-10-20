// POST /api/url-check - 앱이 스캔한 URL을 열기 전에 위험 사이트인지 묻는다 (로그인 불필요)
// 요청 { url } → { success: true, status: 'safe' | 'danger' | 'unknown', threats: [] }
// 남용 방지: IP당 10분에 300번 (session_password_attempts 테이블을 함께 쓴다, 없으면 제한 없이)
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { checkUrl, normalizeCheckUrl, urlCheckConfigured } from '@/lib/url-check';

const LIMIT = 300;
const WINDOW_MINUTES = 10;

async function overLimit(ip: string): Promise<boolean> {
  let client = null;
  try {
    client = await getConnection();
    const key = `urlcheck:${ip}`.slice(0, 320);
    const r = await client.query(
      `INSERT INTO session_password_attempts (key, count, reset_at)
       VALUES ($1, 1, NOW() + make_interval(mins => $2))
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN session_password_attempts.reset_at <= NOW() THEN 1 ELSE session_password_attempts.count + 1 END,
         reset_at = CASE WHEN session_password_attempts.reset_at <= NOW() THEN EXCLUDED.reset_at ELSE session_password_attempts.reset_at END
       RETURNING count`,
      [key, WINDOW_MINUTES]
    );
    return (r.rows[0]?.count ?? 0) > LIMIT;
  } catch {
    return false; // 테이블이 없거나 DB 오류면 검사는 막지 않는다
  } finally {
    client?.release();
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'INVALID_JSON', '요청 본문이 올바른 JSON이 아닙니다.');
  }
  const url = normalizeCheckUrl(body?.url);
  if (!url) return apiError(400, 'INVALID_URL', 'http(s) 주소만 검사할 수 있습니다.');

  if (!urlCheckConfigured()) {
    return NextResponse.json({ success: true, status: 'unknown', threats: [] });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (await overLimit(ip)) {
    return apiError(429, 'RATE_LIMITED', '잠시 후 다시 시도해 주세요.');
  }

  const result = await checkUrl(url);
  return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}
