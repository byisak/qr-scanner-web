'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScanData } from '@/types';

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

  useEffect(() => {
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
  }, [sessionId, authLoading, enabled]); // enabled가 true가 되면 연결

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
