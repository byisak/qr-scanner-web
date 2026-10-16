// lib/realtime.ts - 새 스캔 실시간 알림
//
// 1) Supabase Realtime Broadcast (Vercel + Supabase)
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 있으면 REST 브로드캐스트 엔드포인트로 보낸다.
//    채널(topic): scans:{sessionId}:{realtimeKey}, 이벤트: new-scan
//    형식은 @supabase/realtime-js RealtimeChannel.send() 의 REST 경로와 같다
//    (POST {SUPABASE_URL}/realtime/v1/api/broadcast, body { messages: [{ topic, event, payload, private }] }).
// 2) Socket.IO (Vultr server.ts 로 실행 중일 때)
//    server.ts 가 globalThis 에 등록한 io 인스턴스로 방 sessionId 에 new-scan 을 보낸다.
// 실패는 로그만 남기고 요청은 실패시키지 않는다.
import type { ScanRecord } from './session-service';

interface SocketEmitter {
  to(room: string): { emit(event: string, payload: unknown): unknown };
}

const SOCKET_GLOBAL_KEY = '__scanviewSocketIO';
const BROADCAST_TIMEOUT_MS = 5000;

/** server.ts 에서 Socket.IO 서버를 등록할 때 사용 */
export function registerSocketServer(io: SocketEmitter): void {
  (globalThis as Record<string, unknown>)[SOCKET_GLOBAL_KEY] = io;
}

function getSocketServer(): SocketEmitter | null {
  const io = (globalThis as Record<string, unknown>)[SOCKET_GLOBAL_KEY];
  return io ? (io as SocketEmitter) : null;
}

export function realtimeTopic(sessionId: string, realtimeKey: string): string {
  return `scans:${sessionId}:${realtimeKey}`;
}

async function sendSupabaseBroadcast(sessionId: string, realtimeKey: string, scan: ScanRecord): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || !realtimeKey) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BROADCAST_TIMEOUT_MS);
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: realtimeTopic(sessionId, realtimeKey),
            event: 'new-scan',
            payload: scan,
            private: false,
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[realtime] Supabase broadcast 실패: HTTP ${res.status}`);
    }
    await res.body?.cancel().catch(() => {});
  } catch (err) {
    console.error('[realtime] Supabase broadcast 오류:', err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 새 스캔을 웹 화면에 알린다. 절대 throw 하지 않는다.
 */
export async function broadcastNewScan(
  sessionId: string,
  realtimeKey: string | null,
  scan: ScanRecord
): Promise<void> {
  try {
    getSocketServer()?.to(sessionId).emit('new-scan', scan);
  } catch (err) {
    console.error('[realtime] Socket.IO emit 오류:', err instanceof Error ? err.message : err);
  }
  if (realtimeKey) {
    await sendSupabaseBroadcast(sessionId, realtimeKey, scan);
  }
}
