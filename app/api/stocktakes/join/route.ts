// POST /api/stocktakes/join { code } → 참여 코드로 공유 실사에 들어간다 → { role, stocktake }
import { NextRequest, NextResponse } from 'next/server';
import { withUser, readJson } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { loadStocktakeState, normalizeJoinCode } from '@/lib/team';
import { isAttemptLimited, recordAttemptFailure } from '@/lib/password-attempts';

export async function POST(request: NextRequest) {
  return withUser(request, 'POST stocktakes/join', async (client, userId) => {
    const body = await readJson(request);
    const code = normalizeJoinCode(body?.code);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // 참여 코드 무작위 대입 방지 (세션 비밀번호와 같은 제한 장치를 '실사 참여' 키로)
    if (await isAttemptLimited(client, ip, 'stocktake-join')) return apiError(429, 'RATE_LIMITED', '잠시 후 다시 시도해 주세요.');
    if (!code) return apiError(400, 'INVALID_CODE', '참여 코드 6자리를 확인해 주세요.');

    const r = await client.query(`SELECT id, owner_id, finished_at FROM shared_stocktakes WHERE join_code = $1`, [code]);
    const st = r.rows[0];
    if (!st) {
      await recordAttemptFailure(client, ip, 'stocktake-join');
      return apiError(404, 'NOT_FOUND', '이 코드로 된 실사를 찾지 못했어요.');
    }
    if (st.owner_id !== userId) {
      await client.query(
        `INSERT INTO shared_stocktake_members (stocktake_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [st.id, userId]
      );
    }
    const state = await loadStocktakeState(client, st.id);
    return NextResponse.json({ success: true, role: st.owner_id === userId ? 'owner' : 'member', stocktake: state });
  });
}
