'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
import { AppSidebar } from '@/components/app-sidebar';

// 방문한 세션을 localStorage에 저장
const VISITED_SESSIONS_KEY = 'visitedSessions';

function addVisitedSession(sessionId: string) {
  if (typeof window === 'undefined') return;
  try {
    const data = localStorage.getItem(VISITED_SESSIONS_KEY);
    const sessions = data ? JSON.parse(data) : [];
    const filtered = sessions.filter((s: { sessionId: string }) => s.sessionId !== sessionId);
    filtered.unshift({ sessionId, visitedAt: new Date().toISOString() });
    const trimmed = filtered.slice(0, 20);
    localStorage.setItem(VISITED_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage 오류 무시
  }
}
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { createColumns, createReadOnlyColumns } from '@/components/scan-table-columns';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from 'next-intl';

export default function SessionPage() {
  const t = useTranslations();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  // userId와 인증 로딩 상태를 전달하여 인증 완료 후 연결
  const { scans, isConnected, error, removeScan, removeScans } = useSocket(sessionId, user?.id, isLoading);

  // 비로그인 사용자: 방문한 세션을 localStorage에 저장
  useEffect(() => {
    if (!isLoading && !isAuthenticated && sessionId) {
      addVisitedSession(sessionId);
    }
  }, [isLoading, isAuthenticated, sessionId]);

  const handleDeleteScan = useCallback(async (scanId: number) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        removeScan(scanId);
      } else {
        const data = await res.json();
        alert(data.error || t('session.deleteFailed'));
      }
    } catch (error) {
      console.error('Scan data delete failed:', error);
      alert(t('session.deleteError'));
    }
  }, [removeScan, t]);

  const handleDeleteSelected = useCallback(async (ids: number[]) => {
    try {
      const res = await fetch('/api/scans/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        removeScans(ids);
      } else {
        const data = await res.json();
        alert(data.error || t('session.deleteFailed'));
      }
    } catch (error) {
      console.error('Bulk scan data delete failed:', error);
      alert(t('session.deleteError'));
    }
  }, [removeScans, t]);

  const columns = useMemo(
    () => isAuthenticated ? createColumns(handleDeleteScan) : createReadOnlyColumns(),
    [handleDeleteScan, isAuthenticated]
  );

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error(t('session.exportFailed'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert(t('session.exportError'));
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar currentSessionId={sessionId} />
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
                  <BreadcrumbPage>{t('session.title')}: {sessionId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{t('session.sessionCode')}</CardTitle>
                  <CardDescription className="mt-1">
                    {t('session.sessionCodeDesc')}
                  </CardDescription>
                </div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? t('session.connected') : t('session.disconnected')}
                </Badge>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                <span className="text-3xl font-mono font-bold tracking-wider">{sessionId}</span>
              </div>
              {error && (
                <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('session.scanData')}</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : (
                <>
                  {isAuthenticated && (
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        disabled={scans.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('session.exportCsv')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('xlsx')}
                        disabled={scans.length === 0}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        {t('session.exportExcel')}
                      </Button>
                    </div>
                  )}
                  <ScanDataTable columns={columns} data={scans} onDeleteSelected={isAuthenticated ? handleDeleteSelected : undefined} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
