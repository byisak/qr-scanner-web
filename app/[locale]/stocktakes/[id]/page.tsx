'use client';

import { useCallback, useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Copy, Download, Flag, RotateCcw, Users } from 'lucide-react';
import { WorkPageShell } from '@/components/work-page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { ListRowSkeleton } from '@/components/ui/list-row';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { notify } from '@/lib/notify';

type Status = 'missing' | 'partial' | 'complete' | 'over' | 'extra';
interface Item { codeKey: string; code: string; name: string; expected: number; scanned: number; lastAt: string | null }
interface State {
  id: string; name: string; joinCode: string; ownerName: string | null; finishedAt: string | null;
  items: Item[]; extras: { codeKey: string; code: string; scanned: number }[];
  members: { id: string; name: string; isOwner: boolean; scans: number }[];
}
type Filter = 'todo' | 'all' | Status;

const statusOf = (i: Item): Status => (i.scanned <= 0 ? 'missing' : i.scanned < i.expected ? 'partial' : i.scanned === i.expected ? 'complete' : 'over');
const POLL_MS = 5000;

export default function StocktakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('work');
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [state, setState] = useState<State | null>(null);
  const [role, setRole] = useState<'owner' | 'member' | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('todo');
  const headers = useMemo<Record<string, string>>(() => (accessToken ? { Authorization: `Bearer ${accessToken}` } : ({} as Record<string, string>)), [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await fetch(`/api/stocktakes/${id}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data?.error || t('loadFailed')); return; }
    setState(data.stocktake);
    setRole(data.role);
  }, [accessToken, headers, id, t]);

  // 화면이 보일 때 5초마다 새로 (여럿이 스캔 중인 진행 상황)
  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, load]);

  const sum = useMemo(() => {
    const s = { missing: 0, partial: 0, complete: 0, over: 0, expectedQty: 0, filledQty: 0 };
    for (const i of state?.items || []) {
      s[statusOf(i) as 'missing' | 'partial' | 'complete' | 'over']++;
      s.expectedQty += i.expected;
      s.filledQty += Math.max(0, Math.min(i.scanned, i.expected));
    }
    return s;
  }, [state]);
  const progress = sum.expectedQty ? Math.round((sum.filledQty / sum.expectedQty) * 100) : 0;

  const rows = useMemo(() => {
    const items = (state?.items || []).map((i) => ({ ...i, status: statusOf(i) }));
    const extras = (state?.extras || []).map((e) => ({ ...e, name: '', expected: 0, lastAt: null, status: 'extra' as Status }));
    const all = [...items, ...extras];
    if (filter === 'all') return all;
    if (filter === 'todo') return all.filter((r) => r.status === 'missing' || r.status === 'partial');
    return all.filter((r) => r.status === filter);
  }, [state, filter]);

  const setFinished = async (finished: boolean) => {
    if (finished) {
      const ok = await confirm({ title: t('finishTitle'), description: t('finishDesc', { missing: sum.missing + sum.partial, extra: state?.extras.length || 0 }), confirmText: t('finish') });
      if (!ok) return;
    }
    const res = await fetch(`/api/stocktakes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ finished }) });
    if (res.ok) { const d = await res.json(); setState(d.stocktake); } else notify.error(t('saveFailed'));
  };

  const remove = async () => {
    const ok = await confirm({
      title: role === 'owner' ? t('deleteTitle') : t('leaveTitle'),
      description: role === 'owner' ? t('deleteDesc') : t('leaveDesc'),
      confirmText: role === 'owner' ? t('delete') : t('leave'),
      variant: 'destructive',
    });
    if (!ok) return;
    const res = await fetch(`/api/stocktakes/${id}`, { method: 'DELETE', headers });
    if (res.ok) router.push('/stocktakes'); else notify.error(t('saveFailed'));
  };

  const exportCsv = () => {
    if (!state) return;
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = [t('fields.code'), t('fields.name'), t('expected'), t('scanned'), t('diff'), t('status')];
    const lines = [...state.items.map((i) => [i.code, i.name, i.expected, i.scanned, i.scanned - i.expected, t(`st.${statusOf(i)}`)]),
      ...state.extras.map((e) => [e.code, '', 0, e.scanned, e.scanned, t('st.extra')])];
    const blob = new Blob(['﻿' + [head, ...lines].map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(state?.joinCode || ''); notify.success(t('codeCopied')); } catch { /* 글자는 화면에 보인다 */ }
  };

  const crumbs = [{ label: t('stocktakes'), href: '/stocktakes' }, { label: state?.name || '…' }];
  if (error) return <WorkPageShell crumbs={crumbs}><p className="mt-10 text-destructive" role="alert">{error}</p></WorkPageShell>;
  if (!state) return <WorkPageShell crumbs={crumbs}><div className="mt-8"><ListRowSkeleton count={4} /></div></WorkPageShell>;

  return (
    <WorkPageShell crumbs={crumbs}>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6 pt-8 sm:pt-9">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="type-h1 truncate">{state.name}</h1>
            {state.finishedAt ? <Badge variant="secondary">{t('finished')}</Badge> : <Badge>{t('inProgress')}</Badge>}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-14 text-muted-foreground">
            {t('joinCode')}
            <button type="button" onClick={copyCode} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-15 font-bold tracking-widest text-foreground">
              {state.joinCode.slice(0, 3)}-{state.joinCode.slice(3)} <Copy className="size-3.5" aria-hidden="true" />
            </button>
            <span>{t('joinHint')}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}><Download aria-hidden="true" />{t('exportCsv')}</Button>
          {role === 'owner' && (state.finishedAt
            ? <Button variant="outline" onClick={() => setFinished(false)}><RotateCcw aria-hidden="true" />{t('reopen')}</Button>
            : <Button onClick={() => setFinished(true)}><Flag aria-hidden="true" />{t('finish')}</Button>)}
          <Button variant="ghost" onClick={remove}>{role === 'owner' ? t('delete') : t('leave')}</Button>
        </div>
      </div>

      <section className="mb-6 rounded-card border bg-card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="type-h1 tabular">{sum.complete} <span className="text-muted-foreground text-20">/ {state.items.length}</span></span>
          <span className="text-14 text-muted-foreground tabular">{t('qtyProgress', { filled: sum.filledQty, expected: sum.expectedQty, pct: progress })}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(['complete', 'partial', 'missing', 'over'] as Status[]).map((k) => (
            <div key={k} className="rounded-field bg-secondary px-3 py-2"><dt className="text-13 text-muted-foreground">{t(`st.${k}`)}</dt><dd className="type-h3 tabular">{sum[k as 'complete']}</dd></div>
          ))}
          <div className="rounded-field bg-secondary px-3 py-2"><dt className="text-13 text-muted-foreground">{t('st.extra')}</dt><dd className="type-h3 tabular">{state.extras.length}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-14">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          {state.members.map((m) => (
            <span key={m.id} className="tabular">{m.name || t('noName')}{m.isOwner ? ` (${t('owner')})` : ''} · {t('scanCount', { count: m.scans })}</span>
          ))}
        </div>
      </section>

      <div className="mb-3 overflow-x-auto">
        <Segmented aria-label={t('filter')} value={filter} onValueChange={setFilter}
          options={(['todo', 'missing', 'partial', 'complete', 'over', 'extra', 'all'] as Filter[]).map((f) => ({ value: f, label: t(`filters.${f}`) }))} />
      </div>
      <div className="overflow-x-auto rounded-card border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fields.name')}</TableHead>
              <TableHead>{t('fields.code')}</TableHead>
              <TableHead className="text-right">{t('scanned')} / {t('expected')}</TableHead>
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t('nothingHere')}</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.codeKey}>
                <TableCell className="font-semibold">{r.name || '—'}</TableCell>
                <TableCell className="font-mono text-13">{r.code}</TableCell>
                <TableCell className="text-right tabular">{r.scanned} / {r.status === 'extra' ? '—' : r.expected}</TableCell>
                <TableCell><Badge variant={r.status === 'complete' ? 'secondary' : r.status === 'missing' ? 'outline' : 'default'}>{t(`st.${r.status}`)}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-13 text-muted-foreground">{t('liveHint')}</p>
      {ConfirmDialog}
    </WorkPageShell>
  );
}
