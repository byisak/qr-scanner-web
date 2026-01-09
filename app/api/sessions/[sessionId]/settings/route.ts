// app/api/sessions/[sessionId]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getUserFromRequest, hashPassword, verifyPassword } from '@/lib/auth';
import type { PoolClient } from 'pg';

interface SessionSettings {
  session_id: string;
  password_hash: string | null;
  is_public: boolean;
  access_code: string | null;
  max_participants: number | null;
  allow_anonymous: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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
              expires_at, created_at, updated_at
       FROM session_settings
       WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      // 설정이 없으면 기본값 반환
      return NextResponse.json({
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
    return NextResponse.json({
      sessionId: settings.session_id,
      hasPassword: settings.password_hash !== null,
      isPublic: settings.is_public,
      accessCode: settings.access_code,
      maxParticipants: settings.max_participants,
      allowAnonymous: settings.allow_anonymous,
      expiresAt: settings.expires_at,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    });
  } catch (error) {
    console.error('세션 설정 조회 오류:', error);
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

    // 인증 확인 (선택적)
    const authHeader = request.headers.get('authorization');
    const user = getUserFromRequest(authHeader);

    client = await getConnection();

    // 세션 존재 여부 및 소유자 확인
    const sessionResult = await client.query(
      `SELECT session_id, user_id FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const session = sessionResult.rows[0];

    // 세션 소유자만 설정 변경 가능 (소유자가 있는 경우)
    if (session.user_id && user && session.user_id !== user.userId) {
      return NextResponse.json(
        { error: '이 세션의 설정을 변경할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 업데이트할 필드 준비
    const updates: string[] = [];
    const values: (string | boolean | number | null)[] = [];
    let paramIndex = 1;

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
    console.error('세션 설정 업데이트 오류:', error);
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

    client = await getConnection();

    // 세션 설정 조회
    const result = await client.query(
      `SELECT password_hash, is_public FROM session_settings WHERE session_id = $1`,
      [sessionId]
    );

    // 설정이 없거나 공개 세션이면 접근 허용
    if (result.rows.length === 0 || result.rows[0].is_public) {
      return NextResponse.json({ success: true, accessGranted: true });
    }

    const settings = result.rows[0];

    // 비밀번호가 없으면 접근 허용
    if (!settings.password_hash) {
      return NextResponse.json({ success: true, accessGranted: true });
    }

    // 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        { success: false, accessGranted: false, error: '비밀번호가 필요합니다.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, settings.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, accessGranted: false, error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, accessGranted: true });
  } catch (error) {
    console.error('비밀번호 검증 오류:', error);
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
