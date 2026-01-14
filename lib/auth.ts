// lib/auth.ts - 인증 유틸리티
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// 환경 변수에서 시크릿 키 가져오기
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_ACCESS_EXPIRY = 60 * 60; // 1시간 (초)
const JWT_REFRESH_EXPIRY = 30 * 24 * 60 * 60; // 30일 (초)

// ============================================
// JWT 토큰 관련 함수
// ============================================

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Base64 URL 인코딩
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL 디코딩
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * JWT 서명 생성
 */
function createSignature(header: string, payload: string): string {
  const hmac = createHmac('sha256', JWT_SECRET);
  hmac.update(`${header}.${payload}`);
  return base64UrlEncode(hmac.digest('base64'));
}

/**
 * Access Token 생성
 */
export function generateAccessToken(userId: string, email: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({
    userId,
    email,
    iat: now,
    exp: now + JWT_ACCESS_EXPIRY,
  }));
  const signature = createSignature(header, payload);
  return `${header}.${payload}.${signature}`;
}

/**
 * Refresh Token 생성
 */
export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Refresh Token 만료 시간 계산
 */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + JWT_REFRESH_EXPIRY * 1000);
}

/**
 * JWT 토큰 검증
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // console.log('❌ JWT 검증 실패: 잘못된 토큰 형식 (parts:', parts.length, ')');
      return null;
    }

    const [header, payload, signature] = parts;

    // 서명 검증
    const expectedSignature = createSignature(header, payload);
    if (signature !== expectedSignature) {
      // console.log('❌ JWT 검증 실패: 서명 불일치');
      return null;
    }

    // 페이로드 파싱
    const decoded = JSON.parse(base64UrlDecode(payload)) as JWTPayload;

    // 만료 시간 확인
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      // console.log('❌ JWT 검증 실패: 토큰 만료 (exp:', decoded.exp, 'now:', now, ')');
      return null;
    }

    // console.log('✅ JWT 검증 성공:', { userId: decoded.userId, email: decoded.email });
    return decoded;
  } catch (e) {
    // console.log('❌ JWT 검증 실패: 예외 발생', e);
    return null;
  }
}

// ============================================
// 비밀번호 해싱 관련 함수
// ============================================

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * 비밀번호 해싱 (scrypt 사용)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 비밀번호 검증
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    const hashBuffer = Buffer.from(hash, 'hex');
    const derivedKey = scryptSync(password, salt, KEY_LENGTH);
    return timingSafeEqual(hashBuffer, derivedKey);
  } catch {
    return false;
  }
}

// ============================================
// 헤더에서 토큰 추출
// ============================================

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * 요청에서 사용자 정보 추출
 */
export function getUserFromRequest(authHeader: string | null): JWTPayload | null {
  const token = extractBearerToken(authHeader);
  if (!token) {
    return null;
  }
  return verifyAccessToken(token);
}

// ============================================
// 비밀번호 재설정 토큰
// ============================================

const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1시간 (밀리초)

/**
 * 비밀번호 재설정 토큰 생성
 */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 비밀번호 재설정 토큰 만료 시간 계산
 */
export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRY);
}

// ============================================
// 에러 코드
// ============================================

export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
  VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
  RESET_TOKEN_EXPIRED: 'AUTH_RESET_TOKEN_EXPIRED',
  RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
} as const;

export type AuthErrorCode = typeof AuthErrorCodes[keyof typeof AuthErrorCodes];

/**
 * 인증 에러 응답 생성
 */
export function createAuthErrorResponse(code: AuthErrorCode, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
