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
import { Lock, ShieldX, Plug, Unplug, ChevronDown, ChevronUp, CircleAlert, Smartphone, Send, MonitorCheck } from 'lucide-react';

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
import { Download, FileSpreadsheet, Copy, Check, Volume2, VolumeX, Clock, Keyboard } from 'lucide-react';
import { Empty } from '@/components/ui/empty';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { createColumns, createReadOnlyColumns } from '@/components/scan-table-columns';
import { CodeSummaryTable, summarizeByCode } from '@/components/code-summary-table';
import { Segmented } from '@/components/ui/segmented';
import { SessionShareDialog } from '@/components/session-share-dialog';
import { SessionSheetDialog } from '@/components/session-sheet-dialog';
import { useLocale, useTranslations } from 'next-intl';

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
  // 소유자·관리자 (비공개·비밀번호여도 들어갈 수 있고 공유 설정을 바꿀 수 있다)
  canManage?: boolean;
}

export default function SessionPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [copied, setCopied] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isSessionInfoCollapsed, setIsSessionInfoCollapsed] = useState(false);
  // 사용자가 QR 카드를 직접 접거나 펼쳤으면 자동으로 접지 않는다
  const infoToggledRef = useRef(false);
  // 방금 들어온 스캔 id (행 강조용, 몇 초 뒤 지운다)
  const [highlightIds, setHighlightIds] = useState<ReadonlySet<number>>(() => new Set());
  // 창을 안 보고 있을 때 쌓인 새 스캔 수 (탭 제목에 표시)
  const [hiddenCount, setHiddenCount] = useState(0);
  // 표 보기: 스캔 기록 / 코드별 합계. 검색어는 두 보기와 내보내기가 같이 쓴다
  const [view, setView] = useState<'scans' | 'summary'>('scans');
  const [search, setSearch] = useState('');
  // 기간: 전체 / 최근 1시간 / 오늘 / 최근 7일 (두 보기와 내보내기가 같이 쓴다)
  const [period, setPeriod] = useState<'all' | '1h' | 'today' | '7d'>('all');
  const [hotkeyHelpOpen, setHotkeyHelpOpen] = useState(false);
  // 상대 시간("3초 전")을 새로 그리기 위한 시계
  const [now, setNow] = useState(() => Date.now());

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

  // 연결된 뒤에 처음 보는 스캔만 "새 스캔"으로 친다 (처음 불러온 기록은 제외)
  const seenIdsRef = useRef<Set<number> | null>(null);

  // 세션 설정 및 세션 정보 로드
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/settings`, { headers: authHeaders });
        if (res.ok) {
          const settings: SessionSettings = await res.json();
          setSessionSettings(settings);

          // 접근 권한 확인
          if (settings.canManage) {
            // 소유자·관리자는 공개 범위와 관계없이 본다
            setAccessGranted(true);
          } else if (!settings.isPublic) {
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

    // 로그인 확인이 끝난 뒤에 불러와야 소유자 여부를 알 수 있다
    if (sessionId && !isLoading) {
      fetchSettings();
      fetchSessionName();
    }
  }, [sessionId, isLoading, authHeaders]);

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

  // 새 스캔 도착: 소리·브라우저 알림, 행 강조, 탭 제목 숫자. 화면을 덮는 토스트는 띄우지 않는다
  useEffect(() => {
    if (!seenIdsRef.current) {
      if (!isConnected) return;
      seenIdsRef.current = new Set(scans.map((s) => s.id));
      if (scans.length > 0 && !infoToggledRef.current) setIsSessionInfoCollapsed(true);
      return;
    }
    const seen = seenIdsRef.current;
    const wasEmpty = seen.size === 0;
    const fresh = scans.filter((s) => !seen.has(s.id));
    if (fresh.length === 0) return;
    fresh.forEach((s) => seen.add(s.id));

    const latestScan = fresh[fresh.length - 1];
    const scanDescription = fresh.length > 1
      ? t('session.newScansCount', { count: fresh.length })
      : latestScan?.code?.substring(0, 50) || '';

    if (settings.scanSound) {
      playNotificationSound(settings.soundVolume, settings.soundType);
    }
    if (settings.browserNotification) {
      showBrowserNotification(t('session.newScanReceived'), scanDescription);
    }

    // 첫 스캔이 들어오면 QR 카드는 할 일을 다 했으니 접는다
    if (wasEmpty && !infoToggledRef.current) setIsSessionInfoCollapsed(true);

    setHighlightIds((prev) => new Set([...prev, ...fresh.map((s) => s.id)]));
    const ids = fresh.map((s) => s.id);
    window.setTimeout(() => {
      setHighlightIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, 3200);

    if (document.hidden) setHiddenCount((n) => n + fresh.length);
  }, [scans, isConnected, settings.scanSound, settings.soundVolume, settings.soundType, settings.browserNotification, t]);

  // 탭 제목에 안 본 새 스캔 수 "(3)". 탭으로 돌아오면 지운다
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setHiddenCount(0);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // "방금 스캔 · 3초 전" 갱신
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

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

  // 기간 시작 시각(밀리초). 전체면 null. now 는 15초마다 갱신된다
  const since = useMemo(() => {
    if (period === 'all') return null;
    if (period === '1h') return now - 3600 * 1000;
    if (period === '7d') return now - 7 * 86400 * 1000;
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [period, now]);

  // 기간 안의 스캔. 표의 # 이 들어온 순서가 되도록 id(서버 저장 순서) 오름차순
  const periodScans = useMemo(
    () => (since === null ? scans : scans.filter((s) => s.scan_timestamp >= since)),
    [scans, since]
  );
  const orderedScans = useMemo(() => [...periodScans].sort((a, b) => a.id - b.id), [periodScans]);

  // 마지막 스캔 카드: 가장 최근 스캔과 오늘 건수·코드 종류·중복
  const summary = useMemo(() => {
    if (scans.length === 0) return null;
    let latest = scans[0];
    for (const s of scans) {
      if (s.scan_timestamp > latest.scan_timestamp || (s.scan_timestamp === latest.scan_timestamp && s.id > latest.id)) latest = s;
    }
    const today = new Date().toDateString();
    const todayCount = scans.filter((s) => new Date(s.scan_timestamp).toDateString() === today).length;
    const distinct = new Set(scans.map((s) => s.code)).size;
    const latestRepeat = scans.filter((s) => s.code === latest.code).length;
    return { latest, todayCount, distinct, duplicates: scans.length - distinct, latestRepeat };
  }, [scans]);

  const relativeTime = useCallback((ts: number) => {
    const sec = Math.round((ts - now) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(sec) < 60) return rtf.format(Math.min(0, sec), 'second');
    const min = Math.round(sec / 60);
    if (Math.abs(min) < 60) return rtf.format(min, 'minute');
    const hour = Math.round(min / 60);
    if (Math.abs(hour) < 24) return rtf.format(hour, 'hour');
    return rtf.format(Math.round(hour / 24), 'day');
  }, [locale, now]);

  const summaryRows = useMemo(() => summarizeByCode(periodScans), [periodScans]);

  // 지금 보이는 범위: 검색 결과 건수 (내보내기 안내용)
  const visibleCount = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (view === 'summary') {
      return q ? summaryRows.filter((r) => r.code.toLowerCase().includes(q)).length : summaryRows.length;
    }
    return q ? periodScans.filter((s) => s.code.toLowerCase().includes(q)).length : periodScans.length;
  }, [view, search, periodScans, summaryRows]);

  // 보이는 대로 내보내기: 지금 보기(스캔 기록/코드별)와 검색어를 그대로 서버에 넘긴다
  const handleExport = async (format: 'csv' | 'xlsx') => {
    const loadingToast = notify.loading(t('session.exporting'));
    try {
      const q = new URLSearchParams({ format, view, lang: locale });
      if (search.trim()) q.set('q', search.trim());
      if (since !== null) q.set('since', String(since));
      if (sessionName) q.set('name', sessionName);
      const response = await fetch(`/api/sessions/${sessionId}/export?${q}`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(t('session.exportFailed'));
      }

      // 서버가 정한 파일 이름 (세션 이름_날짜). 못 읽으면 세션 ID
      const cd = response.headers.get('content-disposition') || '';
      const star = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const fileName = star
        ? decodeURIComponent(star[1])
        : `session-${sessionId}-${new Date().toISOString().split('T')[0]}.${format}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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

  // 키보드 단축키: / 검색, v 보기 전환, e CSV 내보내기, ? 도움말
  useHotkeys({
    '/': () => document.querySelector<HTMLInputElement>('[data-scan-search]')?.focus(),
    v: () => scans.length > 0 && setView((cur) => (cur === 'scans' ? 'summary' : 'scans')),
    e: () => {
      if (isAuthenticated && visibleCount > 0) handleExport('csv');
    },
    '?': () => setHotkeyHelpOpen(true),
  }, accessGranted);

  const displayName = sessionName || sessionId;

  // 탭 제목: 안 본 새 스캔이 있으면 앞에 "(3)"
  useEffect(() => {
    const base = `${displayName} · ScanView`;
    document.title = hiddenCount > 0 ? `(${hiddenCount}) ${base}` : base;
  }, [hiddenCount, displayName]);

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
  if (!settingsLoading && sessionSettings && !sessionSettings.isPublic && !sessionSettings.canManage) {
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
  if (!settingsLoading && sessionSettings?.hasPassword && !accessGranted && !sessionSettings.canManage) {
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
                {/* 좁은 화면: 제목은 한 줄 전체, 버튼은 아래 줄 */}
                <h1 className="type-h2 min-w-0 flex-1 basis-full break-all sm:basis-0">{displayName}</h1>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {/* 공유·공개 범위: 세션 주인(또는 관리자)만 */}
                  {sessionSettings?.canManage && (
                    <SessionShareDialog
                      sessionId={sessionId}
                      isPublic={sessionSettings.isPublic}
                      hasPassword={sessionSettings.hasPassword}
                      authHeaders={authHeaders}
                      onSaved={(next) => setSessionSettings((prev) => (prev ? { ...prev, ...next } : prev))}
                    />
                  )}
                  {/* 구글 시트로 보내기: 세션 주인(또는 관리자)만 */}
                  {sessionSettings?.canManage && (
                    <SessionSheetDialog sessionId={sessionId} authHeaders={authHeaders} />
                  )}
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
                  {/* 단축키 도움말: 키보드가 있는 넓은 화면에서만 */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hidden sm:inline-flex"
                    onClick={() => setHotkeyHelpOpen(true)}
                    aria-label={t('hotkeys.title')}
                    title={`${t('hotkeys.title')} (?)`}
                  >
                    <Keyboard aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                      infoToggledRef.current = true;
                      setIsSessionInfoCollapsed(!isSessionInfoCollapsed);
                    }}
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

              {/* 마지막 스캔: 멀리서 PC 화면으로 확인할 수 있게 크게 */}
              {summary && (
                <div className="mt-4 rounded-field bg-secondary px-4 py-3" aria-live="polite">
                  <p className="text-13 font-semibold text-muted-foreground">
                    {t('session.lastScan')} · <span className="tabular">{relativeTime(summary.latest.scan_timestamp)}</span>
                  </p>
                  <p className="type-h1 mt-1 break-all font-mono">{summary.latest.code}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-13 text-muted-foreground">
                    <span className="tabular">{t('session.todayCount', { count: summary.todayCount })}</span>
                    <span className="tabular">{t('session.distinctCodes', { count: summary.distinct })}</span>
                    {summary.duplicates > 0 && (
                      // 누르면 코드별 합계로 (어떤 코드가 중복인지 바로 보게)
                      <button
                        type="button"
                        className="tabular underline underline-offset-4 hover:text-foreground"
                        onClick={() => setView('summary')}
                      >
                        {t('session.duplicateScans', { count: summary.duplicates })}
                      </button>
                    )}
                    {summary.latestRepeat > 1 && (
                      <span className="tabular font-semibold text-foreground">{t('session.scannedTimes', { count: summary.latestRepeat })}</span>
                    )}
                  </p>
                </div>
              )}

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
                <Badge variant="secondary" className="tabular">{t('dashboard.scans', { count: scans.length })}</Badge>
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
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {scans.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Segmented<'scans' | 'summary'>
                          aria-label={t('summary.viewLabel')}
                          value={view}
                          onValueChange={setView}
                          options={[
                            { value: 'scans', label: t('summary.viewScans') },
                            { value: 'summary', label: t('summary.viewSummary') },
                          ]}
                        />
                        <Segmented<'all' | '1h' | 'today' | '7d'>
                          aria-label={t('summary.periodLabel')}
                          value={period}
                          onValueChange={setPeriod}
                          options={[
                            { value: 'all', label: t('summary.periodAll') },
                            { value: '1h', label: t('summary.period1h') },
                            { value: 'today', label: t('summary.periodToday') },
                            { value: '7d', label: t('summary.period7d') },
                          ]}
                        />
                      </div>
                    ) : <span />}
                    {isAuthenticated && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('csv')}
                          disabled={visibleCount === 0}
                        >
                          <Download aria-hidden="true" />
                          {t('session.exportCsv')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('xlsx')}
                          disabled={visibleCount === 0}
                        >
                          <FileSpreadsheet aria-hidden="true" />
                          {t('session.exportExcel')}
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* 무엇을 내보내는지: 보기와 검색어를 그대로 */}
                  {isAuthenticated && scans.length > 0 && (view === 'summary' || search.trim() || period !== 'all') && (
                    <p className="-mt-2 mb-4 text-13 text-muted-foreground">
                      {view === 'summary'
                        ? search.trim()
                          ? t('summary.exportScopeSummarySearch', { q: search.trim(), count: visibleCount })
                          : t('summary.exportScopeSummary', { count: visibleCount })
                        : search.trim()
                          ? t('summary.exportScopeSearch', { q: search.trim(), count: visibleCount })
                          : t('summary.exportScopePeriod', { count: visibleCount })}
                      {period !== 'all' && ` · ${t(`summary.period${period === '1h' ? '1h' : period === 'today' ? 'Today' : '7d'}`)}`}
                    </p>
                  )}
                  {view === 'summary' ? (
                    <CodeSummaryTable
                      rows={summaryRows}
                      search={search}
                      onSearchChange={setSearch}
                      formatOptions={formatOptions}
                    />
                  ) : (
                  <ScanDataTable
                    columns={columns}
                    data={orderedScans}
                    onDeleteSelected={isAuthenticated ? handleDeleteSelected : undefined}
                    highlightIds={highlightIds}
                    search={search}
                    onSearchChange={setSearch}
                    emptyState={scans.length > 0 ? (
                      // 기간 필터로 비었을 때
                      <Empty
                        icon={<Clock />}
                        title={t('summary.periodEmpty')}
                        action={<Button variant="outline" onClick={() => setPeriod('all')}>{t('summary.periodShowAll')}</Button>}
                      />
                    ) : isAuthenticated ? (
                      // 첫 세션 안내: 앱에서 이 세션으로 보내는 방법 3단계
                      <div className="grid gap-4 py-2">
                        <div>
                          <h3 className="type-h3">{t('session.onboardTitle')}</h3>
                          <p className="mt-1 text-13 text-muted-foreground">{t('session.onboardDesc')}</p>
                        </div>
                        <ol className="grid gap-3 sm:grid-cols-3">
                          {[
                            { icon: Smartphone, title: t('session.onboardStep1'), desc: t('session.onboardStep1Desc') },
                            { icon: Send, title: t('session.onboardStep2'), desc: t('session.onboardStep2Desc') },
                            { icon: MonitorCheck, title: t('session.onboardStep3'), desc: t('session.onboardStep3Desc') },
                          ].map((step, i) => (
                            <li key={i} className="rounded-field border p-4">
                              <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-13 font-bold tabular">{i + 1}</span>
                                <step.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                              </div>
                              <p className="mt-3 font-semibold">{step.title}</p>
                              <p className="mt-1 text-13 text-muted-foreground">{step.desc}</p>
                            </li>
                          ))}
                        </ol>
                        <a href={`/${locale}/beta`} className="justify-self-start text-13 font-semibold underline underline-offset-4">
                          {t('session.onboardGetApp')}
                        </a>
                      </div>
                    ) : undefined}
                  />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
      <Dialog open={hotkeyHelpOpen} onOpenChange={setHotkeyHelpOpen}>
        <DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
          <DialogHeader>
            <DialogTitle>{t('hotkeys.title')}</DialogTitle>
            <DialogDescription>{t('hotkeys.desc')}</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
            {([
              ['/', t('hotkeys.search')],
              ['v', t('hotkeys.toggleView')],
              ['e', t('hotkeys.export')],
              ['?', t('hotkeys.help')],
            ] as const).map(([key, label]) => (
              <div key={key} className="contents">
                <dt>
                  <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-field border bg-secondary px-2 font-mono text-13 font-semibold">{key}</kbd>
                </dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
