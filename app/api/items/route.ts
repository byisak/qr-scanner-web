// app/api/items/route.ts - 내 계정 품목 마스터
// GET    ?offset=0&limit=5000 → { items, total }
// DELETE { codes?: string[] } → codes 가 없으면 전체 삭제. { deleted }
import { NextRequest, NextResponse } from 'next/server';
import { withUser, readJson } from '@/lib/api-handler';
import { codeKey, mapItemRow } from '@/lib/team';

const MAX_LIMIT = 5000;

export async function GET(request: NextRequest) {
  return withUser(request, 'GET items', async (client, userId) => {
    const sp = request.nextUrl.searchParams;
    const offset = Math.max(0, parseInt(sp.get('offset') || '0', 10) || 0);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get('limit') || String(MAX_LIMIT), 10) || MAX_LIMIT));
    const total = await client.query(`SELECT COUNT(*)::int AS n FROM item_master WHERE user_id = $1`, [userId]);
    const rows = await client.query(
      `SELECT code, name, spec, unit, category, location, alt_codes, memo, updated_at
       FROM item_master WHERE user_id = $1 ORDER BY code LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return NextResponse.json({ success: true, total: total.rows[0].n, items: rows.rows.map(mapItemRow) });
  });
}

export async function DELETE(request: NextRequest) {
  return withUser(request, 'DELETE items', async (client, userId) => {
    const body = await readJson(request);
    const codes: unknown[] = Array.isArray(body?.codes) ? body.codes : [];
    const r = codes.length
      ? await client.query(`DELETE FROM item_master WHERE user_id = $1 AND code_key = ANY($2::text[])`, [userId, codes.map(codeKey).filter(Boolean)])
      : await client.query(`DELETE FROM item_master WHERE user_id = $1`, [userId]);
    return NextResponse.json({ success: true, deleted: r.rowCount || 0 });
  });
}
