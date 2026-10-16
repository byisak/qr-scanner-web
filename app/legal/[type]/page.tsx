'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircleAlert, Moon, Sun } from 'lucide-react';
import { getDefaultLegalTitle, isLegalDocumentType } from '@/lib/legal';
import { Skeleton } from '@/components/ui/skeleton';

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

// 이 페이지는 앱 웹뷰에서도 열리므로 next-intl 없이 작은 번역표를 쓴다
const TEXT: Record<string, Record<'notFound' | 'notFoundDesc' | 'lastUpdated' | 'light' | 'dark' | 'language' | 'loading', string>> = {
  ko: {
    notFound: '문서를 찾을 수 없어요',
    notFoundDesc: '아직 발행된 문서가 없거나 이 언어로는 준비되지 않았어요',
    lastUpdated: '최종 수정일',
    light: '밝은 화면으로 보기',
    dark: '어두운 화면으로 보기',
    language: '언어',
    loading: '불러오는 중',
  },
  en: {
    notFound: 'Document not found',
    notFoundDesc: 'It has not been published yet or is not available in this language',
    lastUpdated: 'Last updated',
    light: 'Switch to light mode',
    dark: 'Switch to dark mode',
    language: 'Language',
    loading: 'Loading',
  },
  ja: {
    notFound: '文書が見つかりません',
    notFoundDesc: 'まだ公開されていないか、この言語では用意されていません',
    lastUpdated: '最終更新日',
    light: 'ライトモードに切り替え',
    dark: 'ダークモードに切り替え',
    language: '言語',
    loading: '読み込み中',
  },
  zh: {
    notFound: '找不到文档',
    notFoundDesc: '文档尚未发布，或暂不支持该语言',
    lastUpdated: '最后更新',
    light: '切换到浅色模式',
    dark: '切换到深色模式',
    language: '语言',
    loading: '加载中',
  },
  es: {
    notFound: 'No se encontró el documento',
    notFoundDesc: 'Aún no se ha publicado o no está disponible en este idioma',
    lastUpdated: 'Última actualización',
    light: 'Cambiar a modo claro',
    dark: 'Cambiar a modo oscuro',
    language: 'Idioma',
    loading: 'Cargando',
  },
};

const DATE_LOCALE: Record<string, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', es: 'es-ES' };

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
      } catch {
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLegalDocumentType(type)) {
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

  // 화면 색은 토큰으로: 어두운 화면이면 html 에 dark 클래스 (앱 웹뷰의 ?theme=dark 도 그대로)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  // 읽어 주는 언어도 문서 언어에 맞춘다
  useEffect(() => {
    window.document.documentElement.lang = currentLang;
  }, [currentLang]);

  const tx = TEXT[currentLang] ?? TEXT.en;
  const docTitle = document?.title || (isLegalDocumentType(type) ? getDefaultLegalTitle(type, currentLang) : '');

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDark ? 'dark' : ''}`}>
      {/* 머리글 (embedded 모드가 아닐 때만) */}
      {!embedded && (
        <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="page-narrow flex min-h-[68px] items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="type-h3 min-w-0 truncate">{docTitle}</h1>
              {document?.version && (
                <span className="tabular shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-13 font-semibold text-muted-foreground">
                  v{document.version}
                </span>
              )}
            </div>

            {/* 언어 선택 & 테마 전환 */}
            <div className="flex shrink-0 items-center gap-1.5">
              <select
                value={currentLang}
                onChange={(e) => handleLangChange(e.target.value)}
                aria-label={tx.language}
                className="h-[34px] rounded-full border border-input bg-card px-3 text-13 font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {SUPPORTED_LOCALES.map(locale => (
                  <option key={locale.code} value={locale.code}>
                    {locale.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                aria-label={isDark ? tx.light : tx.dark}
                className="inline-flex size-[34px] items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 본문 */}
      <main id="main" className={`page-narrow ${embedded ? 'py-4' : 'py-8'}`}>
        {isLoading ? (
          <div className="rounded-card border bg-card p-6 sm:p-8" aria-busy="true">
            <span className="sr-only" role="status">{tx.loading}</span>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-card border bg-card p-8 text-center" role="alert">
            <CircleAlert className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 type-h3">{tx.notFound}</p>
            <p className="mt-2 text-15 text-muted-foreground">{tx.notFoundDesc}</p>
          </div>
        ) : document && (
          <article className="min-w-0 rounded-card border bg-card">
            {document.publishedAt && (
              <p className="tabular px-5 pt-6 text-13 text-muted-foreground sm:px-8">
                {tx.lastUpdated}{' '}
                {new Date(document.publishedAt).toLocaleDateString(DATE_LOCALE[currentLang] ?? 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}

            {/* 문서 내용 (그래파이트 prose, 긴 주소는 줄바꿈) */}
            <div
              className="prose max-w-none px-5 pb-8 pt-2 type-body sm:px-8 [&_a]:break-all"
              dangerouslySetInnerHTML={{ __html: renderContent() }}
            />
          </article>
        )}
      </main>

      {/* 바닥글 (embedded 모드가 아닐 때만) */}
      {!embedded && (
        <footer className="mt-8 border-t">
          <div className="page-narrow py-6 text-center text-13 text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ScanView. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
