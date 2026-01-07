'use client';

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/components/ui/sonner';

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
import { Download, FileSpreadsheet, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { createColumns, createReadOnlyColumns } from '@/components/scan-table-columns';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from 'next-intl';

// 스캔 알림 사운드 재생
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // 오디오 재생 실패 무시
  }
}

export default function SessionPage() {
  const t = useTranslations();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { scans, isConnected, error, removeScan, removeScans } = useSocket(sessionId, user?.id, isLoading);

  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevScansLengthRef = useRef(scans.length);

  // 비로그인 사용자: 방문한 세션을 localStorage에 저장
  useEffect(() => {
    if (!isLoading && !isAuthenticated && sessionId) {
      addVisitedSession(sessionId);
    }
  }, [isLoading, isAuthenticated, sessionId]);

  // 새 스캔 도착 시 사운드 재생 및 토스트 표시
  useEffect(() => {
    if (scans.length > prevScansLengthRef.current) {
      const newScansCount = scans.length - prevScansLengthRef.current;

      if (soundEnabled) {
        playNotificationSound();
      }

      toast.success(t('session.newScanReceived'), {
        description: newScansCount > 1
          ? t('session.newScansCount', { count: newScansCount })
          : scans[0]?.qr_code?.substring(0, 50) || '',
      });
    }
    prevScansLengthRef.current = scans.length;
  }, [scans.length, soundEnabled, scans, t]);

  // 세션 ID 복사
  const handleCopySessionId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast.success(t('session.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('session.copyFailed'));
    }
  }, [sessionId, t]);

  // URL 복사
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('session.urlCopied'));
    } catch {
      toast.error(t('session.copyFailed'));
    }
  }, [t]);

  const handleDeleteScan = useCallback(async (scanId: number) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        removeScan(scanId);
        toast.success(t('session.scanDeleted'));
      } else {
        const data = await res.json();
        toast.error(data.error || t('session.deleteFailed'));
      }
    } catch (error) {
      console.error('Scan data delete failed:', error);
      toast.error(t('session.deleteError'));
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
        toast.success(t('session.scansDeleted', { count: ids.length }));
      } else {
        const data = await res.json();
        toast.error(data.error || t('session.deleteFailed'));
      }
    } catch (error) {
      console.error('Bulk scan data delete failed:', error);
      toast.error(t('session.deleteError'));
    }
  }, [removeScans, t]);

  const columns = useMemo(
    () => isAuthenticated ? createColumns(handleDeleteScan) : createReadOnlyColumns(),
    [handleDeleteScan, isAuthenticated]
  );

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const loadingToast = toast.loading(t('session.exporting'));
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

      toast.dismiss(loadingToast);
      toast.success(t('session.exportSuccess'));
    } catch (err) {
      console.error('Export error:', err);
      toast.dismiss(loadingToast);
      toast.error(t('session.exportError'));
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? t('session.soundOff') : t('session.soundOn')}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? t('session.connected') : t('session.disconnected')}
                  </Badge>
                </div>
              </div>

              {/* QR Code & Session ID */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG
                    value={`scanview://${sessionId}`}
                    size={160}
                    level="M"
                    includeMargin={true}
                  />
                </div>

                {/* Session ID & Actions */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider">
                        {sessionId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopySessionId}
                        className="h-8 w-8"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                      <Copy className="mr-2 h-3 w-3" />
                      {t('session.copyUrl')}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('session.scanQrOrEnterCode')}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('session.scanData')}</CardTitle>
                <Badge variant="secondary">{scans.length} {t('session.items')}</Badge>
              </div>
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
