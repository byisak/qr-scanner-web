'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScanData } from '@/types';

export function useSocket(sessionId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket', 'polling'],
    });

    socketIo.on('connect', () => {
      console.log('Socket 연결됨:', socketIo.id);
      setIsConnected(true);

      // 세션 참가
      socketIo.emit('join-session', sessionId);
    });

    socketIo.on('session-joined', (data: { sessionId: string; existingData: ScanData[] }) => {
      console.log('세션 참가 성공:', data.sessionId);
      setScans(data.existingData || []);
    });

    socketIo.on('new-scan', (scanData: ScanData) => {
      console.log('새 스캔 데이터:', scanData);
      setScans((prev) => [...prev, scanData]);
    });

    socketIo.on('disconnect', () => {
      console.log('Socket 연결 해제');
      setIsConnected(false);
    });

    socketIo.on('error', (error: { message: string }) => {
      console.error('Socket 에러:', error);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [sessionId]);

  const clearScans = useCallback(() => {
    setScans([]);
  }, []);

  return { socket, scans, isConnected, clearScans };
}
