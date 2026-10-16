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
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListRow, ListRowSkeleton } from '@/components/ui/list-row';
import { Empty } from '@/components/ui/empty';
import { notify } from '@/lib/notify';
import { Session } from '@/types';
import { RotateCcw, Trash2, Clock, LogIn, ArchiveX, QrCode } from 'lucide-react';
import type { CSSProperties } from 'react';
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

// 남은 시간 뱃지: 3일 이하만 경고(빨강), 나머지는 회색. 글자로도 남은 시간을 함께 보여준다
function getRemainingBadgeVariant(days: number): 'outline' | 'secondary' | 'destructive' {
  if (days <= 3) return 'destructive';
  if (days <= 7) return 'secondary';
  return 'outline';
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
    } catch {
      // 목록을 못 받으면 빈 목록 그대로
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
        notify.success(t('trash.restored'));
      } else {
        notify.error(t('trash.restoreFailed'));
      }
    } catch {
      notify.error(t('trash.restoreError'));
    }
  };

  const handlePermanentDelete = async (sessionId: string, name: string) => {
    // 되돌릴 수 없는 작업: 세션 이름(없으면 ID)을 똑같이 입력해야 실행
    const confirmed = await confirm({
      title: t('dialog.permanentDelete'),
      description: t('trash.confirmPermanentDelete'),
      confirmText: t('trash.permanentDelete'),
      variant: "destructive",
      typeToConfirm: name,
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
        notify.success(t('trash.permanentlyDeleted'));
      } else {
        notify.error(t('trash.permanentDeleteFailed'));
      }
    } catch {
      notify.error(t('trash.permanentDeleteError'));
    }
  };

  const expiredCount = deletedSessions.filter((s) => {
    const r = getRemainingTime(s.deleted_at);
    return r.days === 0 && r.hours === 0;
  }).length;

  const handleDeleteExpired = async () => {
    // 일괄 영구 삭제: 만료된 세션 개수를 숫자로 입력해야 실행
    const confirmed = await confirm({
      title: t('dialog.cleanupExpired'),
      description: t('trash.confirmDeleteExpired'),
      confirmText: t('trash.cleanupExpired'),
      variant: "destructive",
      typeToConfirm: String(expiredCount),
      typeToConfirmLabel: t('trash.typeExpiredCount', { count: expiredCount }),
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
        notify.success(t('trash.expiredDeleted', { count: data.deletedCount }));
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        notify.error(t('trash.cleanupFailed'));
      }
    } catch {
      notify.error(t('trash.cleanupError'));
    }
  };

  const header = (
    <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink href="/dashboard">{t('dashboard.title')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block truncate">{t('trash.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );

  // 로그인하지 않은 사용자에게 로그인 안내 표시
  if (!authLoading && !isAuthenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {header}
          <div className="page flex min-h-[60vh] flex-1 flex-col items-center justify-center py-10">
            <Card className="enter w-full max-w-md text-center">
              <CardHeader className="items-center">
                <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
                  <LogIn className="size-7" aria-hidden="true" />
                </div>
                <h1 className="type-h2">{t('dashboard.loginRequired')}</h1>
                <CardDescription>{t('dashboard.loginRequiredDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="xl" className="w-full">
                  <Link href="/login">
                    <LogIn aria-hidden="true" />
                    {t('nav.login')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const showSkeleton = isLoading || authLoading;

  return (
    <SidebarProvider>
      <AppSidebar onSessionChange={fetchDeletedSessions} />
      <SidebarInset>
        {header}

        <div className="page pb-16">
          <div
            className="enter flex flex-col items-start justify-between gap-4 pb-6 pt-8 sm:flex-row sm:items-end sm:pt-9"
            style={{ '--i': 0 } as CSSProperties}
          >
            <div className="min-w-0">
              <h1 className="type-h1">{t('trash.title')}</h1>
              <p className="mt-2 type-lead">{t('trash.autoDeleteInfo', { days: DELETION_DAYS })}</p>
            </div>
            {expiredCount > 0 && (
              <Button variant="destructive" onClick={handleDeleteExpired} className="shrink-0">
                <Trash2 aria-hidden="true" />
                {t('trash.cleanupExpired')} <span className="tabular">({expiredCount})</span>
              </Button>
            )}
          </div>

          {showSkeleton ? (
            <div aria-busy="true">
              <span className="sr-only" role="status">{t('common.loading')}</span>
              <ListRowSkeleton count={3} />
            </div>
          ) : deletedSessions.length === 0 ? (
            <Empty
              className="enter"
              style={{ '--i': 1 } as CSSProperties}
              icon={<ArchiveX />}
              title={t('trash.noDeletedSessions')}
            />
          ) : (
            <ul className="swap grid gap-2" aria-label={t('trash.title')}>
              {deletedSessions.map((session, i) => {
                const remaining = getRemainingTime(session.deleted_at);
                const name = session.session_name || session.session_id;
                return (
                  <li key={session.session_id} className="min-w-0" style={{ '--i': Math.min(i, 12) } as CSSProperties}>
                    <ListRow
                      icon={<QrCode />}
                      title={name}
                      description={
                        <>
                          <span className="tabular">{t('dashboard.scans', { count: session.scan_count })}</span>
                          {' · '}
                          {t('trash.deletedAt')}{' '}
                          <span className="tabular">
                            {session.deleted_at ? new Date(session.deleted_at).toLocaleDateString(locale) : '-'}
                          </span>
                        </>
                      }
                      action={
                        <>
                          <Badge variant={getRemainingBadgeVariant(remaining.days)} className="hidden tabular sm:inline-flex">
                            <Clock aria-hidden="true" />
                            {formatRemainingTime(remaining.days, remaining.hours)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(session.session_id)}
                            aria-label={`${name} ${t('trash.restore')}`}
                          >
                            <RotateCcw aria-hidden="true" />
                            <span className="hidden sm:inline">{t('trash.restore')}</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete(session.session_id, name)}
                            aria-label={`${name} ${t('trash.permanentDelete')}`}
                          >
                            <Trash2 aria-hidden="true" />
                            <span className="hidden sm:inline">{t('trash.permanentDelete')}</span>
                          </Button>
                        </>
                      }
                    />
                    {/* 좁은 화면: 남은 시간을 행 아래 줄에 */}
                    <p className="mt-1 flex items-center gap-1.5 px-4 text-13 text-muted-foreground sm:hidden">
                      <Clock className="size-3.5" aria-hidden="true" />
                      <span className={remaining.days <= 3 ? 'tabular font-semibold text-destructive' : 'tabular'}>
                        {formatRemainingTime(remaining.days, remaining.hours)}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SidebarInset>
      {ConfirmDialog}
    </SidebarProvider>
  );
}
