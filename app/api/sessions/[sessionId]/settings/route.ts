// app/api/sessions/[sessionId]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { hashPassword, verifyPassword, generateSessionAccessToken, verifySessionAccessToken } from '@/lib/auth';
import { ensureRealtimeKey } from '@/lib/session-service';
import {
  getRequestUser,
  isAdminUser,
  requireSessionOwner,
  isPasswordAttemptLimited,
  recordPasswordFailure,
  clearPasswordFailures,
} from '@/lib/session-access';
import type { PoolClient } from 'pg';

interface SessionSettings {
  session_id: string;
  has_password: boolean;
  is_public: boolean;
  access_code: string | null;
  max_participants: number | null;
  allow_anonymous: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  realtime_key: string | null;
}

// GET - 세션 설정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    client = await getConnection();

    // 세션 설정 조회
    const result = await client.query<SessionSettings>(
      `SELECT session_id,
              CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as has_password,
              is_public, access_code, max_participants, allow_anonymous,
              expires_at, created_at, updated_at, realtime_key
       FROM session_settings
       WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      // 설정이 없으면 기본값 반환 (소유자 여부는 따로 확인)
      let canManageDefault = false;
      const defaultUser = getRequestUser(request);
      if (defaultUser) {
        const owner = await client.query(`SELECT user_id FROM sessions WHERE session_id = $1`, [sessionId]);
        canManageDefault =
          owner.rows[0]?.user_id === defaultUser.userId || (await isAdminUser(client, defaultUser.userId));
      }
      return NextResponse.json({
        canManage: canManageDefault,
        sessionId,
        hasPassword: false,
        isPublic: true,
        accessCode: null,
        maxParticipants: null,
        allowAnonymous: true,
        expiresAt: null,
      });
    }

    const settings = result.rows[0];

    // 보안: 접근 코드는 소유자/관리자에게만 노출 (공개 열람 페이지에는 공개 여부/비밀번호 유무만 필요)
    let canSeeSecrets = false;
    const requestUser = getRequestUser(request);
    if (requestUser) {
      const ownerResult = await client.query(
        `SELECT user_id FROM sessions WHERE session_id = $1`,
        [sessionId]
      );
      canSeeSecrets =
        ownerResult.rows[0]?.user_id === requestUser.userId ||
        (await isAdminUser(client, requestUser.userId));
    }

    // 실시간 채널 키: 열람 권한이 확인된 경우에만 (docs/REALTIME_REST_CONTRACT.md 3절)
    // - 소유자/관리자: 항상
    // - 비공개: 그 외 불가
    // - 비밀번호: X-Session-Access-Token 헤더(비밀번호 검증 후 발급된 토큰)가 유효할 때
    // - 공개: 누구나
    const canSeeRealtimeKey =
      canSeeSecrets ||
      (settings.is_public !== false &&
        (!settings.has_password ||
          verifySessionAccessToken(request.headers.get('x-session-access-token'), sessionId)));
    let realtimeKey: string | null = null;
    if (canSeeRealtimeKey) {
      realtimeKey = settings.realtime_key || (await ensureRealtimeKey(client, sessionId));
    }
    // console.log('📖 세션 설정 조회:', {
    //   sessionId,
    //   raw: settings,
    //   hasPassword: settings.has_password,
    //   isPublic: settings.is_public
    // });
    return NextResponse.json({
      sessionId: settings.session_id,
      hasPassword: settings.has_password,
      isPublic: settings.is_public,
      accessCode: canSeeSecrets ? settings.access_code : null,
      // 소유자·관리자: 비공개·비밀번호 세션이어도 화면에서 막지 않고 공유 설정을 보여 준다
      canManage: canSeeSecrets,
      realtimeKey,
      maxParticipants: settings.max_participants,
      allowAnonymous: settings.allow_anonymous,
      expiresAt: settings.expires_at,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    });
  } catch (error) {
    // console.error('세션 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '세션 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// PUT - 세션 설정 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { sessionId } = await params;
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    client = await getConnection();

    // 보안: 로그인 + 세션 소유자(또는 관리자)만 설정 변경 가능.
    // 이전에는 소유자 없는 세션의 설정(비밀번호/공개 여부)을 누구나 바꿀 수 있었다.
    // 앱은 이미 Authorization: Bearer 헤더를 보내므로 호환된다.
    const access = await requireSessionOwner(client, request, sessionId, '이 세션의 설정을 변경하려면');
    if (!access.ok) {
      return access.response;
    }

    // 업데이트할 필드 준비
    const updates: string[] = [];
    const values: (string | boolean | number | null)[] = [];
    let paramIndex = 1;

    // 입력 검사: 비밀번호는 4~64자 문자열, 공개 여부는 true/false
    if ('password' in body && body.password && (typeof body.password !== 'string' || body.password.length < 4 || body.password.length > 64)) {
      return NextResponse.json({ error: '비밀번호는 4자 이상 64자 이하로 입력해 주세요.' }, { status: 400 });
    }
    if ('isPublic' in body && typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic 값이 올바르지 않습니다.' }, { status: 400 });
    }

    // 비밀번호 업데이트
    if ('password' in body) {
      if (body.password) {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(hashPassword(body.password));
      } else {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(null);
      }
    }

    // 공개 여부 업데이트
    if ('isPublic' in body) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(body.isPublic);
    }

    // 접근 코드 업데이트
    if ('accessCode' in body) {
      updates.push(`access_code = $${paramIndex++}`);
      values.push(body.accessCode || null);
    }

    // 최대 참가자 수 업데이트
    if ('maxParticipants' in body) {
      updates.push(`max_participants = $${paramIndex++}`);
      values.push(body.maxParticipants || null);
    }

    // 비로그인 참가 허용 업데이트
    if ('allowAnonymous' in body) {
      updates.push(`allow_anonymous = $${paramIndex++}`);
      values.push(body.allowAnonymous);
    }

    // 만료 시간 업데이트
    if ('expiresAt' in body) {
      updates.push(`expires_at = $${paramIndex++}`);
      values.push(body.expiresAt || null);
    }

    // 업데이트 시간
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // 업데이트할 필드가 없음 (updated_at만 있음)
      return NextResponse.json({ success: true, message: '변경사항이 없습니다.' });
    }

    // session_id 추가
    values.push(sessionId);

    // UPSERT 실행
    const query = `
      INSERT INTO session_settings (session_id, ${updates.map(u => u.split(' = ')[0]).join(', ')})
      VALUES ($${paramIndex}, ${values.slice(0, -1).map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT (session_id)
      DO UPDATE SET ${updates.join(', ')}
      RETURNING *
    `;

    // 더 간단한 UPSERT 쿼리 사용
    const upsertQuery = `
      INSERT INTO session_settings (session_id, password_hash, is_public, access_code, max_participants, allow_anonymous, expires_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (session_id)
      DO UPDATE SET
        password_hash = COALESCE($2, session_settings.password_hash),
        is_public = COALESCE($3, session_settings.is_public),
        access_code = COALESCE($4, session_settings.access_code),
        max_participants = COALESCE($5, session_settings.max_participants),
        allow_anonymous = COALESCE($6, session_settings.allow_anonymous),
        expires_at = COALESCE($7, session_settings.expires_at),
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        session_id,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as has_password,
        is_public, access_code, max_participants, allow_anonymous, expires_at
    `;

    // 기존 설정 조회
    const existingResult = await client.query(
      `SELECT * FROM session_settings WHERE session_id = $1`,
      [sessionId]
    );

    let passwordHash = existingResult.rows[0]?.password_hash || null;
    let isPublic = existingResult.rows[0]?.is_public ?? true;
    let accessCode = existingResult.rows[0]?.access_code || null;
    let maxParticipants = existingResult.rows[0]?.max_participants || null;
    let allowAnonymous = existingResult.rows[0]?.allow_anonymous ?? true;
    let expiresAt = existingResult.rows[0]?.expires_at || null;

    // 요청에서 받은 값으로 업데이트
    if ('password' in body) {
      passwordHash = body.password ? hashPassword(body.password) : null;
    }
    if ('isPublic' in body) {
      isPublic = body.isPublic;
    }
    if ('accessCode' in body) {
      accessCode = body.accessCode || null;
    }
    if ('maxParticipants' in body) {
      maxParticipants = body.maxParticipants || null;
    }
    if ('allowAnonymous' in body) {
      allowAnonymous = body.allowAnonymous;
    }
    if ('expiresAt' in body) {
      expiresAt = body.expiresAt || null;
    }

    // 세션 이름 업데이트 (sessions 테이블에 저장)
    if ('sessionName' in body && body.sessionName) {
      await client.query(
        `UPDATE sessions SET session_name = $1 WHERE session_id = $2`,
        [body.sessionName, sessionId]
      );
      // console.log('📝 세션 이름 업데이트:', sessionId, '->', body.sessionName);
    }

    // console.log('📝 세션 설정 업데이트:', {
    //   sessionId,
    //   body,
    //   finalValues: { passwordHash: !!passwordHash, isPublic, accessCode, maxParticipants, allowAnonymous, expiresAt }
    // });

    // UPSERT 실행
    const result = await client.query(
      `INSERT INTO session_settings (session_id, password_hash, is_public, access_code, max_participants, allow_anonymous, expires_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id)
       DO UPDATE SET
         password_hash = $2,
         is_public = $3,
         access_code = $4,
         max_participants = $5,
         allow_anonymous = $6,
         expires_at = $7,
         updated_at = CURRENT_TIMESTAMP
       RETURNING
         session_id,
         CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as has_password,
         is_public, access_code, max_participants, allow_anonymous, expires_at`,
      [sessionId, passwordHash, isPublic, accessCode, maxParticipants, allowAnonymous, expiresAt]
    );

    const updated = result.rows[0];
    // console.log('✅ 세션 설정 저장 완료:', {
    //   sessionId: updated.session_id,
    //   hasPassword: updated.has_password,
    //   isPublic: updated.is_public
    // });
    return NextResponse.json({
      success: true,
      settings: {
        sessionId: updated.session_id,
        hasPassword: updated.has_password,
        isPublic: updated.is_public,
        accessCode: updated.access_code,
        maxParticipants: updated.max_participants,
        allowAnonymous: updated.allow_anonymous,
        expiresAt: updated.expires_at,
      },
    });
  } catch (error) {
    // console.error('세션 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '세션 설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// POST - 세션 비밀번호 검증
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let client: PoolClient | null = null;

  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { password } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 보안: 비밀번호 무차별 대입 방지 (IP + 세션 단위 시도 제한)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const attemptKey = `${ip}:${sessionId}`;
    if (isPasswordAttemptLimited(attemptKey)) {
      return NextResponse.json(
        { success: false, accessGranted: false, error: '시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    client = await getConnection();

    // 세션 설정 조회
    const result = await client.query(
      `SELECT password_hash, is_public FROM session_settings WHERE session_id = $1`,
      [sessionId]
    );

    // 설정이 없으면 접근 허용
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, accessGranted: true });
    }

    const settings = result.rows[0];

    // 비밀번호가 없으면 공개 여부에 따라 결정
    if (!settings.password_hash) {
      // 비밀번호 없고 공개 세션이면 접근 허용
      if (settings.is_public) {
        return NextResponse.json({ success: true, accessGranted: true });
      }
      // 비밀번호 없고 비공개 세션이면 접근 거부
      return NextResponse.json({ success: false, accessGranted: false, error: '비공개 세션입니다.' }, { status: 403 });
    }

    // 보안: 비공개 세션은 비밀번호가 있어도 소유자 외에는 열람 불가 (소켓 join-session과 동일한 규칙)
    if (!settings.is_public) {
      return NextResponse.json({ success: false, accessGranted: false, error: '비공개 세션입니다.' }, { status: 403 });
    }

    // 비밀번호가 있으면 검증 필요
    // console.log('🔐 비밀번호 검증 시작:', { sessionId, hasPasswordHash: !!settings.password_hash, inputPassword: password ? '***' : null });

    // 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        { success: false, accessGranted: false, error: '비밀번호가 필요합니다.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, settings.password_hash);
    // console.log('🔐 비밀번호 검증 결과:', { isValid });

    if (!isValid) {
      recordPasswordFailure(attemptKey);
      // console.log('❌ 비밀번호 불일치');
      return NextResponse.json(
        { success: false, accessGranted: false, error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // console.log('✅ 비밀번호 검증 성공');
    clearPasswordFailures(attemptKey);
    // 비밀번호 검증 성공 시 세션 접근 토큰 발급 → 소켓 join-session 에 sessionAccessToken 으로 제시
    // 실시간 채널 키도 함께 돌려준다 (Supabase Realtime 구독용)
    const realtimeKey = await ensureRealtimeKey(client, sessionId);
    return NextResponse.json({
      success: true,
      accessGranted: true,
      sessionAccessToken: generateSessionAccessToken(sessionId),
      realtimeKey,
    });
  } catch (error) {
    // console.error('비밀번호 검증 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 검증에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
