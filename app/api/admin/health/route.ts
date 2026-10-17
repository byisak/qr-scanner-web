// GET /api/admin/health - 운영 상태 (관리자 전용)
// DB 응답 시간, DB 용량(무료 플랜 500MB 대비)과 큰 테이블, 메일·실시간 설정 여부, 최근 크론 실행 기록
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Supabase 무료 플랜 DB 용량 한도
const DB_LIMIT_BYTES = 500 * 1024 * 1024;
// 크론이 하루 1번 도는데 이보다 오래 기록이 없으면 "늦음"
const CRON_STALE_HOURS = 26;

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const tokenUser = getUserFromRequest(request.headers.get('authorization'));
    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    client = await getConnection();

    const roleResult = await client.query(
      'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [tokenUser.userId]
    );
    const role = roleResult.rows[0]?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // DB 응답 시간
    const t0 = performance.now();
    await client.query('SELECT 1');
    const latencyMs = Math.round(performance.now() - t0);

    // DB 용량과 큰 테이블 5개
    const sizeResult = await client.query(`SELECT pg_database_size(current_database())::bigint AS bytes`);
    const tablesResult = await client.query(`
      SELECT relname AS name,
             pg_total_relation_size(relid)::bigint AS bytes,
             n_live_tup::bigint AS rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 5
    `);

    // 크론 기록 (테이블이 아직 없으면 null)
    let cron: {
      lastRun: CronRun | null;
      recent: CronRun[];
      stale: boolean;
    } | null = null;
    try {
      const runs = await client.query(`
        SELECT id, job, started_at, finished_at, ok, details, error
        FROM cron_runs
        ORDER BY started_at DESC
        LIMIT 14
      `);
      const recent: CronRun[] = runs.rows.map((r) => ({
        id: Number(r.id),
        job: r.job,
        startedAt: r.started_at.toISOString(),
        durationMs: r.finished_at.getTime() - r.started_at.getTime(),
        ok: r.ok,
        details: r.details,
        error: r.error,
      }));
      const lastRun = recent[0] ?? null;
      const stale = !lastRun ||
        Date.now() - new Date(lastRun.startedAt).getTime() > CRON_STALE_HOURS * 3600 * 1000;
      cron = { lastRun, recent, stale };
    } catch {
      cron = null;
    }

    return NextResponse.json({
      success: true,
      health: {
        db: { ok: true, latencyMs },
        storage: {
          bytes: Number(sizeResult.rows[0].bytes),
          limitBytes: DB_LIMIT_BYTES,
          tables: tablesResult.rows.map((r) => ({
            name: r.name,
            bytes: Number(r.bytes),
            rows: Number(r.rows),
          })),
        },
        email: { configured: !!(process.env.RESEND_API_KEY || process.env.SMTP_PASS) },
        realtime: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
        cron,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin health error:', error);
    return NextResponse.json(
      { success: false, health: { db: { ok: false, latencyMs: null } } },
      { status: 503 }
    );
  } finally {
    if (client) client.release();
  }
}

interface CronRun {
  id: number;
  job: string;
  startedAt: string;
  durationMs: number;
  ok: boolean;
  details: Record<string, number> | null;
  error: string | null;
}
