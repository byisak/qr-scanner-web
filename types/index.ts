// ============================================
// 사용자 및 인증 타입
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  provider: 'email' | 'kakao' | 'google' | 'apple';
  providerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  accessToken: string;
  idToken?: string; // Apple 로그인용
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// 스캔 데이터 타입
// ============================================

export interface ScanData {
  id: number;
  sessionId: string;
  code: string;
  scan_timestamp: number;
  createdAt: string;
}

export interface Session {
  session_id: string;
  user_id: string | null;
  session_name: string | null;
  created_at: string;
  last_activity: string;
  status: string;
  scan_count: number;
  deleted_at: string | null;
}

export interface SocketEvents {
  'session-created': (data: { sessionId: string; message: string }) => void;
  'session-joined': (data: { sessionId: string; existingData: ScanData[] }) => void;
  'new-scan': (data: ScanData) => void;
  'scan-received': (data: { success: boolean; code: string }) => void;
  error: (data: { message: string }) => void;
}
