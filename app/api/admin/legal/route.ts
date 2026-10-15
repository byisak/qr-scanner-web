// GET /api/admin/legal - 약관 목록 조회 (관리자 전용)
// POST /api/admin/legal - 약관 생성/수정 (관리자 전용)
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getConnection } from '@/lib/db';
import {
  getUserFromRequest,
  AuthErrorCodes,
  createAuthErrorResponse,
} from '@/lib/auth';
import {
  LEGAL_LOCALES,
  isLegalDocumentType,
  type LegalDocumentType,
} from '@/lib/legal';

interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  locale: string;
  title: string;
  content: string;
  version: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 관리자 권한 체크
async function checkAdminRole(client: PoolClient, userId: string): Promise<string | null> {
  const result = await client.query(
    'SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].role;
}

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    client = await getConnection();

    // 관리자 권한 확인
    const role = await checkAdminRole(client, tokenUser.userId);
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // lib/legal.ts LEGAL_DOCUMENT_TYPES

    let query = 'SELECT * FROM legal_documents';
    const params: string[] = [];

    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }

    query += ' ORDER BY type, locale';

    const result = await client.query(query, params);

    const documents: LegalDocument[] = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      locale: row.locale,
      title: row.title,
      content: row.content,
      version: row.version,
      isPublished: row.is_published,
      publishedAt: row.published_at?.toISOString() || null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Legal documents list error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '약관 목록 조회 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const tokenUser = getUserFromRequest(authHeader);

    if (!tokenUser) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.UNAUTHORIZED, '인증이 필요합니다.'),
        { status: 401 }
      );
    }

    client = await getConnection();

    // 관리자 권한 확인
    const role = await checkAdminRole(client, tokenUser.userId);
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json(
        createAuthErrorResponse(AuthErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다.'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, locale, title, content, version, isPublished } = body;

    // 유효성 검사
    if (!type || typeof type !== 'string' || !isLegalDocumentType(type)) {
      return NextResponse.json(
        { success: false, error: 'type은 terms, privacy, account-deletion 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    if (!locale || !(LEGAL_LOCALES as readonly string[]).includes(locale)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 언어입니다.' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // UPSERT (type + locale 기준)
    const result = await client.query(
      `INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (type, locale)
       DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         version = EXCLUDED.version,
         is_published = EXCLUDED.is_published,
         published_at = EXCLUDED.published_at,
         updated_at = NOW()
       RETURNING *`,
      [
        type,
        locale,
        title,
        content,
        version || '1.0',
        isPublished || false,
        isPublished ? new Date() : null,
        tokenUser.userId,
      ]
    );

    const doc = result.rows[0];

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        type: doc.type,
        locale: doc.locale,
        title: doc.title,
        content: doc.content,
        version: doc.version,
        isPublished: doc.is_published,
        publishedAt: doc.published_at?.toISOString() || null,
        createdAt: doc.created_at.toISOString(),
        updatedAt: doc.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Legal document save error:', error);
    return NextResponse.json(
      createAuthErrorResponse(AuthErrorCodes.VALIDATION_ERROR, '약관 저장 중 오류가 발생했습니다.'),
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
