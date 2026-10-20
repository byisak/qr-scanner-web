// POST /api/stocktakes/:id/scans { events: [{ clientId, code, itemCode?, qty, scannedAt }] } → { inserted, stocktake }
// 같은 clientId 는 한 번만 들어간다 (앱이 오프라인 뒤 다시 보내도 안전). 끝난 실사에는 넣지 않는다
import { NextRequest, NextResponse } from 'next/server';
import { withUser, readJson } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { loadStocktakeState, stocktakeRole } from '@/lib/team';
import { insertScanEvents, MAX_EVENTS } from '@/lib/stocktake-events';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withUser(request, 'POST stocktake scans', async (client, userId) => {
    const role = await stocktakeRole(client, id, userId);
    if (!role) return apiError(404, 'NOT_FOUND', '실사를 찾을 수 없거나 참여하지 않았습니다.');
    const body = await readJson(request);
    if (!Array.isArray(body?.events)) return apiError(400, 'INVALID_BODY', 'events 배열이 필요합니다.');
    if (body.events.length > MAX_EVENTS) return apiError(413, 'TOO_MANY', `한 번에 ${MAX_EVENTS}개까지 보낼 수 있습니다.`);
    const fin = await client.query(`SELECT finished_at FROM shared_stocktakes WHERE id = $1`, [id]);
    if (fin.rows[0]?.finished_at) return apiError(409, 'FINISHED', '이미 끝난 실사입니다.');
    const inserted = await insertScanEvents(client, id, userId, body.events);
    return NextResponse.json({ success: true, inserted, role, stocktake: await loadStocktakeState(client, id) });
  });
}
