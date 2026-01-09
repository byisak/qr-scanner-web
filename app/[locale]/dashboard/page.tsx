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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Trash2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

// 방문한 세션을 localStorage에 저장/조회하는 유틸리티
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
  const [visitedSessions, setVisitedSessions] = useState<VisitedSession[]>([]);
  const t = useTranslations();
  const locale = useLocale();

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
      setSessions(data);
    } catch (err) {
      console.error('세션 목록 로드 실패:', err);
    }
  }, [isAuthenticated, accessToken]);

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
    } else {
      // 비로그인 사용자: localStorage에서 방문한 세션 조회
      setVisitedSessions(getVisitedSessions());
    }
  }, [isAuthenticated, fetchSessions]);

  const viewSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t('dashboard.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      alert('세션 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar onSessionChange={fetchSessions} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
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
          <div className="px-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">{t('common.loading')}</p>
              </CardContent>
            </Card>
          ) : isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('dashboard.activeSessions')}</CardTitle>
                <CardDescription>{t('dashboard.mySessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('dashboard.noSessions')}
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {sessions.map((session) => (
                      <Card key={session.session_id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-sm font-semibold">{session.session_id}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('dashboard.scanCount')}: {session.scan_count} | {t('dashboard.created')}: {new Date(session.created_at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => viewSession(session.session_id)}>
                                {t('dashboard.view')}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteSession(session.session_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{t('dashboard.loginRequired')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.loginRequiredDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/login">
                      <Button>
                        <LogIn className="mr-2 h-4 w-4" />
                        {t('auth.login')}
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline">{t('auth.register')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {visitedSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.recentlyVisited')}</CardTitle>
                    <CardDescription>{t('dashboard.recentlyVisitedDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {visitedSessions.map((visited) => (
                        <Card key={visited.sessionId}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-mono text-sm font-semibold">{visited.sessionId}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t('dashboard.visitedAt')}: {new Date(visited.visitedAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                                </p>
                              </div>
                              <Button onClick={() => viewSession(visited.sessionId)}>
                                {t('dashboard.view')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
