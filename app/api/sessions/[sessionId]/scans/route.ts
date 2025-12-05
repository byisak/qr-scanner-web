import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const scanDataStore = (global as any).scanDataStore || new Map();
    const scans = scanDataStore.get(sessionId) || [];

    return NextResponse.json(scans);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
