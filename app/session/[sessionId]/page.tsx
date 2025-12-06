'use client';

import { useSocket } from '@/hooks/use-socket';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { scans, isConnected, error } = useSocket(sessionId);

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
          <div className="flex items-center gap-2 px-4">
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
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">세션: {sessionId}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? '연결됨' : '연결 끊김'}
                  </Badge>
                </div>
              </div>
              {error && (
                <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  ⚠️ {error}
                </div>
              )}
              <div className="flex gap-2 mt-4">
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
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  총 스캔 수: <span className="font-bold">{scans.length}</span>
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">번호</TableHead>
                    <TableHead>바코드 값</TableHead>
                    <TableHead>스캔 시간</TableHead>
                    <TableHead className="text-right">저장 시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        스캔된 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scans.map((scan, index) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono">{scan.code}</TableCell>
                        <TableCell>
                          {new Date(scan.scan_timestamp).toLocaleString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(scan.createdAt).toLocaleString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
