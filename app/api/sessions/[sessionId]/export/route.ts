import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
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

    client = await getConnection();

    // 스캔 데이터 조회
    const result = await client.query(
      `SELECT id, session_id, code, scan_timestamp, created_at
       FROM scan_data
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    const scans = result.rows.map((row: any, index: number) => ({
      번호: index + 1,
      'QR 코드': row.code,
      '스캔 시간': row.scan_timestamp
        ? new Date(Number(row.scan_timestamp)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        : '',
      '저장 시간': row.created_at
        ? new Date(row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        : '',
    }));

    if (scans.length === 0) {
      return NextResponse.json({ error: '스캔 데이터가 없습니다.' }, { status: 404 });
    }

    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `session-${sessionId}-${now}`;

    if (format === 'xlsx') {
      // Excel 생성
      const worksheet = XLSX.utils.json_to_sheet(scans);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Scan Data');

      // 열 너비 자동 조정
      const maxWidth = scans.reduce((w: any, r: any) => {
        return Math.max(w, String(r['QR 코드']).length);
      }, 10);
      worksheet['!cols'] = [
        { wch: 8 },  // 번호
        { wch: Math.min(maxWidth, 50) },  // QR 코드
        { wch: 25 }, // 스캔 시간
        { wch: 25 }, // 저장 시간
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    } else {
      // CSV 생성
      const worksheet = XLSX.utils.json_to_sheet(scans);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // UTF-8 BOM 추가 (Excel에서 한글이 깨지지 않도록)
      const utf8BOM = '\uFEFF';
      const csvWithBOM = utf8BOM + csv;

      return new NextResponse(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }
  } catch (err: any) {
    // console.error('데이터 내보내기 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
