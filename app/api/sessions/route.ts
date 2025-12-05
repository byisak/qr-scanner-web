import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const activeSessions = (global as any).activeSessions || new Map();
    const scanDataStore = (global as any).scanDataStore || new Map();

    const sessions = Array.from(activeSessions.entries()).map((entry) => {
      const [sessionId, data] = entry as [string, any];
      const scans = scanDataStore.get(sessionId) || [];
      return {
        session_id: sessionId,
        created_at: data.createdAt.toISOString(),
        last_activity: data.lastActivity.toISOString(),
        status: 'ACTIVE',
        scan_count: scans.length,
      };
    });

    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
