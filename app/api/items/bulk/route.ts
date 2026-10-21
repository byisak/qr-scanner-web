// POST /api/items/bulk { items: [...], policy: 'overwrite' | 'fill' | 'skip' } → { added, updated, skipped, invalid }
// 한 번에 5000개까지. 더 많으면 나눠서 보낸다 (웹 업로드 화면·앱 올리기 모두)
import { NextRequest, NextResponse } from 'next/server';
import { withUser, readJson } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { cleanItem } from '@/lib/team';

const MAX_ITEMS = 5000;

const CONFLICT: Record<string, string> = {
  overwrite: `DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, spec = EXCLUDED.spec, unit = EXCLUDED.unit,
    category = EXCLUDED.category, location = EXCLUDED.location, alt_codes = EXCLUDED.alt_codes, memo = EXCLUDED.memo, updated_at = NOW()`,
  fill: `DO UPDATE SET
    name = CASE WHEN item_master.name = '' THEN EXCLUDED.name ELSE item_master.name END,
    spec = CASE WHEN item_master.spec = '' THEN EXCLUDED.spec ELSE item_master.spec END,
    unit = CASE WHEN item_master.unit = '' THEN EXCLUDED.unit ELSE item_master.unit END,
    category = CASE WHEN item_master.category = '' THEN EXCLUDED.category ELSE item_master.category END,
    location = CASE WHEN item_master.location = '' THEN EXCLUDED.location ELSE item_master.location END,
    memo = CASE WHEN item_master.memo = '' THEN EXCLUDED.memo ELSE item_master.memo END,
    alt_codes = (SELECT COALESCE(jsonb_agg(DISTINCT v), '[]'::jsonb) FROM jsonb_array_elements(item_master.alt_codes || EXCLUDED.alt_codes) v),
    updated_at = NOW()`,
  skip: `DO NOTHING`,
};

export async function POST(request: NextRequest) {
  return withUser(request, 'POST items/bulk', async (client, userId) => {
    const body = await readJson(request);
    if (!body || !Array.isArray(body.items)) return apiError(400, 'INVALID_BODY', 'items 배열이 필요합니다.');
    if (body.items.length > MAX_ITEMS) return apiError(413, 'TOO_MANY', `한 번에 ${MAX_ITEMS}개까지 보낼 수 있습니다.`);
    const policy = CONFLICT[body.policy] ? body.policy : 'overwrite';

    // 같은 코드가 여러 번 오면 마지막 것
    const byKey = new Map<string, NonNullable<ReturnType<typeof cleanItem>>>();
    let invalid = 0;
    for (const raw of body.items) {
      const it = cleanItem(raw);
      if (!it) { invalid++; continue; }
      byKey.set(it.codeKey, it);
    }
    const rows = Array.from(byKey.values()).map((it) => ({
      code_key: it.codeKey, code: it.code, name: it.name, spec: it.spec, unit: it.unit,
      category: it.category, location: it.location, alt_codes: it.altCodes, memo: it.memo,
    }));
    if (!rows.length) return NextResponse.json({ success: true, added: 0, updated: 0, skipped: 0, invalid });

    const r = await client.query(
      `INSERT INTO item_master (user_id, code_key, code, name, spec, unit, category, location, alt_codes, memo, updated_at)
       SELECT $1, x.code_key, x.code, x.name, x.spec, x.unit, x.category, x.location, x.alt_codes, x.memo, NOW()
       FROM jsonb_to_recordset($2::jsonb) AS x(code_key text, code text, name text, spec text, unit text, category text, location text, alt_codes jsonb, memo text)
       ON CONFLICT (user_id, code_key) ${CONFLICT[policy]}
       RETURNING (xmax = 0) AS inserted`,
      [userId, JSON.stringify(rows)]
    );
    const added = r.rows.filter((x) => x.inserted).length;
    const updated = r.rows.length - added;
    return NextResponse.json({ success: true, added, updated, skipped: rows.length - r.rows.length, invalid });
  });
}
