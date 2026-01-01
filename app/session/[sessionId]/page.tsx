'use client';

import { useMemo, useCallback } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, LogIn } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { createColumns } from '@/components/scan-table-columns';
import { ModeToggle } from '@/components/mode-toggle';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  // userId를 직접 전달하여 서버에서 필터링
  const { scans, isConnected, error, removeScan, removeScans } = useSocket(sessionId, user?.id);

  const handleDeleteScan = useCallback(async (scanId: number) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        removeScan(scanId);
      } else {
        const data = await res.json();
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('스캔 데이터 삭제 실패:', error);
      alert('스캔 데이터 삭제 중 오류가 발생했습니다.');
    }
  }, [removeScan]);

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
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('다중 스캔 데이터 삭제 실패:', error);
      alert('스캔 데이터 삭제 중 오류가 발생했습니다.');
    }
  }, [removeScans]);

  const columns = useMemo(() => createColumns(handleDeleteScan), [handleDeleteScan]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error('내보내기 실패');
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
      alert('데이터 내보내기에 실패했습니다.');
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
                  <BreadcrumbLink href="/dashboard">대시보드</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>세션: {sessionId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* 세션 코드 표시 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">세션 코드</CardTitle>
                  <CardDescription className="mt-1">
                    앱에서 이 코드를 입력하거나 QR코드를 스캔하세요
                  </CardDescription>
                </div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? '연결됨' : '연결 끊김'}
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

          {/* 스캔 데이터 카드 - 로그인 필요 */}
          <Card>
            <CardHeader>
              <CardTitle>스캔 데이터</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    스캔 데이터를 보려면 로그인이 필요합니다
                  </div>
                  <Button onClick={() => router.push('/login')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    로그인하기
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('csv')}
                      disabled={scans.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV 내보내기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('xlsx')}
                      disabled={scans.length === 0}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel 내보내기
                    </Button>
                  </div>
                  <ScanDataTable columns={columns} data={scans} onDeleteSelected={handleDeleteSelected} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
