// 크론 실행 기록: 성공·실패와 지운 건수를 cron_runs 에 남긴다.
// 기록 실패(테이블 없음 등)가 정리 작업 결과를 바꾸지 않도록 오류는 삼킨다.
import { getConnection } from '@/lib/db';

export async function recordCronRun(
  job: string,
  startedAt: Date,
  ok: boolean,
  details: Record<string, unknown> | null,
  error?: string
): Promise<void> {
  let client = null;
  try {
    client = await getConnection();
    await client.query(
      `INSERT INTO cron_runs (job, started_at, ok, details, error) VALUES ($1, $2, $3, $4, $5)`,
      [job, startedAt, ok, details ? JSON.stringify(details) : null, error ? error.slice(0, 500) : null]
    );
    // 오래된 기록은 90일만 남긴다
    await client.query(`DELETE FROM cron_runs WHERE started_at < NOW() - INTERVAL '90 days'`);
  } catch (err) {
    console.error('[cron-runs] 기록 실패:', err instanceof Error ? err.message : err);
  } finally {
    if (client) client.release();
  }
}
