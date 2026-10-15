// lib/api-response.ts - REST 계약(docs/REALTIME_REST_CONTRACT.md) 실패 응답 형식
// { success: false, error: "<메시지>", code: "<ERROR_CODE>" } + HTTP 상태 코드
import { NextResponse } from 'next/server';

export function apiError(status: number, code: string, error: string) {
  return NextResponse.json({ success: false, error, code }, { status });
}
