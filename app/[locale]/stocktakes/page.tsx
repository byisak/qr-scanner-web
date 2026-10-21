'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ClipboardCheck, LogIn } from 'lucide-react';
import { WorkPageShell } from '@/components/work-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { ListRow, ListRowSkeleton } from '@/components/ui/list-row';
import { TimeAgo } from '@/components/time-ago';
import { useAuth } from '@/contexts/auth-context';
import { notify } from '@/lib/notify';

interface Row {
  id: string;
  name: string;
  role: 'owner' | 'member';
  joinCode: string;
  itemCount: number;
  updatedAt: string;
  finishedAt: string | null;
}

export default function StocktakesPage() {
  const t = useTranslations('work');
  const router = useRouter();
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const headers = useMemo<Record<string, string>>(() => (accessToken ? { Authorization: `Bearer ${accessToken}` } : ({} as Record<string, string>)), [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/stocktakes', { headers });
      if (!res.ok) throw new Error();
      setRows((await res.json()).stocktakes);
    } catch {
      setRows([]);
    }
  }, [accessToken, headers]);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const join = async () => {
    setJoining(true);
    try {
      const res = await fetch('/api/stocktakes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void notify.error(data?.error || t('joinFailed'));
      router.push(`/stocktakes/${data.stocktake.id}`);
    } finally {
      setJoining(false);
    }
  };

  const crumbs = [{ label: t('stocktakes') }];
  if (!isLoading && !isAuthenticated) {
    return (
      <WorkPageShell crumbs={crumbs}>
        <Empty className="mt-10" icon={<ClipboardCheck />} title={t('loginTitle')} description={t('loginDesc')}
          action={<Button asChild><Link href="/login">{t('login')}</Link></Button>} />
      </WorkPageShell>
    );
  }

  return (
    <WorkPageShell crumbs={crumbs}>
      <div className="pb-6 pt-8 sm:pt-9">
        <h1 className="type-h1">{t('stocktakes')}</h1>
        <p className="mt-2 type-lead max-w-[62ch]">{t('stocktakesLead')}</p>
      </div>

      <form className="mb-6 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); join(); }}>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('joinPlaceholder')} maxLength={7}
          className="font-mono tracking-widest" aria-label={t('joinCode')} />
        <Button type="submit" disabled={joining || code.replace(/[\s-]/g, '').length !== 6}><LogIn aria-hidden="true" />{t('join')}</Button>
      </form>

      {rows === null ? (
        <ListRowSkeleton count={3} />
      ) : rows.length === 0 ? (
        <Empty icon={<ClipboardCheck />} title={t('stocktakesEmptyTitle')} description={t('stocktakesEmptyDesc')} />
      ) : (
        <ul className="grid gap-2">
          {rows.map((s) => (
            <li key={s.id}>
              <ListRow
                icon={<ClipboardCheck />}
                title={
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{s.name}</span>
                    {s.finishedAt ? <Badge variant="secondary">{t('finished')}</Badge> : <Badge>{t('inProgress')}</Badge>}
                    {s.role === 'member' && <Badge variant="outline">{t('joined')}</Badge>}
                  </span>
                }
                description={<><span className="tabular">{t('itemCount', { count: s.itemCount })}</span>{' · '}<TimeAgo iso={s.updatedAt} /></>}
                onSelect={() => router.push(`/stocktakes/${s.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </WorkPageShell>
  );
}
