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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Session } from '@/types';
import { ModeToggle } from '@/components/mode-toggle';
import { RotateCcw, Trash2, Clock } from 'lucide-react';

const DELETION_DAYS = 30;

function getRemainingTime(deletedAt: string | null): { days: number; hours: number; text: string } {
  if (!deletedAt) return { days: 0, hours: 0, text: '알 수 없음' };

  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + DELETION_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, text: '만료됨' };
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return { days, hours, text: `${days}일 ${hours}시간 남음` };
  } else {
    return { days, hours, text: `${hours}시간 남음` };
  }
}

function getRemainingBadgeVariant(days: number): 'default' | 'secondary' | 'destructive' {
  if (days <= 3) return 'destructive';
  if (days <= 7) return 'secondary';
  return 'default';
}

export default function TrashPage() {
  const [deletedSessions, setDeletedSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeletedSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?status=DELETED');
      if (res.ok) {
        const data = await res.json();
        setDeletedSessions(data);
      }
    } catch (err) {
      console.error('삭제된 세션 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedSessions();

    // 사이드바 새로고침 이벤트 리스너
    const handleRefresh = () => {
      fetchDeletedSessions();
    };
    window.addEventListener('sidebar-refresh', handleRefresh);

    return () => {
      window.removeEventListener('sidebar-refresh', handleRefresh);
    };
  }, [fetchDeletedSessions]);

  const handleRestore = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || '복구 실패');
      }
    } catch (error) {
      console.error('세션 복구 실패:', error);
      alert('세션 복구 중 오류가 발생했습니다.');
    }
  };

  const handlePermanentDelete = async (sessionId: string) => {
    if (!confirm('세션을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/permanent`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || '영구 삭제 실패');
      }
    } catch (error) {
      console.error('세션 영구 삭제 실패:', error);
      alert('세션 영구 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteExpired = async () => {
    if (!confirm('만료된 세션을 모두 영구 삭제하시겠습니까?')) return;

    try {
      const res = await fetch('/api/sessions/cleanup', {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        alert(`${data.deletedCount}개의 만료된 세션이 삭제되었습니다.`);
        fetchDeletedSessions();
        window.dispatchEvent(new CustomEvent('sidebar-refresh'));
      } else {
        const data = await res.json();
        alert(data.error || '정리 실패');
      }
    } catch (error) {
      console.error('만료된 세션 정리 실패:', error);
      alert('만료된 세션 정리 중 오류가 발생했습니다.');
    }
  };

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
                  <BreadcrumbLink href="/dashboard">대시보드</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>삭제대기</BreadcrumbPage>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">삭제대기 세션</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    삭제 후 {DELETION_DAYS}일이 지나면 자동으로 영구 삭제됩니다.
                  </p>
                </div>
                {deletedSessions.some(s => getRemainingTime(s.deleted_at).days === 0) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteExpired}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    만료된 세션 정리
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  로딩 중...
                </p>
              ) : deletedSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  삭제대기 중인 세션이 없습니다.
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
                                  {remaining.text}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                스캔 수: {session.scan_count} |
                                삭제일: {session.deleted_at ? new Date(session.deleted_at).toLocaleString('ko-KR') : '-'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(session.session_id)}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                복구
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handlePermanentDelete(session.session_id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                영구 삭제
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
    </SidebarProvider>
  );
}
