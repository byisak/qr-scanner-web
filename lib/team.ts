// lib/team.ts - 계정 품목 마스터와 공유 재고 실사의 공통 규칙
import { randomInt } from 'crypto';
import type { PoolClient } from 'pg';

// 앱(utils/itemMaster.js codeKey)과 같은 규칙: 숫자만이면 앞자리 0을 떼고, 아니면 대문자
export function codeKey(code: unknown): string {
  const s = String(code ?? '').trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return s.replace(/^0+(?=\d)/, '');
  return s.toUpperCase();
}

const clip = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export interface ItemInput {
  code: string;
  name: string;
  spec: string;
  unit: string;
  category: string;
  location: string;
  altCodes: string[];
  memo: string;
}

/** 올라온 품목 하나를 검사·정리. 코드나 품명이 없으면 null */
export function cleanItem(raw: any): (ItemInput & { codeKey: string }) | null {
  if (!raw || typeof raw !== 'object') return null;
  const code = clip(raw.code, 256);
  const name = clip(raw.name, 300);
  const key = codeKey(code);
  if (!code || !name || !key) return null;
  const alt = Array.isArray(raw.altCodes) ? raw.altCodes : String(raw.altCodes || '').split(/[;,]/);
  return {
    code,
    codeKey: key,
    name,
    spec: clip(raw.spec, 300),
    unit: clip(raw.unit, 50),
    category: clip(raw.category, 100),
    location: clip(raw.location, 100),
    altCodes: alt.map((c: unknown) => clip(c, 256)).filter(Boolean).slice(0, 20),
    memo: clip(raw.memo, 2000),
  };
}

export function mapItemRow(r: any) {
  return {
    code: r.code,
    name: r.name,
    spec: r.spec,
    unit: r.unit,
    category: r.category,
    location: r.location,
    altCodes: Array.isArray(r.alt_codes) ? r.alt_codes : [],
    memo: r.memo,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  };
}

// 참여 코드: 헷갈리는 글자(0 O 1 I L)를 뺀 6자리
const JOIN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateJoinCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += JOIN_ALPHABET[randomInt(JOIN_ALPHABET.length)];
  return s;
}
export function normalizeJoinCode(v: unknown): string | null {
  const s = String(v ?? '').trim().toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z0-9]{6}$/.test(s) ? s : null;
}

export type StocktakeRole = 'owner' | 'member';

/** 실사에 접근할 수 있으면 역할, 아니면 null (없는 실사도 null) */
export async function stocktakeRole(client: PoolClient, stocktakeId: string, userId: string): Promise<StocktakeRole | null> {
  if (!/^[0-9a-f-]{36}$/i.test(stocktakeId)) return null;
  const r = await client.query(
    `SELECT s.owner_id, m.user_id AS member
     FROM shared_stocktakes s
     LEFT JOIN shared_stocktake_members m ON m.stocktake_id = s.id AND m.user_id = $2
     WHERE s.id = $1`,
    [stocktakeId, userId]
  );
  const row = r.rows[0];
  if (!row) return null;
  if (row.owner_id === userId) return 'owner';
  return row.member ? 'member' : null;
}

/** 실사 현재 상태: 품목별 예상·스캔 합계, 목록 외 코드, 참여자별 스캔 수 */
export async function loadStocktakeState(client: PoolClient, stocktakeId: string) {
  const head = await client.query(
    `SELECT s.id, s.name, s.join_code, s.owner_id, s.created_at, s.updated_at, s.finished_at, u.name AS owner_name
     FROM shared_stocktakes s LEFT JOIN users u ON u.id = s.owner_id WHERE s.id = $1`,
    [stocktakeId]
  );
  if (!head.rows[0]) return null;
  const items = await client.query(
    `SELECT i.code_key, i.code, i.name, i.expected, GREATEST(COALESCE(SUM(sc.qty), 0), 0)::int AS scanned, MAX(sc.scanned_at) AS last_at
     FROM shared_stocktake_items i
     LEFT JOIN shared_stocktake_scans sc ON sc.stocktake_id = i.stocktake_id AND sc.code_key = i.code_key
     WHERE i.stocktake_id = $1
     GROUP BY i.code_key, i.code, i.name, i.expected
     ORDER BY i.code`,
    [stocktakeId]
  );
  const extras = await client.query(
    `SELECT sc.code_key, MIN(sc.code) AS code, SUM(sc.qty)::int AS scanned, MAX(sc.scanned_at) AS last_at
     FROM shared_stocktake_scans sc
     WHERE sc.stocktake_id = $1
       AND NOT EXISTS (SELECT 1 FROM shared_stocktake_items i WHERE i.stocktake_id = sc.stocktake_id AND i.code_key = sc.code_key)
     GROUP BY sc.code_key
     HAVING SUM(sc.qty) <> 0
     ORDER BY MAX(sc.scanned_at) DESC`,
    [stocktakeId]
  );
  const members = await client.query(
    `SELECT u.id, u.name, (u.id = s.owner_id) AS is_owner,
            COALESCE((SELECT SUM(qty) FROM shared_stocktake_scans sc WHERE sc.stocktake_id = s.id AND sc.user_id = u.id AND sc.qty > 0), 0)::int AS scans
     FROM shared_stocktakes s
     JOIN users u ON u.id = s.owner_id OR u.id IN (SELECT user_id FROM shared_stocktake_members WHERE stocktake_id = s.id)
     WHERE s.id = $1
     ORDER BY is_owner DESC, u.name`,
    [stocktakeId]
  );
  const h = head.rows[0];
  const iso = (d: any) => (d instanceof Date ? d.toISOString() : d ?? null);
  return {
    id: h.id,
    name: h.name,
    joinCode: h.join_code,
    ownerId: h.owner_id,
    ownerName: h.owner_name,
    createdAt: iso(h.created_at),
    updatedAt: iso(h.updated_at),
    finishedAt: iso(h.finished_at),
    items: items.rows.map((r) => ({ codeKey: r.code_key, code: r.code, name: r.name, expected: r.expected, scanned: r.scanned, lastAt: iso(r.last_at) })),
    extras: extras.rows.map((r) => ({ codeKey: r.code_key, code: r.code, scanned: r.scanned, lastAt: iso(r.last_at) })),
    members: members.rows.map((r) => ({ id: r.id, name: r.name, isOwner: r.is_owner, scans: r.scans })),
  };
}

export function isMissingTable(err: unknown): boolean {
  return (err as { code?: string })?.code === '42P01';
}
