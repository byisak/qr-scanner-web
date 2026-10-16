'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/form/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';
import { notify } from '@/lib/notify';
import { Copy, ExternalLink, Save, Eye, CircleCheck, CircleDashed } from 'lucide-react';
import { WysiwygEditor } from '@/components/admin/wysiwyg-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LEGAL_DOCUMENT_TYPES,
  getDefaultLegalTitle,
  type LegalDocumentType,
} from '@/lib/legal';

// 탭 라벨 (messages/*.json admin.legal.*)
const TAB_LABEL_KEYS: Record<LegalDocumentType, string> = {
  terms: 'admin.legal.terms',
  privacy: 'admin.legal.privacy',
  'account-deletion': 'admin.legal.accountDeletion',
};

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

const SUPPORTED_LOCALES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
];

export default function AdminLegalPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated, isLoading: authLoading, isAdmin, accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<LegalDocumentType>('terms');
  const [selectedLocale, setSelectedLocale] = useState('ko');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 현재 편집 중인 문서
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('1.0');
  const [isPublished, setIsPublished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // 문서 목록 조회
  const fetchDocuments = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/legal', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      } else {
        notify.error(t('admin.legal.loadError'));
      }
    } catch {
      notify.error(t('admin.legal.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    if (isAdmin && accessToken) {
      fetchDocuments();
    }
  }, [isAdmin, accessToken, fetchDocuments]);

  // 현재 문서 찾기 및 폼 업데이트
  useEffect(() => {
    const currentDoc = documents.find(
      doc => doc.type === activeTab && doc.locale === selectedLocale
    );

    if (currentDoc) {
      setTitle(currentDoc.title);
      setContent(currentDoc.content);
      setVersion(currentDoc.version);
      setIsPublished(currentDoc.isPublished);
    } else {
      // 기본값 설정
      const defaultTitle = getDefaultLegalTitle(activeTab, selectedLocale);
      setTitle(defaultTitle);
      setContent('');
      setVersion('1.0');
      setIsPublished(false);
    }
  }, [activeTab, selectedLocale, documents]);

  // 저장
  const handleSave = async (publish: boolean = false) => {
    if (!accessToken) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: activeTab,
          locale: selectedLocale,
          title,
          content,
          version,
          isPublished: publish ? true : isPublished,
        }),
      });

      if (res.ok) {
        notify.success(t('admin.legal.saveSuccess'));
        fetchDocuments();
      } else {
        notify.error(t('admin.legal.saveError'));
      }
    } catch {
      notify.error(t('admin.legal.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // 링크 복사
  const copyLink = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/legal/${activeTab}?lang=${selectedLocale}`;
    navigator.clipboard.writeText(url).then(
      () => notify.success(t('admin.legal.linkCopied')),
      () => notify.error(t('session.copyFailed'))
    );
  };

  // 미리보기 (현재 편집 중인 내용)
  const openPreview = () => {
    setShowPreview(true);
  };

  // 발행된 페이지 열기
  const openPublishedPage = () => {
    const url = `/legal/${activeTab}?lang=${selectedLocale}`;
    window.open(url, '_blank');
  };

  // 현재 문서의 발행 상태
  const currentDoc = documents.find(
    doc => doc.type === activeTab && doc.locale === selectedLocale
  );

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('dashboard.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/admin">{t('sidebar.admin')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('admin.legal.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="page flex flex-col gap-4 pb-16">
          <div className="enter pb-2 pt-8 sm:pt-9" style={{ "--i": 0 } as React.CSSProperties}>
            <h1 className="type-h1">{t('admin.legal.title')}</h1>
            <p className="mt-2 type-lead">{t('admin.legal.description')}</p>
          </div>

          <Card className="min-w-0">
            <CardContent className="pt-5 sm:pt-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalDocumentType)}>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TabsList className="w-full overflow-x-auto sm:w-auto">
                    {LEGAL_DOCUMENT_TYPES.map(docType => (
                      <TabsTrigger key={docType} value={docType} className="flex-1 sm:flex-none">{t(TAB_LABEL_KEYS[docType])}</TabsTrigger>
                    ))}
                  </TabsList>

                  <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                    <SelectTrigger className="w-full sm:ml-auto sm:w-[200px]" aria-label={t('admin.legal.language')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LOCALES.map(locale => (
                        <SelectItem key={locale.code} value={locale.code}>
                          {locale.name}
                          {documents.find(d => d.type === activeTab && d.locale === locale.code && d.isPublished) && (
                            <span className="ml-2 text-13 text-muted-foreground">
                              {t('admin.legal.published')}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-4" aria-busy="true">
                    <span className="sr-only" role="status">{t('common.loading')}</span>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-card" />
                  </div>
                ) : (
                  <>
                    {LEGAL_DOCUMENT_TYPES.map(docType => (
                      <TabsContent key={docType} value={docType} className="mt-0 space-y-4">
                        <LegalEditor
                          title={title}
                          setTitle={setTitle}
                          content={content}
                          setContent={setContent}
                          version={version}
                          setVersion={setVersion}
                          isPublished={isPublished}
                          setIsPublished={setIsPublished}
                          currentDoc={currentDoc}
                          t={t}
                        />
                      </TabsContent>
                    ))}

                    {/* 동작 버튼 */}
                    <div className="mt-4 flex flex-col gap-3 border-t pt-4 lg:flex-row">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openPreview}
                          disabled={!content}
                        >
                          <Eye aria-hidden="true" />
                          {t('admin.legal.preview')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyLink}
                          disabled={!currentDoc?.isPublished}
                        >
                          <Copy aria-hidden="true" />
                          {t('admin.legal.copyLink')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openPublishedPage}
                          disabled={!currentDoc?.isPublished}
                        >
                          <ExternalLink aria-hidden="true" />
                          {t('admin.legal.openPage')}
                        </Button>
                      </div>

                      <div className="flex gap-2 lg:ml-auto">
                        <Button
                          variant="outline"
                          className="flex-1 lg:flex-none"
                          onClick={() => handleSave(false)}
                          disabled={isSaving || !content}
                        >
                          <Save aria-hidden="true" />
                          {t('admin.legal.saveDraft')}
                        </Button>
                        <Button
                          className="flex-1 lg:flex-none"
                          onClick={() => handleSave(true)}
                          disabled={isSaving || !content}
                        >
                          {isSaving ? t('profile.saving') : t('admin.legal.publish')}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* 공개 주소 안내 */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{t('admin.legal.publicUrls')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {LEGAL_DOCUMENT_TYPES.map(docType => (
                  <li key={docType} className="flex min-w-0 flex-col gap-1.5 rounded-field bg-secondary px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <span className="shrink-0 text-13 font-semibold text-muted-foreground sm:order-2">{t(TAB_LABEL_KEYS[docType])}</span>
                    <code className="min-w-0 flex-1 break-all text-13">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/legal/{docType}?lang=ko
                    </code>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-13 text-muted-foreground">
                {t('admin.legal.urlHint')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 미리보기 (본문은 그래파이트 prose) */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="flex flex-col overflow-hidden sm:max-w-4xl" closeLabel={t('common.close')}>
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 break-words">{title || t('admin.legal.preview')}</span>
                <Badge variant="outline" className="tabular">v{version}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className="prose max-w-none type-body"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

// 에디터 컴포넌트
interface LegalEditorProps {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  version: string;
  setVersion: (v: string) => void;
  isPublished: boolean;
  setIsPublished: (v: boolean) => void;
  currentDoc: LegalDocument | undefined;
  t: ReturnType<typeof useTranslations>;
}

function LegalEditor({
  title,
  setTitle,
  content,
  setContent,
  version,
  setVersion,
  isPublished,
  setIsPublished,
  currentDoc,
  t,
}: LegalEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
        <Field label={t('admin.legal.docTitle')} id="legal-title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.legal.titlePlaceholder')}
          />
        </Field>
        <Field label={t('admin.legal.version')} id="legal-version">
          <Input
            className="tabular"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0"
          />
        </Field>
      </div>

      <Field label={t('admin.legal.content')} id="legal-content" group>
        <WysiwygEditor
          content={content}
          onChange={setContent}
          placeholder={t('admin.legal.contentPlaceholder')}
        />
      </Field>

      <div className="flex flex-col gap-2 rounded-field bg-secondary px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="published"
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
          <label htmlFor="published" className="cursor-pointer text-15 font-semibold">
            {t('admin.legal.publishStatus')}
          </label>
        </div>
        {currentDoc && (
          <p className="tabular flex items-center gap-1.5 text-13 text-muted-foreground">
            {currentDoc.isPublished ? (
              <>
                <CircleCheck className="size-4 text-foreground" aria-hidden="true" />
                {t('admin.legal.publishedAt', {
                  date: new Date(currentDoc.publishedAt!).toLocaleDateString(),
                })}
              </>
            ) : (
              <>
                <CircleDashed className="size-4" aria-hidden="true" />
                {t('admin.legal.notPublished')}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
