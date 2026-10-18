// 세션 비밀번호 시도 제한 (DB). Vercel 서버리스는 인스턴스마다 메모리가 달라
// lib/session-guard.ts 의 메모리 제한만으로는 무차별 대입을 막지 못한다.
// - IP + 세션: 10분에 10번
// - 세션 전체: 10분에 50번 (여러 IP로 나눠 시도하는 경우)
// 테이블이 아직 없으면(마이그레이션 전) 메모리 제한으로 대신한다.
import type { PoolClient } from 'pg';
import {
  isPasswordAttemptLimited,
  recordPasswordFailure,
  clearPasswordFailures,
} from './session-guard';

const WINDOW_MINUTES = 10;
const IP_LIMIT = 10;
const SESSION_LIMIT = 50;

const keysFor = (ip: string, sessionId: string) => ({
  ip: `ip:${ip}:${sessionId}`.slice(0, 320),
  session: `session:${sessionId}`.slice(0, 320),
});

function isMissingTable(err: unknown): boolean {
  return (err as { code?: string })?.code === '42P01';
}

export async function isAttemptLimited(client: PoolClient, ip: string, sessionId: string): Promise<boolean> {
  const k = keysFor(ip, sessionId);
  try {
    const r = await client.query(
      `SELECT key, count FROM session_password_attempts
       WHERE key = ANY($1::varchar[]) AND reset_at > NOW()`,
      [[k.ip, k.session]]
    );
    return r.rows.some((row) =>
      (row.key === k.ip && row.count >= IP_LIMIT) || (row.key === k.session && row.count >= SESSION_LIMIT)
    );
  } catch (err) {
    if (isMissingTable(err)) return isPasswordAttemptLimited(k.ip);
    throw err;
  }
}

export async function recordAttemptFailure(client: PoolClient, ip: string, sessionId: string): Promise<void> {
  const k = keysFor(ip, sessionId);
  try {
    await client.query(
      `INSERT INTO session_password_attempts (key, count, reset_at)
       SELECT unnest($1::varchar[]), 1, NOW() + make_interval(mins => $2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN session_password_attempts.reset_at <= NOW() THEN 1 ELSE session_password_attempts.count + 1 END,
         reset_at = CASE WHEN session_password_attempts.reset_at <= NOW() THEN EXCLUDED.reset_at ELSE session_password_attempts.reset_at END`,
      [[k.ip, k.session], WINDOW_MINUTES]
    );
  } catch (err) {
    if (isMissingTable(err)) return recordPasswordFailure(k.ip);
    throw err;
  }
}

// 성공하면 그 IP 기록만 지운다 (세션 전체 기록은 남겨 분산 대입을 계속 센다)
export async function clearAttemptFailures(client: PoolClient, ip: string, sessionId: string): Promise<void> {
  const k = keysFor(ip, sessionId);
  try {
    await client.query(`DELETE FROM session_password_attempts WHERE key = $1`, [k.ip]);
  } catch (err) {
    if (isMissingTable(err)) return clearPasswordFailures(k.ip);
    throw err;
  }
}
