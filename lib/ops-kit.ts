// ops-kit — Ops Contract v1 도우미 (control-tower/docs/OPS_CONTRACT.md)
// 서비스 레포에 이 파일 하나를 그대로 복사해서 쓴다. 외부 의존성 없음 (Node 런타임).
// 원본: github.com/byisak/control-tower/ops-kit/ops-kit.ts — 고칠 때는 원본을 고치고 다시 복사한다.

import { timingSafeEqual, createHash } from "node:crypto";

export const OPS_CONTRACT = "ops/v1";

export type HealthCheck = { name: string; ok: boolean; ms?: number; last?: string; detail?: string };
export type Health = { status: "ok" | "degraded" | "down"; version?: string; checks?: HealthCheck[] };

export type OpsOrder = { id: string; status: string; amount_krw?: number; title?: string; at: string; url?: string };
export type OpsInboxKind = "cs" | "cancel_request" | "claim" | "report" | "feedback" | "review";
export type OpsInboxItem = { id: string; kind: OpsInboxKind | string; from?: string; body?: string; at: string; url?: string };
export type OpsTodo = { id: string; kind: string; title: string; url?: string };

export type OpsSummary = {
  kpi?: Record<string, number>;
  orders?: { pending?: number; items?: OpsOrder[] };
  inbox?: { open?: number; items?: OpsInboxItem[] };
  errors?: { count: number };
  jobs?: { queued?: number; failed?: number };
  todo?: OpsTodo[];
};

export type OpsWindow = { since: Date; until: Date };

const NO_STORE = { "Cache-Control": "no-store" };

export function opsVersion(): string | undefined {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA;
  return sha ? sha.slice(0, 7) : undefined;
}

// health 응답. checks 중 하나라도 실패면 degraded, 필수(critical) 실패면 503 down
export function healthResponse(checks: HealthCheck[], critical: string[] = ["db"]): Response {
  const down = checks.some((c) => !c.ok && critical.includes(c.name));
  const degraded = checks.some((c) => !c.ok);
  const body: Health = { status: down ? "down" : degraded ? "degraded" : "ok", version: opsVersion(), checks };
  return Response.json(body, { status: down ? 503 : 200, headers: NO_STORE });
}

// 걸린 시간을 재며 검사 하나 실행. 예외 문구는 밖으로 내보내지 않는다.
export async function timed(name: string, fn: () => Promise<unknown>): Promise<HealthCheck> {
  const t0 = performance.now();
  try {
    await fn();
    return { name, ok: true, ms: Math.round(performance.now() - t0) };
  } catch {
    return { name, ok: false, ms: Math.round(performance.now() - t0) };
  }
}

function sha(s: string) {
  return createHash("sha256").update(s).digest();
}

// Bearer OPS_TOKEN 검사. 통과하면 null, 아니면 돌려줄 Response
export function checkOpsToken(req: Request, envName = "OPS_TOKEN"): Response | null {
  const expected = process.env[envName];
  if (!expected) return Response.json({ error: "ops disabled" }, { status: 503, headers: NO_STORE });
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!got || !timingSafeEqual(sha(got), sha(expected))) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  return null;
}

// ?since= 해석: 없거나 잘못되면 최근 24시간, 최대 7일
export function opsWindow(req: Request, now = new Date()): OpsWindow {
  const raw = new URL(req.url).searchParams.get("since");
  const t = raw ? Date.parse(raw) : NaN;
  const min = now.getTime() - 7 * 864e5;
  const since = Number.isFinite(t) ? new Date(Math.max(min, Math.min(t, now.getTime()))) : new Date(now.getTime() - 864e5);
  return { since, until: now };
}

// summary 라우트 한 번에: 토큰 검사 → 창 계산 → 수집 함수 → 형식 맞춰 응답
export async function summaryResponse(
  req: Request,
  service: string,
  collect: (w: OpsWindow) => Promise<OpsSummary>,
): Promise<Response> {
  const denied = checkOpsToken(req);
  if (denied) return denied;
  const w = opsWindow(req);
  try {
    const s = await collect(w);
    const body = {
      contract: OPS_CONTRACT,
      service,
      version: opsVersion(),
      window: { since: w.since.toISOString(), until: w.until.toISOString() },
      ...s,
      orders: s.orders && { ...s.orders, items: s.orders.items?.slice(0, 100) },
      inbox: s.inbox && { ...s.inbox, items: s.inbox.items?.slice(0, 100) },
    };
    return Response.json(body, { headers: NO_STORE });
  } catch (e) {
    console.error("[ops/summary]", e);
    return Response.json({ error: "summary failed" }, { status: 500, headers: NO_STORE });
  }
}

// ── 개인정보 가림 ─────────────────────────────────────────

// "김민수" → "김*수", "Kim" → "K*m", 이메일 → "ab***@gmail.com"
export function maskName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  const s = name.trim();
  if (s.includes("@")) {
    const [u, d] = s.split("@");
    return `${u.slice(0, 2)}***@${d}`;
  }
  const chars = [...s];
  if (chars.length <= 1) return "*";
  if (chars.length === 2) return `${chars[0]}*`;
  return chars[0] + "*".repeat(chars.length - 2) + chars[chars.length - 1];
}

const PHONE = /(01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
const EMAIL = /([A-Za-z0-9._%+-]{1,2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const ACCOUNT = /\b\d{3,6}-\d{2,6}-\d{4,8}\b/g;

// 본문: 전화·이메일·계좌 패턴을 가리고 200자로 자름
export function clip(text: string | null | undefined, max = 200): string | undefined {
  if (!text) return undefined;
  const cleaned = text
    .replace(PHONE, "[전화]")
    .replace(EMAIL, "$1***@$2")
    .replace(ACCOUNT, "[계좌]")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1) + "…" : cleaned;
}

export const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : new Date(0).toISOString());
