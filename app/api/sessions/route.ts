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
        created_at: data.createdAt ? data.createdAt.toISOString() : new Date().toISOString(),
        last_activity: data.lastActivity ? data.lastActivity.toISOString() : new Date().toISOString(),
        status: 'ACTIVE',
        scan_count: scans.length,
      };
    });

    // Sort by last_activity DESC
    sessions.sort((a, b) =>
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );

    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error('세션 목록 조회 실패:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
