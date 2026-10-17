'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ScrollText, UserPen, UserX, UserCheck, KeyRound, Trash2 } from 'lucide-react';
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
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { ListRow } from '@/components/ui/list-row';
import { Segmented } from '@/components/ui/segmented';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { notify } from '@/lib/notify';

interface AuditLog {
  id: number;
  adminId: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

type Period = 'today' | '7' | '30' | 'all';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  update_user: <UserPen />,
  delete_user: <UserX />,
  permanent_delete_user: <Trash2 />,
  restore_user: <UserCheck />,
  send_password_reset: <KeyRound />,
};

// 한국 날짜(YYYY-MM-DD) n일 전
function kstDate(daysAgo: number) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 - daysAgo * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

const PAGE_SIZE = 30;

export default function AdminAuditPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading, isAdmin, accessToken } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState('');
  const [period, setPeriod] = useState<Period>('30');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (action) q.set('action', action);
    if (period !== 'all') {
      q.set('startDate', kstDate(period === 'today' ? 0 : Number(period) - 1));
      q.set('endDate', kstDate(0));
    }
    try {
      const res = await fetch(`/api/admin/audit-logs?${q}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs);
      setActions(data.filters.actions);
      setTotalPages(Math.max(1, data.pagination.totalPages));
      setTotal(data.pagination.total);
    } catch {
      notify.error(t('admin.audit.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, action, period, t]);

  useEffect(() => {
    if (isAdmin && accessToken) fetchLogs();
  }, [isAdmin, accessToken, fetchLogs]);

  const actionLabel = (a: string) =>
    t.has(`admin.audit.actions.${a}`) ? t(`admin.audit.actions.${a}`) : a;

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso));

  // 상세 값: 대상 이메일·바뀐 필드 등. 객체는 JSON 한 줄로
  const detailRows = (log: AuditLog) => {
    const rows: [string, string][] = [
      [t('admin.audit.admin'), log.adminEmail || log.adminId],
      [t('admin.audit.target'), `${log.targetType} · ${log.targetId}`],
    ];
    for (const [k, v] of Object.entries(log.details || {})) {
      rows.push([k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
    }
    if (log.ipAddress) rows.push(['IP', log.ipAddress]);
    if (log.userAgent) rows.push(['User-Agent', log.userAgent]);
    return rows;
  };

  if (authLoading || !isAdmin) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/admin">{t('admin.dashboard.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('admin.audit.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="page flex flex-col gap-4 pb-16">
          <div className="enter pb-2 pt-8 sm:pt-9" style={{ '--i': 0 } as React.CSSProperties}>
            <h1 className="type-h1">{t('admin.audit.title')}</h1>
            <p className="mt-1 text-13 text-muted-foreground">{t('admin.audit.desc')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Segmented<Period>
              aria-label={t('admin.audit.period')}
              value={period}
              onValueChange={(v) => { setPeriod(v); setPage(1); }}
              options={[
                { value: 'today', label: t('admin.audit.today') },
                { value: '7', label: t('admin.dashboard.period.7days') },
                { value: '30', label: t('admin.dashboard.period.30days') },
                { value: 'all', label: t('admin.audit.all') },
              ]}
            />
            {actions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('admin.audit.actionFilter')}>
                <Chip selected={action === ''} onClick={() => { setAction(''); setPage(1); }}>
                  {t('admin.audit.allActions')}
                </Chip>
                {actions.map((a) => (
                  <Chip key={a} selected={action === a} onClick={() => { setAction(a); setPage(1); }}>
                    {actionLabel(a)}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-2" aria-busy="true">
              <span className="sr-only" role="status">{t('common.loading')}</span>
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-field" />)}
            </div>
          ) : logs.length === 0 ? (
            <Empty icon={<ScrollText />} title={t('admin.audit.empty')} description={t('admin.audit.emptyDesc')} />
          ) : (
            <>
              <p className="text-13 text-muted-foreground tabular">{t('admin.audit.count', { count: total })}</p>
              <div className="grid gap-2">
                {logs.map((log) => (
                  <ListRow
                    key={log.id}
                    icon={ACTION_ICONS[log.action] ?? <ScrollText />}
                    title={`${actionLabel(log.action)} · ${String(log.details?.email ?? log.targetId)}`}
                    description={`${formatTime(log.createdAt)} · ${log.adminName || log.adminEmail || log.adminId}`}
                  >
                    <dl className="grid gap-x-4 gap-y-1.5 text-13 sm:grid-cols-[max-content_1fr]">
                      {detailRows(log).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="font-semibold text-muted-foreground">{k}</dt>
                          <dd className="min-w-0 break-all font-mono">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </ListRow>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                  <span className="tabular text-13 text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {t('table.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {t('table.next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
