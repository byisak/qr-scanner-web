import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getRequestUser, isAdminUser, unauthorizedResponse } from '@/lib/session-access';
import type { PoolClient } from 'pg';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv 또는 xlsx

    // 보안: 이전에는 세션 ID만 알면 비로그인으로 전체 스캔 데이터를 내려받을 수 있었다.
    // 로그인 필수. 세션 소유자/관리자는 전체, 그 외 로그인 사용자는 본인이 스캔한 데이터만
    // (세션 페이지에서 로그인 사용자에게 보여주는 범위와 동일).
    const user = getRequestUser(request);
    if (!user) {
      return unauthorizedResponse('데이터를 내보내려면 로그인이 필요합니다.');
    }

    client = await getConnection();

    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }
    const isOwner = sessionResult.rows[0].user_id === user.userId;
    const canExportAll = isOwner || (await isAdminUser(client, user.userId));

    // 보이는 대로 내보내기:
    //  view=scans(기본) 스캔 기록 / view=summary 코드별 합계
    //  q=검색어 (화면의 코드 검색과 같은 부분 일치, 대소문자 무시)
    //  lang=열 이름 언어, name=파일 이름에 쓸 세션 이름
    const view = searchParams.get('view') === 'summary' ? 'summary' : 'scans';
    const q = (searchParams.get('q') || '').slice(0, 200);
    const lang = EXPORT_LABELS[searchParams.get('lang') || ''] ? searchParams.get('lang')! : 'ko';
    const L = EXPORT_LABELS[lang];

    const conditions = ['session_id = $1'];
    const values: unknown[] = [sessionId];
    if (!canExportAll) {
      values.push(user.userId);
      conditions.push(`user_id = $${values.length}`);
    }
    if (q) {
      values.push(`%${q.replace(/[\\%_]/g, (c) => '\\' + c)}%`);
      conditions.push(`code ILIKE $${values.length}`);
    }
    // since=밀리초: 그 시각 이후 스캔만 (화면의 기간 필터와 같은 기준)
    const since = Number(searchParams.get('since'));
    if (Number.isFinite(since) && since > 0) {
      values.push(since);
      conditions.push(`scan_timestamp >= $${values.length}`);
    }
    const where = conditions.join(' AND ');

    let rows: Record<string, string | number>[];
    let widths: number[];
    if (view === 'summary') {
      // 코드별: 횟수, 처음·마지막 스캔, 2초 안에 다시 찍힌 횟수(빠른 재스캔)
      const result = await client.query(
        `WITH s AS (
           SELECT code, scan_timestamp,
                  scan_timestamp - LAG(scan_timestamp) OVER (PARTITION BY code ORDER BY scan_timestamp) AS gap
           FROM scan_data WHERE ${where}
         )
         SELECT code, COUNT(*)::int AS count,
                MIN(scan_timestamp) AS first_ts, MAX(scan_timestamp) AS last_ts,
                COUNT(*) FILTER (WHERE gap IS NOT NULL AND gap < 2000)::int AS rapid
         FROM s GROUP BY code ORDER BY count DESC, last_ts DESC`,
        values
      );
      rows = result.rows.map((r) => ({
        [L.code]: safeCell(r.code),
        [L.count]: r.count,
        [L.first]: formatTs(r.first_ts),
        [L.last]: formatTs(r.last_ts),
        [L.rapid]: r.rapid,
      }));
      widths = [Math.min(maxLen(result.rows.map((r) => r.code)), 60), 8, 22, 22, 12];
    } else {
      const result = await client.query(
        `SELECT code, scan_timestamp FROM scan_data WHERE ${where} ORDER BY id ASC`,
        values
      );
      rows = result.rows.map((r, i) => ({
        [L.number]: i + 1,
        [L.code]: safeCell(r.code),
        [L.scanTime]: formatTs(r.scan_timestamp),
      }));
      widths = [8, Math.min(maxLen(result.rows.map((r) => r.code)), 60), 22];
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: '스캔 데이터가 없습니다.' }, { status: 404 });
    }

    // 파일 이름: 세션 이름(없으면 ID)_코드별_날짜. 한글은 filename* 로 보낸다
    const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const baseName = (searchParams.get('name') || sessionId).replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim().slice(0, 60) || sessionId;
    const filename = `${baseName}${view === 'summary' ? `_${L.summarySuffix}` : ''}_${day}`;
    const disposition = (ext: string) =>
      `attachment; filename="session-${sessionId}-${day}.${ext}"; filename*=UTF-8''${encodeURIComponent(`${filename}.${ext}`)}`;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    if (format === 'xlsx') {
      worksheet['!cols'] = widths.map((wch) => ({ wch }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, view === 'summary' ? 'Summary' : 'Scan Data');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': disposition('xlsx'),
        },
      });
    }

    // CSV: UTF-8 BOM (Excel에서 한글이 깨지지 않도록)
    const csv = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': disposition('csv'),
      },
    });
  } catch (err) {
    console.error('데이터 내보내기 실패:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: '내보내기에 실패했습니다.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 열 이름 (화면 언어)
const EXPORT_LABELS: Record<string, Record<'number' | 'code' | 'scanTime' | 'count' | 'first' | 'last' | 'rapid' | 'summarySuffix', string>> = {
  ko: { number: '번호', code: '코드', scanTime: '스캔 시간', count: '횟수', first: '처음 스캔', last: '마지막 스캔', rapid: '빠른 재스캔', summarySuffix: '코드별' },
  en: { number: 'No.', code: 'Code', scanTime: 'Scanned at', count: 'Count', first: 'First scan', last: 'Last scan', rapid: 'Quick rescans', summarySuffix: 'by-code' },
  ja: { number: '番号', code: 'コード', scanTime: 'スキャン日時', count: '回数', first: '最初のスキャン', last: '最後のスキャン', rapid: '短時間の再スキャン', summarySuffix: 'コード別' },
  zh: { number: '序号', code: '码值', scanTime: '扫描时间', count: '次数', first: '首次扫描', last: '最后扫描', rapid: '快速重复扫描', summarySuffix: '按码汇总' },
  es: { number: 'N.º', code: 'Código', scanTime: 'Escaneado', count: 'Veces', first: 'Primer escaneo', last: 'Último escaneo', rapid: 'Reescaneos rápidos', summarySuffix: 'por-codigo' },
};

// 스캔 시각(밀리초)을 한국 시간 문자열로
function formatTs(ts: string | number | null): string {
  if (!ts) return '';
  return new Date(Number(ts)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

// 엑셀이 수식으로 실행하지 않도록 =, +, -, @, 탭, CR 로 시작하는 값 앞에 작은따옴표
function safeCell(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

function maxLen(values: string[]): number {
  return values.reduce((w, v) => Math.max(w, String(v).length), 10);
}
