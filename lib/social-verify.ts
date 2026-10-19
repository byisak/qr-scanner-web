// lib/social-verify.ts - 소셜 로그인 토큰 서명/클레임 검증
//
// 보안: 이전에는 Apple ID 토큰을 Base64 디코딩만 하고 서명을 확인하지 않아
// 누구나 임의의 sub/email로 토큰을 위조해 다른 사용자로 로그인할 수 있었다.
// Google도 aud(클라이언트 ID)를 확인하지 않아 다른 앱용으로 발급된 토큰을 받아들였다.
// 여기서는 제공자 공개키(JWKS)로 서명을 검증하고 iss/aud/exp를 반드시 확인한다.
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

// --------------------------------------------
// 허용 audience 목록
// --------------------------------------------

function parseList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

// iOS 앱 번들 ID (모바일 app.json의 ios.bundleIdentifier). 공개 값이므로 기본값으로 둔다.
// iOS 앱 번들 ID 와 웹 로그인용 Services ID (Apple Developer, Return URL: https://scanview.app/api/auth/social/apple/callback)
const DEFAULT_APPLE_AUDIENCES = ['com.cubion.qrscanner', 'com.cubion.qrscanner.web'];

// 모바일 앱(app.json extra.google)에서 사용하는 OAuth 클라이언트 ID. 공개 값이므로 기본값으로 둔다.
const DEFAULT_GOOGLE_CLIENT_IDS = [
  '585698187056-3tqjnjbcdidddn9ddvp2opp0mgj7tgd4.apps.googleusercontent.com', // web
  '585698187056-rfr4k7k4vkb9rjhngb0tdnh5afqgogot.apps.googleusercontent.com', // ios
  '585698187056-c245sfancbg2e2djpjn6q0j945f0muff.apps.googleusercontent.com', // android
];

/**
 * Apple 허용 audience
 * - APPLE_CLIENT_IDS (쉼표 구분) 가 설정되면 그 값을 사용
 * - 웹 로그인용 Service ID(NEXT_PUBLIC_APPLE_CLIENT_ID)는 자동 포함
 */
export function getAppleAudiences(): string[] {
  const configured = parseList(process.env.APPLE_CLIENT_IDS);
  const base = configured.length > 0 ? configured : DEFAULT_APPLE_AUDIENCES;
  const web = parseList(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID);
  return Array.from(new Set([...base, ...web]));
}

/**
 * Google 허용 audience
 * - GOOGLE_CLIENT_IDS (쉼표 구분) 가 설정되면 그 값을 사용
 * - 웹 로그인용 클라이언트 ID(NEXT_PUBLIC_GOOGLE_CLIENT_ID)는 자동 포함
 */
export function getGoogleClientIds(): string[] {
  const configured = parseList(process.env.GOOGLE_CLIENT_IDS);
  const base = configured.length > 0 ? configured : DEFAULT_GOOGLE_CLIENT_IDS;
  const web = parseList(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  return Array.from(new Set([...base, ...web]));
}

// --------------------------------------------
// JWKS (jose가 키를 캐시하고 kid 미스 시 자동 갱신)
// --------------------------------------------

const APPLE_ISSUER = 'https://appleid.apple.com';
const appleJWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export interface VerifiedAppleToken {
  sub: string;
  email?: string;
  emailVerified: boolean;
}

/**
 * Apple identity token 검증 (서명 + iss + aud + exp)
 * 실패 시 예외를 던진다.
 */
export async function verifyAppleIdToken(idToken: string): Promise<VerifiedAppleToken> {
  const { payload } = await jwtVerify(idToken, appleJWKS, {
    issuer: APPLE_ISSUER,
    audience: getAppleAudiences(),
    algorithms: ['RS256'],
  });
  if (!payload.sub) {
    throw new Error('Apple token missing sub');
  }
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified,
  };
}

export interface VerifiedGoogleUser {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  picture?: string;
}

/**
 * Google ID 토큰 검증 (서명 + iss + aud + exp)
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  const { payload } = await jwtVerify(idToken, googleJWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: getGoogleClientIds(),
    algorithms: ['RS256'],
  });
  return googleUserFromClaims(payload);
}

function googleUserFromClaims(payload: JWTPayload | Record<string, unknown>): VerifiedGoogleUser {
  const p = payload as Record<string, unknown>;
  if (typeof p.sub !== 'string' || !p.sub) {
    throw new Error('Google token missing sub');
  }
  return {
    sub: p.sub,
    email: typeof p.email === 'string' ? p.email : undefined,
    emailVerified: p.email_verified === true || p.email_verified === 'true',
    name: typeof p.name === 'string' ? p.name : undefined,
    givenName: typeof p.given_name === 'string' ? p.given_name : undefined,
    picture: typeof p.picture === 'string' ? p.picture : undefined,
  };
}

/**
 * Google 액세스 토큰 검증 (ID 토큰 없이 액세스 토큰만 온 경우)
 * userinfo는 토큰이 어느 앱용인지 확인하지 않으므로, 먼저 tokeninfo로
 * aud/azp가 우리 클라이언트 ID인지 확인한 뒤 userinfo로 프로필을 조회한다.
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedGoogleUser> {
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!infoRes.ok) {
    throw new Error('Google access token invalid');
  }
  const info = (await infoRes.json()) as Record<string, unknown>;
  const allowed = getGoogleClientIds();
  const aud = typeof info.aud === 'string' ? info.aud : undefined;
  const azp = typeof info.azp === 'string' ? info.azp : undefined;
  if (!((aud && allowed.includes(aud)) || (azp && allowed.includes(azp)))) {
    throw new Error('Google access token audience mismatch');
  }
  const exp = Number(info.exp);
  if (!exp || exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Google access token expired');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error('Google userinfo failed');
  }
  const profile = (await userRes.json()) as Record<string, unknown>;
  // tokeninfo의 sub와 userinfo의 sub가 같아야 한다
  if (typeof info.sub === 'string' && profile.sub !== info.sub) {
    throw new Error('Google sub mismatch');
  }
  return googleUserFromClaims(profile);
}
