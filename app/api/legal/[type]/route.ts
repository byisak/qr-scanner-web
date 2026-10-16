// GET /api/legal/[type] - 공개 약관 조회 (인증 불필요)
// type: 'terms' | 'privacy' | 'account-deletion' (lib/legal.ts)
// query: ?lang=ko (기본값: ko)
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { isLegalDocumentType } from '@/lib/legal';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  let client = null;

  try {
    const { type } = await params;

    // 타입 검증
    if (!isLegalDocumentType(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // 언어 파라미터
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('lang') || 'ko';

    client = await getConnection();

    // 발행된 문서 조회
    const result = await client.query(
      `SELECT id, type, locale, title, content, version, published_at, updated_at
       FROM legal_documents
       WHERE type = $1 AND locale = $2 AND is_published = true`,
      [type, locale]
    );

    if (result.rows.length === 0) {
      // 요청 언어가 없으면 한국어로 폴백
      if (locale !== 'ko') {
        const fallbackResult = await client.query(
          `SELECT id, type, locale, title, content, version, published_at, updated_at
           FROM legal_documents
           WHERE type = $1 AND locale = 'ko' AND is_published = true`,
          [type]
        );

        if (fallbackResult.rows.length > 0) {
          const doc = fallbackResult.rows[0];
          return NextResponse.json({
            success: true,
            document: {
              id: doc.id,
              type: doc.type,
              locale: doc.locale,
              title: doc.title,
              content: doc.content,
              version: doc.version,
              publishedAt: doc.published_at?.toISOString() || null,
              updatedAt: doc.updated_at.toISOString(),
            },
            fallback: true,
          });
        }
      }

      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

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
        publishedAt: doc.published_at?.toISOString() || null,
        updatedAt: doc.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Legal document fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
