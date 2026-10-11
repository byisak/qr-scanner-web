import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { PoolClient } from 'pg';

export const dynamic = 'force-dynamic';

// GET /api/health - 헬스체크 (인증 불필요, 민감 정보 노출 없음)
export async function GET() {
  const start = Date.now();
  let client: PoolClient | null = null;
  let dbOk = false;
  try {
    client = await getConnection();
    await client.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  } finally {
    if (client) {
      client.release();
    }
  }

  const checks = [{ name: 'db', ok: dbOk, ms: Date.now() - start }];
  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version || 'unknown',
      checks,
    },
    { status: dbOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
