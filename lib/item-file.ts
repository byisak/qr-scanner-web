// lib/item-file.ts - 브라우저에서 품목 엑셀(.xlsx)·CSV 읽기. 앱(utils/itemImport.js)과 같은 규칙:
// 첫 줄이 열 이름이면 자동으로 맞추고, 아니면 1열 = 코드, 2열 = 품명. CSV는 UTF-8/EUC-KR 자동 구분.
import * as XLSX from 'xlsx';

export const ITEM_FIELDS = ['code', 'name', 'spec', 'unit', 'category', 'location', 'altCodes', 'memo'] as const;
export type ItemField = (typeof ITEM_FIELDS)[number];

export interface ItemRecord {
  code: string;
  name: string;
  spec?: string;
  unit?: string;
  category?: string;
  location?: string;
  altCodes?: string[];
  memo?: string;
}

const HEADER_ALIASES: Record<ItemField, string[]> = {
  code: ['코드', '바코드', '상품코드', '품목코드', '바코드번호', 'code', 'barcode', 'sku', 'ean', 'upc', 'gtin', 'jan', 'コード', 'バーコード', '条码', '条形码', '编码', 'código', 'codigo', 'códigodebarras'],
  name: ['품명', '상품명', '품목명', '제품명', '이름', 'name', 'item', 'itemname', 'product', 'productname', 'description', '品名', '商品名', '名称', '名前', 'nombre', 'producto'],
  spec: ['규격', '옵션', '사양', 'spec', 'specification', 'option', 'variant', '規格', '规格', 'especificación', 'variante'],
  unit: ['단위', 'unit', 'uom', '単位', '单位', 'unidad'],
  category: ['분류', '카테고리', '구분', 'category', 'group', 'カテゴリ', '分类', '類別', 'categoría', 'categoria'],
  location: ['위치', '로케이션', '보관위치', '창고위치', 'location', 'bin', 'place', 'ロケーション', '位置', '库位', 'ubicación', 'ubicacion'],
  altCodes: ['대체코드', '박스코드', '추가코드', '보조코드', 'altcode', 'altcodes', 'alternatecode', 'boxcode', '代替コード', '箱码', 'códigoalternativo'],
  memo: ['메모', '비고', 'memo', 'note', 'notes', 'remark', 'メモ', '备注', 'nota', 'notas'],
};
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/[\s_\-.]/g, '');
const ALIAS = new Map<string, ItemField>();
(Object.keys(HEADER_ALIASES) as ItemField[]).forEach((f) => HEADER_ALIASES[f].forEach((a) => ALIAS.set(norm(a), f)));

export const looksScientific = (s: string) => /^\d(\.\d+)?e\+?\d+$/i.test(s.trim());

function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('euc-kr').decode(buf); // 한국어 엑셀의 기본 CSV
  }
}

function rowsFromWorkbook(wb: XLSX.WorkBook): string[][] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws['!ref']) return [];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) { row.push(''); continue; }
      if (cell.t === 'n' && Number.isFinite(cell.v)) {
        // 숫자 칸(바코드)은 정수 그대로 (8.80123E+12 로 바뀌지 않게)
        row.push(Number.isInteger(cell.v) && Math.abs(cell.v as number) < 1e16 ? String(cell.v) : String(cell.w ?? cell.v));
      } else {
        row.push(String(cell.w ?? cell.v ?? '').trim());
      }
    }
    if (row.some((v) => v !== '')) rows.push(row);
  }
  return rows;
}

export async function readItemRows(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  if (/\.(xlsx|xlsm|xls)$/i.test(file.name)) return rowsFromWorkbook(XLSX.read(buf, { type: 'array' }));
  const text = decodeText(buf);
  // CSV·TSV: 문자열 그대로(숫자로 바꾸지 않게) 읽는다
  return rowsFromWorkbook(XLSX.read(text, { type: 'string', raw: true }));
}

export function detectMapping(rows: string[][]): { hasHeader: boolean; mapping: (ItemField | null)[] } {
  const first = rows[0] || [];
  const mapped = first.map((h) => ALIAS.get(norm(h)) || null);
  if (mapped.includes('code')) {
    const seen = new Set<ItemField>();
    return { hasHeader: true, mapping: mapped.map((f) => (f && !seen.has(f) ? (seen.add(f), f) : null)) };
  }
  const width = Math.max(0, ...rows.slice(0, 20).map((r) => r.length));
  return { hasHeader: false, mapping: Array.from({ length: width }, (_, i) => (i === 0 ? 'code' : i === 1 ? 'name' : null)) };
}

export interface BuildResult {
  records: ItemRecord[];
  errors: { line: number; reason: 'noCode' | 'scientific' | 'noName'; value: string }[];
}

export function buildRecords(rows: string[][], mapping: (ItemField | null)[], hasHeader: boolean): BuildResult {
  const body = hasHeader ? rows.slice(1) : rows;
  const byCode = new Map<string, ItemRecord>();
  const errors: BuildResult['errors'] = [];
  body.forEach((row, i) => {
    const line = i + (hasHeader ? 2 : 1);
    const rec: Record<string, any> = {};
    mapping.forEach((f, col) => {
      if (!f) return;
      const v = String(row[col] ?? '').trim();
      rec[f] = f === 'altCodes' ? (v ? v.split(/[;,]/).map((x) => x.trim()).filter(Boolean) : []) : v;
    });
    if (!rec.code) return void errors.push({ line, reason: 'noCode', value: rec.name || '' });
    if (looksScientific(rec.code)) return void errors.push({ line, reason: 'scientific', value: rec.code });
    if (!rec.name) return void errors.push({ line, reason: 'noName', value: rec.code });
    byCode.set(rec.code, rec as ItemRecord);
  });
  return { records: Array.from(byCode.values()), errors };
}

export function itemsToXlsx(items: ItemRecord[], headers: string[]): Blob {
  const rows = [headers, ...items.map((it) => [it.code, it.name, it.spec || '', it.unit || '', it.category || '', it.location || '', (it.altCodes || []).join(';'), it.memo || ''])];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  for (let r = 1; r < rows.length; r++) {
    for (const c of [0, 6]) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) { ws[ref].t = 's'; ws[ref].v = String(rows[r][c]); ws[ref].z = '@'; }
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Items');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
