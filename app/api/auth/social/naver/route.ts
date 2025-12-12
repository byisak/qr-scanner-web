// app/api/auth/social/naver/route.ts - 네이버 소셜 로그인 API

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateSocialUser, createAuthResponse } from '@/lib/auth';

const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_USER_INFO_URL = 'https://openapi.naver.com/v1/nid/me';

interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
}

interface NaverUserInfo {
  response: {
    id: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
    name?: string;
  };
}

/**
 * POST /api/auth/social/naver
 *
 * Body:
 * - authorizationCode: 네이버 인가 코드
 * - accessToken: 네이버 액세스 토큰 (이미 토큰이 있는 경우)
 * - state: 상태 값 (CSRF 방지용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorizationCode, accessToken, state } = body;

    let naverAccessToken = accessToken;

    // 인가 코드로 토큰 교환
    if (authorizationCode && !accessToken) {
      const tokenResponse = await exchangeCodeForToken(authorizationCode, state);
      if (!tokenResponse.success) {
        return NextResponse.json(
          { success: false, error: tokenResponse.error },
          { status: 400 }
        );
      }
      naverAccessToken = tokenResponse.accessToken;
    }

    if (!naverAccessToken) {
      return NextResponse.json(
        { success: false, error: 'authorizationCode 또는 accessToken이 필요합니다' },
        { status: 400 }
      );
    }

    // 네이버 사용자 정보 조회
    const userInfo = await getNaverUserInfo(naverAccessToken);
    if (!userInfo.success) {
      return NextResponse.json(
        { success: false, error: userInfo.error },
        { status: 401 }
      );
    }

    // 사용자 찾기 또는 생성
    const user = await findOrCreateSocialUser('naver', userInfo.data!.response.id, {
      email: userInfo.data!.response.email,
      name: userInfo.data!.response.name || userInfo.data!.response.nickname,
      profileImage: userInfo.data!.response.profile_image,
    });

    // JWT 응답 생성
    const authResponse = createAuthResponse(user);

    return NextResponse.json(authResponse);
  } catch (err: any) {
    console.error('네이버 로그인 실패:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * 네이버 인가 코드를 액세스 토큰으로 교환
 */
async function exchangeCodeForToken(
  authorizationCode: string,
  state?: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: 'NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다' };
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
    });

    if (state) {
      params.append('state', state);
    }

    const response = await fetch(NAVER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('네이버 토큰 교환 실패:', errorData);
      return { success: false, error: errorData.error_description || '토큰 교환 실패' };
    }

    const tokenData: NaverTokenResponse = await response.json();
    return { success: true, accessToken: tokenData.access_token };
  } catch (err: any) {
    console.error('네이버 토큰 교환 에러:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 네이버 사용자 정보 조회
 */
async function getNaverUserInfo(
  accessToken: string
): Promise<{ success: boolean; data?: NaverUserInfo; error?: string }> {
  try {
    const response = await fetch(NAVER_USER_INFO_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('네이버 사용자 정보 조회 실패:', errorData);
      return { success: false, error: '사용자 정보 조회 실패' };
    }

    const userData: NaverUserInfo = await response.json();
    return { success: true, data: userData };
  } catch (err: any) {
    console.error('네이버 사용자 정보 조회 에러:', err);
    return { success: false, error: err.message };
  }
}
