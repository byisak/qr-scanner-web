'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScanData } from '@/types';

export function useSocket(sessionId: string | null, accessToken: string | null | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 토큰 변경 시 기존 스캔 데이터 유지를 위한 ref
  const scansRef = useRef<ScanData[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    // 브라우저에서 현재 접속한 호스트를 자동으로 사용
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
                      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    console.log('🔌 Socket 연결 시도:', socketUrl, '세션:', sessionId);
    console.log('🔌 accessToken:', accessToken ? `${accessToken.substring(0, 30)}...` : 'null');

    const socketIo = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: accessToken ? { token: accessToken } : undefined,
    });

    socketIo.on('connect', () => {
      console.log('✅ Socket 연결 성공:', socketIo.id, accessToken ? '(인증됨)' : '(비인증)');
      setIsConnected(true);
      setError(null);

      // 세션 참가
      socketIo.emit('join-session', { sessionId });
    });

    socketIo.on('session-joined', (data: { sessionId: string; existingData: ScanData[] }) => {
      console.log('✅ 세션 참가 성공:', data.sessionId, '기존 데이터:', data.existingData?.length || 0);
      setScans(data.existingData || []);
      scansRef.current = data.existingData || [];
    });

    socketIo.on('new-scan', (scanData: ScanData) => {
      console.log('📊 새 스캔 데이터:', scanData);
      setScans((prev) => [...prev, scanData]);
      scansRef.current = [...scansRef.current, scanData];
    });

    socketIo.on('disconnect', (reason) => {
      console.warn('⚠️ Socket 연결 해제:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // 서버가 연결을 끊은 경우 재연결 시도
        socketIo.connect();
      }
    });

    socketIo.on('connect_error', (err) => {
      console.error('❌ Socket 연결 오류:', err.message);
      setError(`연결 실패: ${err.message}`);
      setIsConnected(false);
    });

    socketIo.on('error', (error: any) => {
      const errorMsg = error?.message || JSON.stringify(error) || '알 수 없는 오류';
      console.error('❌ Socket 에러:', errorMsg);
      setError(errorMsg);
    });

    setSocket(socketIo);

    return () => {
      console.log('🔌 Socket 연결 종료');
      socketIo.disconnect();
    };
  }, [sessionId, accessToken]); // accessToken도 의존성에 추가하여 토큰 변경 시 재연결

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
