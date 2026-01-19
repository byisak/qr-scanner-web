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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/components/ui/sonner';
import { Copy, ExternalLink, Save, Eye, X } from 'lucide-react';
import { WysiwygEditor } from '@/components/admin/wysiwyg-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LegalDocument {
  id: string;
  type: 'terms' | 'privacy';
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

  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
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
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

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
      const defaultTitle = activeTab === 'terms'
        ? (selectedLocale === 'ko' ? '서비스 이용약관' : 'Terms of Service')
        : (selectedLocale === 'ko' ? '개인정보 처리방침' : 'Privacy Policy');
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
        toast.success(t('admin.legal.saveSuccess'));
        fetchDocuments();
      } else {
        toast.error(t('admin.legal.saveError'));
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('admin.legal.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // 링크 복사
  const copyLink = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/legal/${activeTab}?lang=${selectedLocale}`;
    navigator.clipboard.writeText(url);
    toast.success(t('admin.legal.linkCopied'));
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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
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

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.legal.title')}</CardTitle>
              <CardDescription>{t('admin.legal.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'terms' | 'privacy')}>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <TabsList className="grid w-full sm:w-auto grid-cols-2">
                    <TabsTrigger value="terms">{t('admin.legal.terms')}</TabsTrigger>
                    <TabsTrigger value="privacy">{t('admin.legal.privacy')}</TabsTrigger>
                  </TabsList>

                  <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LOCALES.map(locale => (
                        <SelectItem key={locale.code} value={locale.code}>
                          {locale.name}
                          {documents.find(d => d.type === activeTab && d.locale === locale.code && d.isPublished) && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {t('admin.legal.published')}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : (
                  <>
                    <TabsContent value="terms" className="space-y-4 mt-0">
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

                    <TabsContent value="privacy" className="space-y-4 mt-0">
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

                    {/* 액션 버튼 */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={openPreview}
                          disabled={!content}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('admin.legal.preview')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={copyLink}
                          disabled={!currentDoc?.isPublished}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {t('admin.legal.copyLink')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={openPublishedPage}
                          disabled={!currentDoc?.isPublished}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('admin.legal.openPage')}
                        </Button>
                      </div>

                      <div className="flex gap-2 sm:ml-auto">
                        <Button
                          variant="outline"
                          onClick={() => handleSave(false)}
                          disabled={isSaving || !content}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {t('admin.legal.saveDraft')}
                        </Button>
                        <Button
                          onClick={() => handleSave(true)}
                          disabled={isSaving || !content}
                        >
                          {isSaving ? t('common.loading') : t('admin.legal.publish')}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* 공개 URL 안내 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('admin.legal.publicUrls')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <code className="flex-1 text-xs break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/legal/terms?lang=ko
                  </code>
                  <Badge variant="outline">{t('admin.legal.terms')}</Badge>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <code className="flex-1 text-xs break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/legal/privacy?lang=ko
                  </code>
                  <Badge variant="outline">{t('admin.legal.privacy')}</Badge>
                </div>
                <p className="text-muted-foreground text-xs mt-2">
                  {t('admin.legal.urlHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 미리보기 모달 */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span>{title || t('admin.legal.preview')}</span>
                <Badge variant="outline">v{version}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div
                className="legal-preview p-4"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
            <style jsx global>{`
              .legal-preview { line-height: 1.7; }
              .legal-preview h1 { font-size: 1.75em; font-weight: 700; margin: 1.5em 0 0.75em; }
              .legal-preview h2 { font-size: 1.5em; font-weight: 600; margin: 1.25em 0 0.5em; }
              .legal-preview h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; }
              .legal-preview h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.5em; }
              .legal-preview p { margin: 0.75em 0; }
              .legal-preview p:empty { min-height: 1em; }
              .legal-preview ul, .legal-preview ol { margin: 0.75em 0; padding-left: 1.5em; }
              .legal-preview ul { list-style-type: disc; }
              .legal-preview ol { list-style-type: decimal; }
              .legal-preview li { margin: 0.25em 0; }
              .legal-preview a { color: #3b82f6; }
              .legal-preview a:hover { text-decoration: underline; }
              .legal-preview blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; margin: 1em 0; color: #6b7280; }
              .legal-preview code { background: #f3f4f6; padding: 0.125em 0.25em; border-radius: 0.25em; font-size: 0.875em; }
              .legal-preview pre { background: #f3f4f6; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
              .legal-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
              .dark .legal-preview blockquote { border-left-color: #4b5563; color: #9ca3af; }
              .dark .legal-preview code { background: #374151; }
              .dark .legal-preview pre { background: #1f2937; }
              .dark .legal-preview hr { border-top-color: #374151; }
            `}</style>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">{t('admin.legal.docTitle')}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.legal.titlePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">{t('admin.legal.version')}</Label>
          <Input
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('admin.legal.content')}</Label>
        <WysiwygEditor
          content={content}
          onChange={setContent}
          placeholder={t('admin.legal.contentPlaceholder')}
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="flex items-center gap-2">
          <Switch
            id="published"
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
          <Label htmlFor="published" className="cursor-pointer">
            {t('admin.legal.publishStatus')}
          </Label>
        </div>
        {currentDoc && (
          <div className="text-xs text-muted-foreground">
            {currentDoc.isPublished ? (
              <span className="text-green-600">
                {t('admin.legal.publishedAt', {
                  date: new Date(currentDoc.publishedAt!).toLocaleDateString(),
                })}
              </span>
            ) : (
              <span>{t('admin.legal.notPublished')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
