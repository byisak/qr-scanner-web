// lib/stocktake-events.ts - 공유 실사 스캔 기록 넣기 (같은 client_id 는 한 번만)
import type { PoolClient } from 'pg';
import { codeKey } from './team';

export const MAX_EVENTS = 500;

export interface ScanEventInput {
  clientId: string;
  code: string;
  itemCode?: string; // 앱이 품목과 맞춘 코드(박스 바코드·GTIN 등으로 찾은 경우). 없으면 code
  qty: number;
  scannedAt?: string | number;
}

/** 검사 후 넣은 개수를 돌려준다. 잘못된 항목은 건너뛴다 */
export async function insertScanEvents(client: PoolClient, stocktakeId: string, userId: string, events: unknown[]): Promise<number> {
  const rows = [];
  for (const raw of events.slice(0, MAX_EVENTS) as any[]) {
    const clientId = String(raw?.clientId ?? '').trim().slice(0, 64);
    const code = String(raw?.code ?? '').trim().slice(0, 4096);
    const key = codeKey(raw?.itemCode || code);
    const qty = parseInt(raw?.qty, 10);
    if (!clientId || !code || !key || !Number.isFinite(qty) || qty === 0 || Math.abs(qty) > 100000) continue;
    const t = raw?.scannedAt ? new Date(raw.scannedAt) : new Date();
    const scannedAt = Number.isNaN(t.getTime()) ? new Date() : t;
    rows.push({ client_id: clientId, code, code_key: key.slice(0, 256), qty, scanned_at: scannedAt.toISOString() });
  }
  if (!rows.length) return 0;
  const r = await client.query(
    `INSERT INTO shared_stocktake_scans (stocktake_id, client_id, user_id, code, code_key, qty, scanned_at)
     SELECT $1, x.client_id, $2, x.code, x.code_key, x.qty, x.scanned_at
     FROM jsonb_to_recordset($3::jsonb) AS x(client_id text, code text, code_key text, qty int, scanned_at timestamptz)
     ON CONFLICT (stocktake_id, client_id) DO NOTHING`,
    [stocktakeId, userId, JSON.stringify(rows)]
  );
  await client.query(`UPDATE shared_stocktakes SET updated_at = NOW() WHERE id = $1`, [stocktakeId]);
  return r.rowCount || 0;
}
