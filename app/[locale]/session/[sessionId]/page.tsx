'use client';

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { AppSidebar } from '@/components/app-sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldX, Plug, Unplug, ChevronDown, ChevronUp } from 'lucide-react';

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
function playNotificationSound(volume: number = 50, soundType: 'default' | 'beep' | 'none' = 'default') {
  if (soundType === 'none') return;

  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 볼륨 설정 (0-100을 0-0.5로 변환)
    const normalizedVolume = (volume / 100) * 0.5;

    // 사운드 타입에 따른 설정
    if (soundType === 'beep') {
      oscillator.frequency.value = 1000;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(normalizedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else {
      // default sound
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(normalizedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch {
    // 오디오 재생 실패 무시
  }
}

// 브라우저 알림 표시
async function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
    }
  }
}

// 세션 설정 타입
interface SessionSettings {
  sessionId: string;
  hasPassword: boolean;
  isPublic: boolean;
  accessCode: string | null;
  maxParticipants: number | null;
  allowAnonymous: boolean;
  expiresAt: string | null;
}

export default function SessionPage() {
  const t = useTranslations();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [copied, setCopied] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isSessionInfoCollapsed, setIsSessionInfoCollapsed] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // 현재 URL 가져오기 (클라이언트 사이드)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // 세션 접근 제어 상태
  const [sessionSettings, setSessionSettings] = useState<SessionSettings | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // 접근 허용 후에만 소켓 연결 (비밀번호 보호 세션 보안)
  const { scans, isConnected, error, removeScan, removeScans } = useSocket(
    sessionId,
    user?.id,
    isLoading,
    accessGranted // 접근 허용 전까지 소켓 연결 차단
  );

  const prevScansLengthRef = useRef(scans.length);

  // 세션 설정 및 세션 정보 로드
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/settings`);
        if (res.ok) {
          const settings: SessionSettings = await res.json();
          setSessionSettings(settings);

          // 접근 권한 확인
          if (!settings.isPublic) {
            // 비공개 세션 - 접근 불가
            setAccessGranted(false);
          } else if (settings.hasPassword) {
            // 비밀번호 보호 세션 - 비밀번호 입력 필요
            setPasswordModalOpen(true);
            setAccessGranted(false);
          } else {
            // 공개 세션 - 접근 허용
            setAccessGranted(true);
          }
        } else {
          // 설정이 없으면 기본적으로 접근 허용
          setAccessGranted(true);
        }
      } catch (err) {
        console.error('Failed to fetch session settings:', err);
        // 오류 시 기본적으로 접근 허용
        setAccessGranted(true);
      } finally {
        setSettingsLoading(false);
      }
    };

    // 세션 이름 가져오기
    const fetchSessionName = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionName(data.session_name || null);
        }
      } catch (err) {
        console.error('Failed to fetch session name:', err);
      }
    };

    if (sessionId) {
      fetchSettings();
      fetchSessionName();
    }
  }, [sessionId]);

  // 비밀번호 검증
  const handlePasswordSubmit = useCallback(async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('session.passwordRequired'));
      return;
    }

    setVerifyingPassword(true);
    setPasswordError('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();

      if (data.accessGranted) {
        setAccessGranted(true);
        setPasswordModalOpen(false);
        toast.success(t('session.accessGranted'));
      } else {
        setPasswordError(t('session.wrongPassword'));
      }
    } catch (err) {
      console.error('Password verification failed:', err);
      setPasswordError(t('session.verifyError'));
    } finally {
      setVerifyingPassword(false);
    }
  }, [passwordInput, sessionId, t]);

  // 비로그인 사용자: 방문한 세션을 localStorage에 저장
  useEffect(() => {
    if (!isLoading && !isAuthenticated && sessionId) {
      addVisitedSession(sessionId);
    }
  }, [isLoading, isAuthenticated, sessionId]);

  // 새 스캔 도착 시 사운드 재생 및 알림 표시
  useEffect(() => {
    if (scans.length > prevScansLengthRef.current) {
      const newScansCount = scans.length - prevScansLengthRef.current;
      const scanDescription = newScansCount > 1
        ? t('session.newScansCount', { count: newScansCount })
        : scans[0]?.code?.substring(0, 50) || '';

      // 사운드 알림
      if (settings.scanSound) {
        playNotificationSound(settings.soundVolume, settings.soundType);
      }

      // 브라우저 알림
      if (settings.browserNotification) {
        showBrowserNotification(t('session.newScanReceived'), scanDescription);
      }

      // 토스트 알림
      toast.success(t('session.newScanReceived'), {
        description: scanDescription,
      });
    }
    prevScansLengthRef.current = scans.length;
  }, [scans.length, settings.scanSound, settings.soundVolume, settings.soundType, settings.browserNotification, scans, t]);

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

  const formatOptions = useMemo(() => ({
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
  }), [settings.dateFormat, settings.timeFormat]);

  const columns = useMemo(
    () => isAuthenticated
      ? createColumns(handleDeleteScan, formatOptions)
      : createReadOnlyColumns(formatOptions),
    [handleDeleteScan, isAuthenticated, formatOptions]
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

  // 비공개 세션 차단 화면
  if (!settingsLoading && sessionSettings && !sessionSettings.isPublic) {
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
                    <BreadcrumbPage>{t('session.title')}: {sessionName || sessionId}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 flex items-center gap-2">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0 min-h-[60vh]">
            <Card className="max-w-md w-full text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <ShieldX className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-xl">{t('session.privateSession')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('session.privateSessionDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('session.sessionId')}: <span className="font-mono font-medium">{sessionId}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // 비밀번호 보호 세션 - 비밀번호 입력 화면 (데이터 렌더링하지 않음)
  if (!settingsLoading && sessionSettings?.hasPassword && !accessGranted) {
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
                    <BreadcrumbPage>{t('session.title')}: {sessionName || sessionId}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 flex items-center gap-2">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0 min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('session.passwordProtected')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('session.passwordProtectedDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-password">{t('session.password')}</Label>
                  <Input
                    id="session-password"
                    type="password"
                    placeholder={t('session.passwordPlaceholder')}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordSubmit();
                      }
                    }}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={verifyingPassword}
                  className="w-full"
                >
                  {verifyingPassword ? t('common.loading') : t('session.unlock')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('session.sessionId')}: <span className="font-mono">{sessionId}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BreadcrumbPage>{t('session.title')}: {sessionName || sessionId}</BreadcrumbPage>
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
                  <CardTitle className="text-2xl">{sessionName || sessionId}</CardTitle>
                  <CardDescription className="mt-1">
                    {t('session.sessionCodeDesc')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateSettings({ scanSound: !settings.scanSound })}
                    title={settings.scanSound ? t('session.soundOff') : t('session.soundOn')}
                  >
                    {settings.scanSound ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSessionInfoCollapsed(!isSessionInfoCollapsed)}
                  >
                    {isSessionInfoCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <div
                    className="flex items-center gap-1.5"
                    title={isConnected ? t('session.connected') : t('session.disconnected')}
                  >
                    {isConnected ? (
                      <Plug className="h-5 w-5 text-green-500" />
                    ) : (
                      <Unplug className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code & Session ID - Collapsible */}
              {!isSessionInfoCollapsed && (
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code */}
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={currentUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/session/${sessionId}`}
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
              )}

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
