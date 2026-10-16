'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ListRow, ListRowSkeleton } from '@/components/ui/list-row';
import { Empty } from '@/components/ui/empty';
import { TimeAgo } from '@/components/time-ago';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { QrCode, ScanLine, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { notify } from '@/lib/notify';

// 방문한 세션을 localStorage에 저장하는 유틸리티
const VISITED_SESSIONS_KEY = 'visitedSessions';

interface VisitedSession {
  sessionId: string;
  visitedAt: string;
}

function getVisitedSessions(): VisitedSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(VISITED_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addVisitedSession(sessionId: string) {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getVisitedSessions();
    // 중복 제거 후 추가
    const filtered = sessions.filter(s => s.sessionId !== sessionId);
    filtered.unshift({ sessionId, visitedAt: new Date().toISOString() });
    // 최대 20개만 유지
    const trimmed = filtered.slice(0, 20);
    localStorage.setItem(VISITED_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage 오류 무시
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  // 처음 목록을 받아오기 전까지는 스켈레톤
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;
    try {
      // 로그인한 사용자만 자신의 세션 조회 (인증 토큰 포함)
      const res = await fetch('/api/sessions?mine=true', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      // 목록 로드 실패는 다음 폴링에서 다시 시도
    } finally {
      setLoaded(true);
    }
  }, [isAuthenticated, accessToken]);

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 5000);

      const handleRefresh = () => {
        fetchSessions();
      };
      window.addEventListener('sidebar-refresh', handleRefresh);

      return () => {
        clearInterval(interval);
        window.removeEventListener('sidebar-refresh', handleRefresh);
      };
    }
  }, [isAuthenticated, fetchSessions]);

  const viewSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: t('dialog.deleteSession'),
      description: t('dashboard.confirmDelete'),
      confirmText: t('table.delete'),
      variant: "destructive"
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        notify.error(t('dashboard.deleteFailed'));
      }
    } catch {
      notify.error(t('dashboard.deleteFailed'));
    }
  };

  const showSkeleton = isLoading || !isAuthenticated || !loaded;

  return (
    <SidebarProvider>
      <AppSidebar onSessionChange={fetchSessions} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('dashboard.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="page pb-16">
          <div className="enter pb-6 pt-8 sm:pt-9" style={{ "--i": 0 } as React.CSSProperties}>
            <h1 className="type-h1">{t('dashboard.activeSessions')}</h1>
            <p className="mt-2 type-lead">{t('dashboard.mySessionsDesc')}</p>
          </div>

          {showSkeleton ? (
            <div aria-busy="true">
              <span className="sr-only" role="status">{t('common.loading')}</span>
              <ListRowSkeleton count={4} />
            </div>
          ) : sessions.length === 0 ? (
            <Empty
              className="enter"
              style={{ "--i": 1 } as React.CSSProperties}
              icon={<ScanLine />}
              title={t('dashboard.emptyTitle')}
              description={t('dashboard.emptyDesc')}
            />
          ) : (
            <ul className="swap grid gap-2" aria-label={t('dashboard.activeSessions')}>
              {sessions.map((session, i) => {
                const name = session.session_name || session.session_id;
                return (
                  <li key={session.session_id} className="min-w-0" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                    <ListRow
                      icon={<QrCode />}
                      title={name}
                      description={
                        <>
                          {session.session_name ? (
                            <span className="font-mono">{session.session_id} · </span>
                          ) : null}
                          <span className="tabular">{t('dashboard.scans', { count: session.scan_count })}</span>
                          {' · '}
                          <TimeAgo iso={session.created_at} />
                        </>
                      }
                      onSelect={() => viewSession(session.session_id)}
                      action={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('dashboard.deleteSessionLabel', { name })}
                          onClick={() => handleDeleteSession(session.session_id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      }
                    />
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
