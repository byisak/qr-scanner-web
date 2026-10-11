import { query } from '@/lib/db';
import { summaryResponse, type OpsSummary } from '@/lib/ops-kit';

export const dynamic = 'force-dynamic';

// GET /api/ops/summary?since=<ISO8601>
// 관제실 Ops Contract v1: 기간 안 가입·활성 사용자·스캔·세션·광고 해제·탈퇴 수 (Bearer OPS_TOKEN, 읽기 전용, 개인정보 없음)
// ad_unlocks: 광고 기록은 사용자당 한 줄이라 "기간 안 기록이 갱신됐고 해제된 기능이 하나 이상인 사용자 수"로 센다.
const SQL = `
SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= $1)                                        AS signups,
  (SELECT COUNT(*) FROM users WHERE last_login_at >= $1 AND deleted_at IS NULL)               AS active_users,
  (SELECT COUNT(*) FROM scan_data WHERE created_at >= $1)                                    AS scans,
  (SELECT COUNT(*) FROM sessions WHERE created_at >= $1)                                     AS sessions_new,
  (SELECT COUNT(*) FROM user_ad_records
     WHERE updated_at >= $1 AND jsonb_array_length(COALESCE(unlocked_features, '[]'::jsonb)) > 0) AS ad_unlocks,
  (SELECT COUNT(*) FROM users WHERE deleted_at >= $1)                                        AS deleted_users
`;

const KEYS = ['signups', 'active_users', 'scans', 'sessions_new', 'ad_unlocks', 'deleted_users'] as const;

export async function GET(request: Request) {
  return summaryResponse(request, 'scanview', async ({ since }): Promise<OpsSummary> => {
    const { rows } = await query(SQL, [since]);
    const row = (rows[0] ?? {}) as Record<string, string | number | null>;
    const kpi: Record<string, number> = {};
    for (const k of KEYS) kpi[k] = Number(row[k] ?? 0);
    return { kpi };
  });
}
