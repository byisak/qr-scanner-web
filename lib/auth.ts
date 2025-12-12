// lib/auth.ts - 인증 관련 유틸리티

import { getConnection } from './db';
import oracledb from 'oracledb';
import crypto from 'crypto';

// ============================================================
// JWT 관련 설정
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT 만료 시간을 밀리초로 변환
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // 기본 7일

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

// ============================================================
// 간단한 JWT 구현 (외부 라이브러리 없이)
// ============================================================

interface JWTPayload {
  userId: string;
  email?: string;
  provider: string;
  exp: number;
  iat: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf-8');
}

export function signJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const expiresIn = parseExpiresIn(JWT_EXPIRES_IN);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    // 만료 확인
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// 사용자 관리
// ============================================================

export interface SocialUser {
  id: string;
  provider: 'kakao' | 'naver' | 'google' | 'apple';
  providerId: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

/**
 * 소셜 로그인 사용자 찾기 또는 생성
 */
export async function findOrCreateSocialUser(
  provider: SocialUser['provider'],
  providerId: string,
  profile: {
    email?: string;
    name?: string;
    profileImage?: string;
  }
): Promise<SocialUser> {
  let connection;

  try {
    connection = await getConnection();
    if (!connection) {
      // DB 연결 없으면 메모리 사용자 반환
      return {
        id: `${provider}_${providerId}`,
        provider,
        providerId,
        ...profile,
      };
    }

    // 기존 사용자 조회
    const existingResult = await connection.execute(
      `SELECT user_id, email, name, profile_image
       FROM social_users
       WHERE provider = :provider AND provider_id = :providerId`,
      { provider, providerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingResult.rows && existingResult.rows.length > 0) {
      const row: any = existingResult.rows[0];

      // 프로필 정보 업데이트
      await connection.execute(
        `UPDATE social_users
         SET email = :email, name = :name, profile_image = :profileImage, updated_at = CURRENT_TIMESTAMP
         WHERE provider = :provider AND provider_id = :providerId`,
        {
          email: profile.email || null,
          name: profile.name || null,
          profileImage: profile.profileImage || null,
          provider,
          providerId,
        }
      );
      await connection.commit();

      return {
        id: row.USER_ID,
        provider,
        providerId,
        email: profile.email || row.EMAIL,
        name: profile.name || row.NAME,
        profileImage: profile.profileImage || row.PROFILE_IMAGE,
      };
    }

    // 새 사용자 생성
    const userId = crypto.randomUUID();
    await connection.execute(
      `INSERT INTO social_users (user_id, provider, provider_id, email, name, profile_image, created_at, updated_at)
       VALUES (:userId, :provider, :providerId, :email, :name, :profileImage, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      {
        userId,
        provider,
        providerId,
        email: profile.email || null,
        name: profile.name || null,
        profileImage: profile.profileImage || null,
      }
    );
    await connection.commit();

    return {
      id: userId,
      provider,
      providerId,
      ...profile,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}

/**
 * JWT 응답 생성
 */
export function createAuthResponse(user: SocialUser) {
  const accessToken = signJWT({
    userId: user.id,
    email: user.email,
    provider: user.provider,
  });

  return {
    success: true,
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      provider: user.provider,
    },
  };
}
