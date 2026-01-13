'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Session } from '@/types';
import { RotateCcw, Trash2, Clock, LogIn } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useConfirmDialog } from '@/components/confirm-dialog';

const DELETION_DAYS = 30;

function getRemainingTime(deletedAt: string | null): { days: number; hours: number } {
  if (!deletedAt) return { days: 0, hours: 0 };

  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + DELETION_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0 };
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return { days, hours };
}

function getRemainingBadgeVariant(days: number): 'default' | 'secondary' | 'destructive' {
  if (days <= 3) return 'destructive';
  if (days <= 7) return 'secondary';
  return 'default';
}

export default function TrashPage() {
  const [deletedSessions, setDeletedSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const formatRemainingTime = (days: number, hours: number) => {
    if (days === 0 && hours === 0) return t('trash.expired');
    if (days > 0) return t('trash.remainingDaysHours', { days, hours });
    return t('trash.remainingHours', { hours });
  };

  const fetchDeletedSessions = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/sessions?status=DELETED', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDeletedSessions(data);
      }
    } catch (err) {
      console.error('삭제된 세션 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDeletedSessions();
    } else if (!authLoading) {
      setIsLoading(false);
    }

    // 사이드바 새로고침 이벤트 리스너
    const handleRefresh = () => {
      fetchDeletedSessions();
    };
    window.addEventListener('sidebar-refresh', handleRefresh);

    return () => {
      window.removeEventListener('sidebar-refresh', handleRefresh);
    };
  }, [fetchDeletedSessions, authLoading, isAuthenticated]);

  const handleRestore = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || t('trash.restoreFailed'));
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      alert(t('trash.restoreError'));
    }
  };

  const handlePermanentDelete = async (sessionId: string) => {
    const confirmed = await confirm({
      title: t('dialog.permanentDelete'),
      description: t('trash.confirmPermanentDelete'),
      confirmText: t('trash.permanentDelete'),
      variant: "destructive"
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || t('trash.permanentDeleteFailed'));
      }
    } catch (error) {
      console.error('Session permanent delete failed:', error);
      alert(t('trash.permanentDeleteError'));
    }
  };

  const handleDeleteExpired = async () => {
    const confirmed = await confirm({
      title: t('dialog.cleanupExpired'),
      description: t('trash.confirmDeleteExpired'),
      confirmText: t('trash.cleanupExpired'),
      variant: "destructive"
    });
    if (!confirmed) return;

    try {
      const res = await fetch('/api/sessions/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        alert(t('trash.expiredDeleted', { count: data.deletedCount }));
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || t('trash.cleanupFailed'));
      }
    } catch (error) {
      console.error('Expired sessions cleanup failed:', error);
      alert(t('trash.cleanupError'));
    }
  };

  // 로그인하지 않은 사용자에게 로그인 안내 표시
  if (!authLoading && !isAuthenticated) {
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
                    <BreadcrumbPage>{t('trash.title')}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0 min-h-[60vh]">
            <Card className="max-w-md w-full text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <LogIn className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{t('dashboard.loginRequired')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('dashboard.loginRequiredDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('nav.login')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar onSessionChange={fetchDeletedSessions} />
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
                  <BreadcrumbPage>{t('trash.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{t('trash.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('trash.autoDeleteInfo', { days: DELETION_DAYS })}
                  </p>
                </div>
                {deletedSessions.some(s => getRemainingTime(s.deleted_at).days === 0 && getRemainingTime(s.deleted_at).hours === 0) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteExpired}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('trash.cleanupExpired')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.loading')}
                </p>
              ) : deletedSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('trash.noDeletedSessions')}
                </p>
              ) : (
                <div className="grid gap-4">
                  {deletedSessions.map((session) => {
                    const remaining = getRemainingTime(session.deleted_at);
                    return (
                      <Card key={session.session_id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-semibold line-through text-muted-foreground">
                                  {session.session_id}
                                </p>
                                <Badge variant={getRemainingBadgeVariant(remaining.days)}>
                                  <Clock className="mr-1 h-3 w-3" />
                                  {formatRemainingTime(remaining.days, remaining.hours)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('dashboard.scanCount')}: {session.scan_count} |
                                {t('trash.deletedAt')}: {session.deleted_at ? new Date(session.deleted_at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US') : '-'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(session.session_id)}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t('trash.restore')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handlePermanentDelete(session.session_id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('trash.permanentDelete')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
      {ConfirmDialog}
    </SidebarProvider>
  );
}
