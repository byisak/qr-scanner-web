import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const scanDataStore = (global as any).scanDataStore || new Map();
    const scans = scanDataStore.get(params.sessionId) || [];

    return NextResponse.json(scans);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
