'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';

interface LegalDocument {
  id: string;
  type: string;
  locale: string;
  title: string;
  content: string;
  version: string;
  publishedAt: string | null;
  updatedAt: string;
}

const SUPPORTED_LOCALES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
];

export default function LegalPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const searchParams = useSearchParams();

  const langParam = searchParams.get('lang') || 'ko';
  const themeParam = searchParams.get('theme');
  const embedded = searchParams.get('embedded') === 'true';

  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(langParam);
  const [isDark, setIsDark] = useState(themeParam === 'dark');

  // 문서 가져오기
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/legal/${type}?lang=${currentLang}`);
        const data = await res.json();

        if (data.success && data.document) {
          setDocument(data.document);
        } else {
          setError(data.error || 'Document not found');
        }
      } catch (err) {
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    if (['terms', 'privacy'].includes(type)) {
      fetchDocument();
    } else {
      setError('Invalid document type');
      setIsLoading(false);
    }
  }, [type, currentLang]);

  // 테마 감지
  useEffect(() => {
    if (!themeParam) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
  }, [themeParam]);

  // 언어 변경
  const handleLangChange = (lang: string) => {
    setCurrentLang(lang);
    // URL 업데이트 (히스토리에 추가하지 않음)
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
  };

  // HTML 콘텐츠 렌더링 (WYSIWYG 에디터에서 HTML로 저장됨)
  const renderContent = () => {
    if (!document?.content) return '';
    return document.content;
  };

  // 타이틀 설정
  useEffect(() => {
    if (document?.title) {
      window.document.title = document.title;
    }
  }, [document?.title]);

  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* 헤더 (embedded 모드가 아닐 때만) */}
      {!embedded && (
        <header className={`sticky top-0 z-10 ${cardBg} ${borderColor} border-b`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">
                {type === 'terms' ? (
                  currentLang === 'ko' ? '이용약관' : 'Terms of Service'
                ) : (
                  currentLang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'
                )}
              </h1>
              {document?.version && (
                <span className={`text-xs ${mutedColor} px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  v{document.version}
                </span>
              )}
            </div>

            {/* 언어 선택 & 테마 토글 */}
            <div className="flex items-center gap-2">
              <select
                value={currentLang}
                onChange={(e) => handleLangChange(e.target.value)}
                className={`text-sm px-2 py-1 rounded border ${borderColor} ${cardBg} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {SUPPORTED_LOCALES.map(locale => (
                  <option key={locale.code} value={locale.code}>
                    {locale.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className={`max-w-4xl mx-auto px-4 ${embedded ? 'py-4' : 'py-8'}`}>
        {isLoading ? (
          <div className={`${cardBg} rounded-lg p-8 shadow-sm`}>
            <div className="animate-pulse space-y-4">
              <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`} />
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`} />
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`} />
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`} />
            </div>
          </div>
        ) : error ? (
          <div className={`${cardBg} rounded-lg p-8 shadow-sm text-center`}>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className={`text-lg ${mutedColor}`}>
              {currentLang === 'ko' ? '문서를 찾을 수 없습니다.' : 'Document not found.'}
            </p>
            <p className={`text-sm ${mutedColor} mt-2`}>
              {currentLang === 'ko'
                ? '아직 발행된 문서가 없거나 요청한 언어를 지원하지 않습니다.'
                : 'The document has not been published yet or the requested language is not supported.'}
            </p>
          </div>
        ) : document && (
          <article className={`${cardBg} rounded-lg shadow-sm overflow-hidden`}>
            {/* 문서 헤더 */}
            <div className={`p-6 ${borderColor} border-b`}>
              <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
              {document.publishedAt && (
                <p className={`text-sm ${mutedColor}`}>
                  {currentLang === 'ko' ? '최종 수정일: ' : 'Last updated: '}
                  {new Date(document.publishedAt).toLocaleDateString(
                    currentLang === 'ko' ? 'ko-KR' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              )}
            </div>

            {/* 문서 내용 */}
            <div
              className="p-6 legal-content"
              dangerouslySetInnerHTML={{ __html: renderContent() }}
            />
            <style jsx global>{`
              .legal-content { line-height: 1.7; }
              .legal-content h1 { font-size: 1.75em; font-weight: 700; margin: 1.5em 0 0.75em; }
              .legal-content h2 { font-size: 1.5em; font-weight: 600; margin: 1.25em 0 0.5em; }
              .legal-content h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; }
              .legal-content h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.5em; }
              .legal-content p { margin: 0.75em 0; }
              .legal-content p:empty { min-height: 1em; }
              .legal-content ul, .legal-content ol { margin: 0.75em 0; padding-left: 1.5em; }
              .legal-content ul { list-style-type: disc; }
              .legal-content ol { list-style-type: decimal; }
              .legal-content li { margin: 0.25em 0; }
              .legal-content a { color: #3b82f6; }
              .legal-content a:hover { text-decoration: underline; }
              .legal-content blockquote { border-left: 3px solid ${isDark ? '#4b5563' : '#d1d5db'}; padding-left: 1em; margin: 1em 0; color: ${isDark ? '#9ca3af' : '#6b7280'}; }
              .legal-content code { background: ${isDark ? '#374151' : '#f3f4f6'}; padding: 0.125em 0.25em; border-radius: 0.25em; font-size: 0.875em; }
              .legal-content pre { background: ${isDark ? '#1f2937' : '#f3f4f6'}; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
              .legal-content hr { border: none; border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'}; margin: 1.5em 0; }
              .legal-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }
              .legal-content th, .legal-content td { border: 1px solid ${isDark ? '#374151' : '#e5e7eb'}; padding: 0.5em 0.75em; text-align: left; }
              .legal-content th { background: ${isDark ? '#1f2937' : '#f9fafb'}; font-weight: 600; }
            `}</style>
          </article>
        )}
      </main>

      {/* 푸터 (embedded 모드가 아닐 때만) */}
      {!embedded && (
        <footer className={`${borderColor} border-t mt-8`}>
          <div className={`max-w-4xl mx-auto px-4 py-6 text-center ${mutedColor} text-sm`}>
            <p>&copy; {new Date().getFullYear()} ScanView. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
