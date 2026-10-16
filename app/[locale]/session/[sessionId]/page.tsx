'use client';

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { AppSidebar } from '@/components/app-sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { notify } from '@/lib/notify';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/form/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ShieldX, Plug, Unplug, ChevronDown, ChevronUp, CircleAlert } from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { createColumns, createReadOnlyColumns } from '@/components/scan-table-columns';
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
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [copied, setCopied] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isSessionInfoCollapsed, setIsSessionInfoCollapsed] = useState(false);

  // 세션 접근 제어 상태
  const [sessionSettings, setSessionSettings] = useState<SessionSettings | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  // 비밀번호 검증 성공 시 서버가 발급한 세션 접근 토큰 (소켓 join-session 에 제시)
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(null);

  // 인증이 필요한 API 호출용 헤더
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  // 접근 허용 후에만 소켓 연결 (비밀번호 보호 세션 보안)
  const { scans, isConnected, error, removeScan, removeScans } = useSocket(
    sessionId,
    user?.id,
    isLoading,
    accessGranted, // 접근 허용 전까지 소켓 연결 차단
    { accessToken, sessionAccessToken }
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
      } catch {
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
      } catch {
        // 이름이 없으면 세션 ID 로 표시
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
        setSessionAccessToken(data.sessionAccessToken || null);
        setAccessGranted(true);
        setPasswordModalOpen(false);
        notify.success(t('session.accessGranted'));
      } else {
        setPasswordError(t('session.wrongPassword'));
      }
    } catch {
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
      // 최신 스캔은 배열의 마지막에 있음
      const latestScan = scans[scans.length - 1];
      const scanDescription = newScansCount > 1
        ? t('session.newScansCount', { count: newScansCount })
        : latestScan?.code?.substring(0, 50) || '';

      // 사운드 알림
      if (settings.scanSound) {
        playNotificationSound(settings.soundVolume, settings.soundType);
      }

      // 브라우저 알림
      if (settings.browserNotification) {
        showBrowserNotification(t('session.newScanReceived'), scanDescription);
      }

      // 토스트 알림
      notify.success(t('session.newScanReceived'), {
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
      notify.success(t('session.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(t('session.copyFailed'));
    }
  }, [sessionId, t]);

  // URL 복사
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify.success(t('session.urlCopied'));
    } catch {
      notify.error(t('session.copyFailed'));
    }
  }, [t]);

  const handleDeleteScan = useCallback(async (scanId: number) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (res.ok) {
        removeScan(scanId);
        notify.success(t('session.scanDeleted'));
      } else {
        notify.error(t('session.deleteFailed'));
      }
    } catch {
      notify.error(t('session.deleteError'));
    }
  }, [removeScan, t, authHeaders]);

  const handleDeleteSelected = useCallback(async (ids: number[]) => {
    try {
      const res = await fetch('/api/scans/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        const data = await res.json();
        // 서버는 권한이 있는 스캔만 삭제하고 실제 삭제된 ID를 돌려준다
        const deletedIds: number[] = Array.isArray(data.deletedIds) ? data.deletedIds : ids;
        removeScans(deletedIds);
        notify.success(t('session.scansDeleted', { count: deletedIds.length }));
      } else {
        notify.error(t('session.deleteFailed'));
      }
    } catch {
      notify.error(t('session.deleteError'));
    }
  }, [removeScans, t, authHeaders]);

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
    const loadingToast = notify.loading(t('session.exporting'));
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`, {
        headers: authHeaders,
      });

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

      notify.dismiss(loadingToast);
      notify.success(t('session.exportSuccess'));
    } catch {
      notify.dismiss(loadingToast);
      notify.error(t('session.exportError'));
    }
  };

  const displayName = sessionName || sessionId;

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
              <BreadcrumbPage className="block truncate">{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );

  // 비공개 세션 차단 화면
  if (!settingsLoading && sessionSettings && !sessionSettings.isPublic) {
    return (
      <SidebarProvider>
        <AppSidebar currentSessionId={sessionId} />
        <SidebarInset>
          {header}
          <div className="page flex min-h-[60vh] flex-1 flex-col items-center justify-center py-10">
            <Card className="enter w-full max-w-md text-center">
              <CardHeader className="items-center">
                <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                  <ShieldX className="size-7" aria-hidden="true" />
                </div>
                <h1 className="type-h2">{t('session.privateSession')}</h1>
                <CardDescription>{t('session.privateSessionDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-13 text-muted-foreground">
                  {t('session.sessionId')}: <span className="break-all font-mono font-semibold text-foreground">{sessionId}</span>
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
          {header}
          <div className="page flex min-h-[60vh] flex-1 flex-col items-center justify-center py-10">
            <Card className="enter w-full max-w-md">
              <CardHeader className="items-center text-center">
                <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Lock className="size-7" aria-hidden="true" />
                </div>
                <h1 className="type-h2">{t('session.passwordProtected')}</h1>
                <CardDescription>{t('session.passwordProtectedDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordSubmit();
                  }}
                >
                  <Field label={t('session.password')} id="session-password" error={passwordError}>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      autoFocus
                    />
                  </Field>
                  <Button type="submit" size="xl" disabled={verifyingPassword} className="w-full">
                    {verifyingPassword ? t('session.unlocking') : t('session.unlock')}
                  </Button>
                  <p className="text-center text-13 text-muted-foreground">
                    {t('session.sessionId')}: <span className="break-all font-mono">{sessionId}</span>
                  </p>
                </form>
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
        {header}

        <div className="page grid gap-4 py-6 pb-16 sm:py-8">
          <Card className="enter" style={{ '--i': 0 } as CSSProperties}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="type-h2 min-w-0 flex-1 break-all">{displayName}</h1>
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* 연결 상태: 색만이 아니라 글자로도 */}
                  <span
                    role="status"
                    className={
                      isConnected
                        ? 'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3 text-13 font-semibold text-foreground'
                        : 'inline-flex h-[34px] items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive-soft px-3 text-13 font-semibold text-destructive'
                    }
                  >
                    {isConnected ? (
                      <Plug className="size-4" aria-hidden="true" />
                    ) : (
                      <Unplug className="size-4" aria-hidden="true" />
                    )}
                    {isConnected ? t('session.connected') : t('session.disconnected')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateSettings({ scanSound: !settings.scanSound })}
                    aria-label={settings.scanSound ? t('session.soundOff') : t('session.soundOn')}
                    title={settings.scanSound ? t('session.soundOff') : t('session.soundOn')}
                  >
                    {settings.scanSound ? (
                      <Volume2 aria-hidden="true" />
                    ) : (
                      <VolumeX className="text-muted-foreground" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIsSessionInfoCollapsed(!isSessionInfoCollapsed)}
                    aria-expanded={!isSessionInfoCollapsed}
                    aria-controls="session-info"
                    aria-label={isSessionInfoCollapsed ? t('session.expandInfo') : t('session.collapseInfo')}
                  >
                    {isSessionInfoCollapsed ? (
                      <ChevronDown aria-hidden="true" />
                    ) : (
                      <ChevronUp aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR 코드와 세션 ID (접기 가능) */}
              {!isSessionInfoCollapsed && (
                <div id="session-info" className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                  {/* QR 은 어두운 화면에서도 인식되도록 흰 바탕을 유지 */}
                  <div className="shrink-0 rounded-field border bg-white p-1">
                    <QRCodeSVG
                      value={`https://scanview.app/session/${sessionId}`}
                      size={160}
                      level="M"
                      includeMargin={true}
                      role="img"
                      aria-label={t('session.qrLabel', { id: sessionId })}
                    />
                  </div>

                  <div className="w-full min-w-0 flex-1">
                    <p className="mb-2 text-13 font-semibold text-muted-foreground">{t('session.sessionId')}</p>
                    <div className="flex items-center gap-2 rounded-field bg-secondary px-4 py-3">
                      <span className="type-h2 min-w-0 flex-1 break-all font-mono">{sessionId}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleCopySessionId}
                        aria-label={t('session.copySessionId')}
                      >
                        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                        <Copy aria-hidden="true" />
                        {t('session.copyUrl')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-field bg-destructive-soft p-3 text-13 font-semibold text-destructive">
                  <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
                  <span>{t('session.connectionError')}</span>
                </p>
              )}
            </CardHeader>
          </Card>

          <Card className="enter min-w-0" style={{ '--i': 1 } as CSSProperties}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="type-h3">{t('session.scanData')}</h2>
                <Badge variant="secondary" className="tabular">{scans.length} {t('session.items')}</Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="min-w-0 pt-5 sm:pt-6">
              {isLoading ? (
                <div className="grid gap-3" aria-busy="true">
                  <span className="sr-only" role="status">{t('common.loading')}</span>
                  <Skeleton className="h-10 w-full max-w-sm rounded-full" />
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {isAuthenticated && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        disabled={scans.length === 0}
                      >
                        <Download aria-hidden="true" />
                        {t('session.exportCsv')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('xlsx')}
                        disabled={scans.length === 0}
                      >
                        <FileSpreadsheet aria-hidden="true" />
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
