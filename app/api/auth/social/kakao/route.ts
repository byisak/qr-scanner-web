// app/api/auth/social/kakao/route.ts - 카카오 소셜 로그인 API

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateSocialUser, createAuthResponse } from '@/lib/auth';

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

/**
 * POST /api/auth/social/kakao
 *
 * Body:
 * - authorizationCode: 카카오 인가 코드 (SDK에서 받은 코드)
 * - accessToken: 카카오 액세스 토큰 (이미 토큰이 있는 경우)
 * - redirectUri: 리다이렉트 URI (인가 코드 사용 시 필요)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorizationCode, accessToken, redirectUri } = body;

    let kakaoAccessToken = accessToken;

    // 인가 코드로 토큰 교환
    if (authorizationCode && !accessToken) {
      const tokenResponse = await exchangeCodeForToken(authorizationCode, redirectUri);
      if (!tokenResponse.success) {
        return NextResponse.json(
          { success: false, error: tokenResponse.error },
          { status: 400 }
        );
      }
      kakaoAccessToken = tokenResponse.accessToken;
    }

    if (!kakaoAccessToken) {
      return NextResponse.json(
        { success: false, error: 'authorizationCode 또는 accessToken이 필요합니다' },
        { status: 400 }
      );
    }

    // 카카오 사용자 정보 조회
    const userInfo = await getKakaoUserInfo(kakaoAccessToken);
    if (!userInfo.success) {
      return NextResponse.json(
        { success: false, error: userInfo.error },
        { status: 401 }
      );
    }

    // 사용자 찾기 또는 생성
    const user = await findOrCreateSocialUser('kakao', String(userInfo.data!.id), {
      email: userInfo.data!.kakao_account?.email,
      name: userInfo.data!.kakao_account?.profile?.nickname,
      profileImage: userInfo.data!.kakao_account?.profile?.profile_image_url,
    });

    // JWT 응답 생성
    const authResponse = createAuthResponse(user);

    return NextResponse.json(authResponse);
  } catch (err: any) {
    console.error('카카오 로그인 실패:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * 카카오 인가 코드를 액세스 토큰으로 교환
 */
async function exchangeCodeForToken(
  authorizationCode: string,
  redirectUri?: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;

  if (!clientId) {
    return { success: false, error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다' };
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: authorizationCode,
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }
    if (redirectUri) {
      params.append('redirect_uri', redirectUri);
    }

    const response = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('카카오 토큰 교환 실패:', errorData);
      return { success: false, error: errorData.error_description || '토큰 교환 실패' };
    }

    const tokenData: KakaoTokenResponse = await response.json();
    return { success: true, accessToken: tokenData.access_token };
  } catch (err: any) {
    console.error('카카오 토큰 교환 에러:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 카카오 사용자 정보 조회
 */
async function getKakaoUserInfo(
  accessToken: string
): Promise<{ success: boolean; data?: KakaoUserInfo; error?: string }> {
  try {
    const response = await fetch(KAKAO_USER_INFO_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('카카오 사용자 정보 조회 실패:', errorData);
      return { success: false, error: '사용자 정보 조회 실패' };
    }

    const userData: KakaoUserInfo = await response.json();
    return { success: true, data: userData };
  } catch (err: any) {
    console.error('카카오 사용자 정보 조회 에러:', err);
    return { success: false, error: err.message };
  }
}
