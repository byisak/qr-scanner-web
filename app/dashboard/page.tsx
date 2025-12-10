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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { ModeToggle } from '@/components/mode-toggle';
import { Trash2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('세션 목록 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);

    // 사이드바 새로고침 이벤트 리스너
    const handleRefresh = () => {
      fetchSessions();
    };
    window.addEventListener('sidebar-refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sidebar-refresh', handleRefresh);
    };
  }, [fetchSessions]);

  const viewSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('세션을 삭제하시겠습니까?')) return;

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
                  <BreadcrumbPage>대시보드</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">활성 세션 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  활성 세션이 없습니다. 앱에서 세션을 생성하세요.
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
                              스캔 수: {session.scan_count} | 생성: {new Date(session.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => viewSession(session.session_id)}>
                              보기
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
