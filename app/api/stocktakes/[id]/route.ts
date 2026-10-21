// app/api/stocktakes/[id]/route.ts - 공유 실사 하나
// GET    → { role, stocktake } (만든 사람·참여자만)
// PATCH  { finished?: boolean, name?: string } → 만든 사람만
// DELETE → 만든 사람: 실사 삭제, 참여자: 나가기
import { NextRequest, NextResponse } from 'next/server';
import { withUser, readJson } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { loadStocktakeState, stocktakeRole } from '@/lib/team';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withUser(request, 'GET stocktake', async (client, userId) => {
    const role = await stocktakeRole(client, id, userId);
    if (!role) return apiError(404, 'NOT_FOUND', '실사를 찾을 수 없거나 참여하지 않았습니다.');
    const state = await loadStocktakeState(client, id);
    // 참여자도 참여 코드를 볼 수 있다 (다른 사람을 부를 수 있게)
    return NextResponse.json({ success: true, role, stocktake: state });
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withUser(request, 'PATCH stocktake', async (client, userId) => {
    const role = await stocktakeRole(client, id, userId);
    if (!role) return apiError(404, 'NOT_FOUND', '실사를 찾을 수 없습니다.');
    if (role !== 'owner') return apiError(403, 'FORBIDDEN', '만든 사람만 바꿀 수 있습니다.');
    const body = await readJson(request);
    if (typeof body?.finished === 'boolean') {
      await client.query(`UPDATE shared_stocktakes SET finished_at = ${body.finished ? 'NOW()' : 'NULL'}, updated_at = NOW() WHERE id = $1`, [id]);
    }
    if (typeof body?.name === 'string' && body.name.trim()) {
      await client.query(`UPDATE shared_stocktakes SET name = $2, updated_at = NOW() WHERE id = $1`, [id, body.name.trim().slice(0, 100)]);
    }
    return NextResponse.json({ success: true, role, stocktake: await loadStocktakeState(client, id) });
  });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withUser(request, 'DELETE stocktake', async (client, userId) => {
    const role = await stocktakeRole(client, id, userId);
    if (!role) return apiError(404, 'NOT_FOUND', '실사를 찾을 수 없습니다.');
    if (role === 'owner') await client.query(`DELETE FROM shared_stocktakes WHERE id = $1`, [id]);
    else await client.query(`DELETE FROM shared_stocktake_members WHERE stocktake_id = $1 AND user_id = $2`, [id, userId]);
    return NextResponse.json({ success: true, deleted: role === 'owner', left: role !== 'owner' });
  });
}
