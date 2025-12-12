// app/api/auth/social/apple/route.ts - 애플 소셜 로그인 API

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateSocialUser, createAuthResponse } from '@/lib/auth';
import crypto from 'crypto';

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';

interface AppleIDTokenPayload {
  iss: string;
  sub: string; // 사용자 고유 ID (애플에서 발급)
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  auth_time?: number;
  nonce_supported?: boolean;
}

interface AppleUser {
  name?: {
    firstName?: string;
    lastName?: string;
  };
  email?: string;
}

/**
 * POST /api/auth/social/apple
 *
 * Body:
 * - identityToken: 애플 ID 토큰 (필수)
 * - authorizationCode: 애플 인가 코드 (선택)
 * - user: 사용자 정보 (최초 로그인 시에만 제공됨)
 *   - name: { firstName, lastName }
 *   - email: 이메일 (사용자가 공유한 경우)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityToken, user } = body as {
      identityToken: string;
      authorizationCode?: string;
      user?: AppleUser;
    };

    if (!identityToken) {
      return NextResponse.json(
        { success: false, error: 'identityToken이 필요합니다' },
        { status: 400 }
      );
    }

    // 애플 ID 토큰 검증 및 디코딩
    const tokenResult = await verifyAppleIdToken(identityToken);
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 401 }
      );
    }

    const tokenPayload = tokenResult.data!;

    // 사용자 이름 조합 (최초 로그인 시에만 user 정보가 전달됨)
    let userName: string | undefined;
    if (user?.name) {
      const parts = [user.name.firstName, user.name.lastName].filter(Boolean);
      userName = parts.length > 0 ? parts.join(' ') : undefined;
    }

    // 이메일 (토큰 또는 user 객체에서)
    const email = tokenPayload.email || user?.email;

    // 사용자 찾기 또는 생성
    const socialUser = await findOrCreateSocialUser('apple', tokenPayload.sub, {
      email,
      name: userName,
      // 애플은 프로필 이미지를 제공하지 않음
    });

    // JWT 응답 생성
    const authResponse = createAuthResponse(socialUser);

    return NextResponse.json(authResponse);
  } catch (err: any) {
    console.error('애플 로그인 실패:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * 애플 ID 토큰 검증
 * 참고: 실제 프로덕션에서는 애플 공개 키로 서명을 검증해야 함
 */
async function verifyAppleIdToken(
  idToken: string
): Promise<{ success: boolean; data?: AppleIDTokenPayload; error?: string }> {
  try {
    // JWT 구조 분해
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      return { success: false, error: '잘못된 ID 토큰 형식' };
    }

    const [headerB64, payloadB64] = parts;

    // 헤더 디코딩
    const header = JSON.parse(
      Buffer.from(headerB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    // 페이로드 디코딩
    const payload: AppleIDTokenPayload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    // 기본 검증
    if (payload.iss !== 'https://appleid.apple.com') {
      return { success: false, error: '잘못된 발급자 (iss)' };
    }

    // 만료 시간 검증
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { success: false, error: 'ID 토큰이 만료되었습니다' };
    }

    // 참고: 실제 프로덕션에서는 여기서 서명을 검증해야 함
    // 애플 공개 키를 가져와서 RS256 서명 검증
    // const verified = await verifySignature(idToken, header.kid);

    return { success: true, data: payload };
  } catch (err: any) {
    console.error('애플 ID 토큰 검증 에러:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 애플 공개 키 조회 (프로덕션용 서명 검증 시 사용)
 */
async function getApplePublicKeys(): Promise<any[]> {
  try {
    const response = await fetch(APPLE_KEYS_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch Apple public keys');
    }
    const data = await response.json();
    return data.keys || [];
  } catch (err) {
    console.error('애플 공개 키 조회 실패:', err);
    return [];
  }
}
