// lib/auth-middleware.ts - 인증 미들웨어 유틸리티
import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from './auth';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * 인증 필수 미들웨어
 * 인증되지 않은 요청은 401 에러 반환
 */
export function requireAuth(request: NextRequest): AuthenticatedUser | NextResponse {
  const authHeader = request.headers.get('authorization');
  const user = getUserFromRequest(authHeader);

  if (!user) {
    return NextResponse.json(
      createAuthErrorResponse(
        AuthErrorCodes.UNAUTHORIZED,
        '인증이 필요합니다.'
      ),
      { status: 401 }
    );
  }

  return {
    userId: user.userId,
    email: user.email,
  };
}

/**
 * 인증 선택적 미들웨어
 * 인증되지 않아도 요청 계속 진행
 */
export function optionalAuth(request: NextRequest): AuthenticatedUser | null {
  const authHeader = request.headers.get('authorization');
  const user = getUserFromRequest(authHeader);

  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
  };
}

/**
 * 인증 응답인지 확인
 */
export function isAuthError(result: AuthenticatedUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
