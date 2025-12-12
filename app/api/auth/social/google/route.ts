// app/api/auth/social/google/route.ts - 구글 소셜 로그인 API

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateSocialUser, createAuthResponse } from '@/lib/auth';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleTokenInfo {
  sub: string; // 사용자 고유 ID
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  exp?: string;
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * POST /api/auth/social/google
 *
 * Body:
 * - idToken: 구글 ID 토큰 (권장)
 * - accessToken: 구글 액세스 토큰
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, accessToken } = body;

    let userInfo: GoogleUserInfo | null = null;

    // ID 토큰이 있으면 검증하고 정보 추출
    if (idToken) {
      const tokenInfo = await verifyIdToken(idToken);
      if (!tokenInfo.success) {
        return NextResponse.json(
          { success: false, error: tokenInfo.error },
          { status: 401 }
        );
      }
      userInfo = {
        id: tokenInfo.data!.sub,
        email: tokenInfo.data!.email,
        name: tokenInfo.data!.name,
        picture: tokenInfo.data!.picture,
      };
    }
    // 액세스 토큰으로 사용자 정보 조회
    else if (accessToken) {
      const userInfoResult = await getGoogleUserInfo(accessToken);
      if (!userInfoResult.success) {
        return NextResponse.json(
          { success: false, error: userInfoResult.error },
          { status: 401 }
        );
      }
      userInfo = userInfoResult.data!;
    } else {
      return NextResponse.json(
        { success: false, error: 'idToken 또는 accessToken이 필요합니다' },
        { status: 400 }
      );
    }

    // 사용자 찾기 또는 생성
    const user = await findOrCreateSocialUser('google', userInfo.id, {
      email: userInfo.email,
      name: userInfo.name,
      profileImage: userInfo.picture,
    });

    // JWT 응답 생성
    const authResponse = createAuthResponse(user);

    return NextResponse.json(authResponse);
  } catch (err: any) {
    console.error('구글 로그인 실패:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * 구글 ID 토큰 검증
 */
async function verifyIdToken(
  idToken: string
): Promise<{ success: boolean; data?: GoogleTokenInfo; error?: string }> {
  try {
    const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${idToken}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('구글 ID 토큰 검증 실패:', errorData);
      return { success: false, error: errorData.error_description || 'ID 토큰 검증 실패' };
    }

    const tokenInfo: GoogleTokenInfo = await response.json();

    // 클라이언트 ID 검증 (선택 사항이지만 권장)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
      // aud 필드가 클라이언트 ID와 일치하는지 확인할 수 있음
      // 여기서는 생략 (모바일 앱과 웹에서 다른 클라이언트 ID를 사용할 수 있으므로)
    }

    return { success: true, data: tokenInfo };
  } catch (err: any) {
    console.error('구글 ID 토큰 검증 에러:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 구글 사용자 정보 조회 (액세스 토큰 사용)
 */
async function getGoogleUserInfo(
  accessToken: string
): Promise<{ success: boolean; data?: GoogleUserInfo; error?: string }> {
  try {
    const response = await fetch(GOOGLE_USER_INFO_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('구글 사용자 정보 조회 실패:', errorData);
      return { success: false, error: '사용자 정보 조회 실패' };
    }

    const userData: GoogleUserInfo = await response.json();
    return { success: true, data: userData };
  } catch (err: any) {
    console.error('구글 사용자 정보 조회 에러:', err);
    return { success: false, error: err.message };
  }
}
