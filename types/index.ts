export interface ScanData {
  id: number;
  sessionId: string;
  code: string;
  scan_timestamp: number;
  createdAt: string;
}

export interface Session {
  session_id: string;
  created_at: string;
  last_activity: string;
  status: string;
  scan_count: number;
}

export interface SocketEvents {
  'session-created': (data: { sessionId: string; message: string }) => void;
  'session-joined': (data: { sessionId: string; existingData: ScanData[] }) => void;
  'new-scan': (data: ScanData) => void;
  'scan-received': (data: { success: boolean; code: string }) => void;
  error: (data: { message: string }) => void;
}
