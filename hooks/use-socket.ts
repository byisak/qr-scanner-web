'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScanData } from '@/types';
import { getSupabaseBrowserClient, isSupabaseRealtimeEnabled } from '@/lib/supabase-browser';

// 기존 목록에 새 스캔을 id 기준 중복 없이 합친다 (Supabase 재구독 시 초기 데이터와 겹칠 수 있음)
function mergeScans(base: ScanData[], extra: ScanData[]): ScanData[] {
  const seen = new Set(base.map((s) => s.id));
  const merged = [...base];
  for (const scan of extra) {
    if (!seen.has(scan.id)) {
      seen.add(scan.id);
      merged.push(scan);
    }
  }
  return merged;
}

// userId와 authLoading을 직접 받아서 서버로 전달
// enabled: false이면 소켓 연결하지 않음 (비밀번호 보호 세션 등에서 사용)
// auth: 로그인 사용자 JWT(accessToken)와 비밀번호 검증 후 받은 세션 접근 토큰(sessionAccessToken)
//       → 서버가 비밀번호 보호/비공개 세션의 열람 권한을 확인하는 데 사용
export interface SocketAuthOptions {
  accessToken?: string | null;
  sessionAccessToken?: string | null;
}

export function useSocket(
  sessionId: string | null,
  userId: string | null | undefined,
  authLoading: boolean = false,
  enabled: boolean = true,
  auth: SocketAuthOptions = {}
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scansRef = useRef<ScanData[]>([]);
  // userId를 ref로 저장하여 콜백에서 최신 값 사용
  const userIdRef = useRef<string | null | undefined>(userId);
  // 인증 완료 후 첫 연결인지 추적
  const hasJoinedWithAuthRef = useRef(false);
  // 토큰도 ref로 보관 (재연결 시 최신 값 사용)
  const authRef = useRef<SocketAuthOptions>(auth);
  authRef.current = auth;

  const buildJoinPayload = (currentUserId: string | null | undefined) => ({
    sessionId,
    userId: currentUserId || null,
    accessToken: authRef.current.accessToken || undefined,
    sessionAccessToken: authRef.current.sessionAccessToken || undefined,
  });

  // userId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    userIdRef.current = userId;
    // console.log('🔐 userId ref 업데이트:', userId || '(없음)');
  }, [userId]);

  // ============================================
  // Supabase Realtime 모드 (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 설정 시)
  // 초기 데이터 + realtimeKey 는 POST /api/sessions/:id/join, 새 스캔은
  // 채널 scans:{sessionId}:{realtimeKey} 의 broadcast 이벤트 new-scan 으로 받는다.
  // ============================================
  const useSupabase = isSupabaseRealtimeEnabled();

  useEffect(() => {
    if (!useSupabase) return;
    if (!sessionId || !enabled || authLoading) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const join = async (): Promise<{ existingData: ScanData[]; realtimeKey: string | null } | null> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authRef.current.accessToken) headers.Authorization = `Bearer ${authRef.current.accessToken}`;
      const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionAccessToken: authRef.current.sessionAccessToken || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        // 열람 권한 거부 (비밀번호 필요/비공개) → 소켓 session-access-denied 와 동일하게 비움
        if (res.status === 403) {
          setScans([]);
          scansRef.current = [];
        }
        setError(data?.error || `연결 실패: HTTP ${res.status}`);
        return null;
      }
      return { existingData: data.existingData || [], realtimeKey: data.realtimeKey || null };
    };

    (async () => {
      try {
        const joined = await join();
        if (cancelled || !joined) return;
        setScans(joined.existingData);
        scansRef.current = joined.existingData;
        setError(null);
        if (!joined.realtimeKey) return;

        channel = supabase
          .channel(`scans:${sessionId}:${joined.realtimeKey}`, { config: { broadcast: { self: false } } })
          .on('broadcast', { event: 'new-scan' }, ({ payload }) => {
            const scanData = payload as ScanData;
            setScans((prev) => mergeScans(prev, [scanData]));
            scansRef.current = mergeScans(scansRef.current, [scanData]);
          })
          .subscribe(async (status, err) => {
            if (cancelled) return;
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setError(null);
              // 구독 전/재연결 사이에 들어온 스캔을 놓치지 않도록 다시 불러와 합친다
              const refreshed = await join().catch(() => null);
              if (!cancelled && refreshed) {
                setScans((prev) => mergeScans(refreshed.existingData, prev));
                scansRef.current = mergeScans(refreshed.existingData, scansRef.current);
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setIsConnected(false);
              setError(`연결 실패: ${err?.message || status}`);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
            }
          });
      } catch (err) {
        if (!cancelled) {
          setError(`연결 실패: ${err instanceof Error ? err.message : String(err)}`);
          setIsConnected(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setIsConnected(false);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // userId/토큰이 바뀌면 다시 참가 (소켓 모드의 join-session 재전송과 같은 효과)
  }, [useSupabase, sessionId, authLoading, enabled, userId, auth.accessToken, auth.sessionAccessToken]);

  // ============================================
  // Socket.IO 모드 (기존 동작)
  // ============================================
  useEffect(() => {
    if (useSupabase) return;
    if (!sessionId) return;
    // enabled가 false이면 소켓 연결하지 않음
    if (!enabled) {
      // console.log('🔒 접근 권한 없음 - 소켓 연결 차단');
      return;
    }
    // 인증 로딩 중이면 소켓 연결 대기
    if (authLoading) {
      // console.log('⏳ 인증 로딩 중... 소켓 연결 대기');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
                      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    // console.log('🔌 Socket 연결 시도:', socketUrl, '세션:', sessionId);

    const socketIo = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketIo.on('connect', () => {
      // console.log('✅ Socket 연결 성공:', socketIo.id);
      setIsConnected(true);
      setError(null);

      // ref에서 최신 userId 값 읽기
      const currentUserId = userIdRef.current;
      // console.log('🔌 세션 참가 요청 - userId:', currentUserId || '(비로그인)');
      socketIo.emit('join-session', buildJoinPayload(currentUserId));
    });

    socketIo.on('session-joined', (data: { sessionId: string; existingData: ScanData[] }) => {
      // console.log('✅ 세션 참가 성공:', data.sessionId, '기존 데이터:', data.existingData?.length || 0);
      setScans(data.existingData || []);
      scansRef.current = data.existingData || [];
    });

    // 서버가 열람 권한을 거부한 경우 (비밀번호 필요/비공개)
    socketIo.on('session-access-denied', () => {
      setScans([]);
      scansRef.current = [];
    });

    socketIo.on('new-scan', (scanData: ScanData) => {
      // console.log('📊 새 스캔 데이터:', scanData);
      setScans((prev) => [...prev, scanData]);
      scansRef.current = [...scansRef.current, scanData];
    });

    socketIo.on('disconnect', (reason) => {
      // console.warn('⚠️ Socket 연결 해제:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socketIo.connect();
      }
    });

    socketIo.on('connect_error', (err) => {
      // console.error('❌ Socket 연결 오류:', err.message);
      setError(`연결 실패: ${err.message}`);
      setIsConnected(false);
    });

    socketIo.on('error', (error: any) => {
      const errorMsg = error?.message || JSON.stringify(error) || '알 수 없는 오류';
      // console.error('❌ Socket 에러:', errorMsg);
      setError(errorMsg);
    });

    setSocket(socketIo);

    return () => {
      // console.log('🔌 Socket 연결 종료');
      socketIo.disconnect();
    };
  }, [useSupabase, sessionId, authLoading, enabled]); // enabled가 true가 되면 연결

  // userId가 변경되면 세션 재참가
  useEffect(() => {
    if (socket && socket.connected && sessionId) {
      // console.log('🔄 userId 변경 감지 - 세션 재참가:', userId || '(비로그인)');
      socket.emit('join-session', buildJoinPayload(userId));
    }
  }, [socket, sessionId, userId]);

  const clearScans = useCallback(() => {
    setScans([]);
    scansRef.current = [];
  }, []);

  const removeScan = useCallback((scanId: number) => {
    setScans((prev) => prev.filter((scan) => scan.id !== scanId));
    scansRef.current = scansRef.current.filter((scan) => scan.id !== scanId);
  }, []);

  const removeScans = useCallback((scanIds: number[]) => {
    setScans((prev) => prev.filter((scan) => !scanIds.includes(scan.id)));
    scansRef.current = scansRef.current.filter((scan) => !scanIds.includes(scan.id));
  }, []);

  return { socket, scans, isConnected, error, clearScans, removeScan, removeScans };
}
