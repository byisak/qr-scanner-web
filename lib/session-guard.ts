// lib/session-guard.ts - 세션 열람 권한 판단 / 비밀번호 시도 제한
// next/server 의존성이 없어 커스텀 소켓 서버(server.ts)에서도 import 가능하다.
import { verifySessionAccessToken } from './auth';

/**
 * 세션 열람 권한 판단 (소켓 join-session 등에서 사용)
 * - 소유자/관리자: 항상 허용
 * - 비공개 세션: 소유자/관리자만
 * - 비밀번호 보호 세션: 비밀번호 또는 세션 접근 토큰이 유효해야 함
 * - 그 외 공개 세션: 허용
 */
export function canViewSession(opts: {
  sessionId: string;
  ownerId: string | null;
  isPublic: boolean;
  passwordHash: string | null;
  verifiedUserId: string | null;
  verifiedIsAdmin: boolean;
  sessionAccessToken?: unknown;
  passwordValid?: boolean;
}): boolean {
  const { sessionId, ownerId, isPublic, passwordHash, verifiedUserId, verifiedIsAdmin } = opts;
  if (verifiedIsAdmin) return true;
  if (verifiedUserId && ownerId && verifiedUserId === ownerId) return true;
  if (!isPublic) return false;
  if (!passwordHash) return true;
  if (opts.passwordValid) return true;
  return verifySessionAccessToken(opts.sessionAccessToken, sessionId);
}

// ============================================
// 비밀번호 검증 시도 제한 (무차별 대입 방지)
// ============================================
// 커스텀 server.ts 단일 프로세스에서 동작하므로 메모리 기반으로 충분하다.
const PASSWORD_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10분
const PASSWORD_ATTEMPT_LIMIT = 10;
const passwordAttempts = new Map<string, { count: number; resetAt: number }>();

export function isPasswordAttemptLimited(key: string): boolean {
  const now = Date.now();
  const entry = passwordAttempts.get(key);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= PASSWORD_ATTEMPT_LIMIT;
}

export function recordPasswordFailure(key: string): void {
  const now = Date.now();
  const entry = passwordAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    passwordAttempts.set(key, { count: 1, resetAt: now + PASSWORD_ATTEMPT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
  // 메모리 누수 방지: 오래된 항목 정리
  if (passwordAttempts.size > 10000) {
    for (const [k, v] of passwordAttempts) {
      if (v.resetAt < now) passwordAttempts.delete(k);
    }
  }
}

export function clearPasswordFailures(key: string): void {
  passwordAttempts.delete(key);
}
