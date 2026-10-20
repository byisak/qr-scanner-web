// app/api/stocktakes/route.ts - 공유 재고 실사
// GET  → 내가 만들었거나 참여한 실사 목록
// POST { name, items: [{ code, name, expected }], scans?: [이벤트] } → 새 공유 실사 (참여 코드 발급) + 상태
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { withUser, readJson } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { codeKey, generateJoinCode, loadStocktakeState } from '@/lib/team';
import { insertScanEvents } from '@/lib/stocktake-events';

const MAX_ITEMS = 20000;

export async function GET(request: NextRequest) {
  return withUser(request, 'GET stocktakes', async (client, userId) => {
    const r = await client.query(
      `SELECT s.id, s.name, s.owner_id, s.join_code, s.created_at, s.updated_at, s.finished_at,
              (SELECT COUNT(*) FROM shared_stocktake_items i WHERE i.stocktake_id = s.id)::int AS item_count
       FROM shared_stocktakes s
       WHERE s.owner_id = $1 OR EXISTS (SELECT 1 FROM shared_stocktake_members m WHERE m.stocktake_id = s.id AND m.user_id = $1)
       ORDER BY s.updated_at DESC LIMIT 100`,
      [userId]
    );
    return NextResponse.json({
      success: true,
      stocktakes: r.rows.map((s) => ({
        id: s.id, name: s.name, role: s.owner_id === userId ? 'owner' : 'member',
        joinCode: s.join_code, itemCount: s.item_count,
        createdAt: s.created_at, updatedAt: s.updated_at, finishedAt: s.finished_at,
      })),
    });
  });
}

async function createWithUniqueCode(client: PoolClient, userId: string, name: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const r = await client.query(
      `INSERT INTO shared_stocktakes (owner_id, name, join_code) VALUES ($1, $2, $3)
       ON CONFLICT (join_code) DO NOTHING RETURNING id`,
      [userId, name, generateJoinCode()]
    );
    if (r.rows[0]) return r.rows[0].id;
  }
  throw new Error('join code collision');
}

export async function POST(request: NextRequest) {
  return withUser(request, 'POST stocktakes', async (client, userId) => {
    const body = await readJson(request);
    const name = String(body?.name ?? '').trim().slice(0, 100) || new Date().toISOString().slice(0, 10);
    if (!Array.isArray(body?.items) || body.items.length === 0) return apiError(400, 'INVALID_BODY', '예상 목록(items)이 필요합니다.');
    if (body.items.length > MAX_ITEMS) return apiError(413, 'TOO_MANY', `품목은 ${MAX_ITEMS}개까지입니다.`);

    const byKey = new Map<string, { code_key: string; code: string; name: string; expected: number }>();
    for (const raw of body.items) {
      const code = String(raw?.code ?? '').trim().slice(0, 256);
      const key = codeKey(code);
      if (!key) continue;
      const expected = Math.max(1, Math.min(1_000_000, parseInt(raw?.expected, 10) || 1));
      const prev = byKey.get(key);
      if (prev) prev.expected += expected;
      else byKey.set(key, { code_key: key, code, name: String(raw?.name ?? '').trim().slice(0, 300), expected });
    }
    if (!byKey.size) return apiError(400, 'INVALID_BODY', '올바른 코드가 없습니다.');

    await client.query('BEGIN');
    try {
      const id = await createWithUniqueCode(client, userId, name);
      await client.query(
        `INSERT INTO shared_stocktake_items (stocktake_id, code_key, code, name, expected)
         SELECT $1, x.code_key, x.code, x.name, x.expected
         FROM jsonb_to_recordset($2::jsonb) AS x(code_key text, code text, name text, expected int)`,
        [id, JSON.stringify(Array.from(byKey.values()))]
      );
      if (Array.isArray(body.scans) && body.scans.length) {
        await insertScanEvents(client, id, userId, body.scans);
      }
      await client.query('COMMIT');
      const state = await loadStocktakeState(client, id);
      return NextResponse.json({ success: true, role: 'owner', stocktake: state }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    }
  });
}
