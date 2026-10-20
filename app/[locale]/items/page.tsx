'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Upload, Download, Trash2, Package, Search } from 'lucide-react';
import { WorkPageShell } from '@/components/work-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/ui/empty';
import { Segmented } from '@/components/ui/segmented';
import { ListRowSkeleton } from '@/components/ui/list-row';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { notify } from '@/lib/notify';
import { ITEM_FIELDS, type ItemField, type ItemRecord, type BuildResult, readItemRows, detectMapping, buildRecords, itemsToXlsx } from '@/lib/item-file';

type Policy = 'overwrite' | 'fill' | 'skip';
const CHUNK = 2000;
const PAGE = 5000;

interface Pending {
  fileName: string;
  rows: string[][];
  hasHeader: boolean;
  mapping: (ItemField | null)[];
}

export default function ItemsPage() {
  const t = useTranslations('work');
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<ItemRecord[] | null>(null);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [policy, setPolicy] = useState<Policy>('overwrite');
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = useMemo<Record<string, string>>(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : ({} as Record<string, string>)),
    [accessToken]
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const all: ItemRecord[] = [];
      for (let offset = 0; ; offset += PAGE) {
        const res = await fetch(`/api/items?offset=${offset}&limit=${PAGE}`, { headers });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        all.push(...data.items);
        if (all.length >= data.total || data.items.length < PAGE) break;
      }
      setItems(all);
    } catch {
      setItems([]);
      notify.error(t('loadFailed'));
    }
  }, [accessToken, headers, t]);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => [it.code, it.name, it.spec, it.location, ...(it.altCodes || [])].some((v) => (v || '').toLowerCase().includes(q)));
  }, [items, query]);

  const existingKeys = useMemo(() => {
    const key = (c: string) => (/^\d+$/.test(c) ? c.replace(/^0+(?=\d)/, '') : c.toUpperCase());
    return new Set((items || []).map((it) => key(it.code)));
  }, [items]);

  const result: BuildResult | null = useMemo(
    () => (pending ? buildRecords(pending.rows, pending.mapping, pending.hasHeader) : null),
    [pending]
  );
  const updateCount = useMemo(() => {
    if (!result) return 0;
    const key = (c: string) => (/^\d+$/.test(c) ? c.replace(/^0+(?=\d)/, '') : c.toUpperCase());
    return result.records.filter((r) => existingKeys.has(key(r.code))).length;
  }, [result, existingKeys]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(xlsx|xlsm|xls|csv|txt|tsv)$/i.test(file.name)) return notify.error(t('unsupportedFile'));
    try {
      const rows = await readItemRows(file);
      if (!rows.length) return notify.error(t('emptyFile'));
      const d = detectMapping(rows);
      setPending({ fileName: file.name, rows, ...d });
    } catch {
      notify.error(t('readFailed'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const upload = async () => {
    if (!result?.records.length) return;
    const recs = result.records;
    let added = 0, updated = 0;
    setProgress(0);
    try {
      for (let i = 0; i < recs.length; i += CHUNK) {
        const res = await fetch('/api/items/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ policy, items: recs.slice(i, i + CHUNK) }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const d = await res.json();
        added += d.added; updated += d.updated;
        setProgress(Math.min(100, Math.round(((i + CHUNK) / recs.length) * 100)));
      }
      notify.success(t('uploadDone', { added, updated }));
      setPending(null);
      await load();
    } catch {
      notify.error(t('uploadFailed'));
    } finally {
      setProgress(null);
    }
  };

  const download = () => {
    if (!items?.length) return;
    const blob = itemsToXlsx(items, ITEM_FIELDS.map((f) => t(`fields.${f}`)));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `items_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const clearAll = async () => {
    const ok = await confirm({ title: t('clearTitle'), description: t('clearDesc', { count: items?.length || 0 }), confirmText: t('clearAll'), variant: 'destructive' });
    if (!ok) return;
    const res = await fetch('/api/items', { method: 'DELETE', headers });
    if (res.ok) { notify.success(t('cleared')); load(); } else notify.error(t('uploadFailed'));
  };

  const crumbs = [{ label: t('items') }];

  if (!isLoading && !isAuthenticated) {
    return (
      <WorkPageShell crumbs={crumbs}>
        <Empty className="mt-10" icon={<Package />} title={t('loginTitle')} description={t('loginDesc')}
          action={<Button asChild><Link href="/login">{t('login')}</Link></Button>} />
      </WorkPageShell>
    );
  }

  return (
    <WorkPageShell crumbs={crumbs}>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6 pt-8 sm:pt-9">
        <div className="min-w-0">
          <h1 className="type-h1">{t('items')}</h1>
          <p className="mt-2 type-lead max-w-[62ch]">{t('itemsLead')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={t('upload')} />
          <Button onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" />{t('upload')}</Button>
          <Button variant="outline" onClick={download} disabled={!items?.length}><Download aria-hidden="true" />{t('downloadXlsx')}</Button>
          <Button variant="ghost" onClick={clearAll} disabled={!items?.length}><Trash2 aria-hidden="true" />{t('clearAll')}</Button>
        </div>
      </div>

      {pending && result && (
        <section className="mb-6 grid gap-4 rounded-card border bg-card p-5" aria-label={t('previewTitle')}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="type-h3 min-w-0 truncate">{pending.fileName}</h2>
            <label className="flex items-center gap-2 text-14">
              <input type="checkbox" checked={pending.hasHeader} onChange={(e) => setPending({ ...pending, hasHeader: e.target.checked })} />
              {t('firstRowIsHeader')}
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(pending.mapping.length ? pending.mapping : []).map((field, col) => (
              <label key={col} className="grid min-w-0 gap-1 rounded-field border px-3 py-2">
                <span className="truncate text-13 text-muted-foreground">
                  {pending.hasHeader ? pending.rows[0]?.[col] || t('columnN', { n: col + 1 }) : t('columnN', { n: col + 1 })}
                  {' · '}<span className="font-mono">{(pending.hasHeader ? pending.rows[1] : pending.rows[0])?.[col] || ''}</span>
                </span>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-14"
                  value={field || ''}
                  onChange={(e) => {
                    const v = (e.target.value || null) as ItemField | null;
                    const next = pending.mapping.map((f, i) => (i === col ? v : f === v ? null : f));
                    setPending({ ...pending, mapping: next });
                  }}
                >
                  <option value="">{t('ignoreColumn')}</option>
                  {ITEM_FIELDS.map((f) => <option key={f} value={f}>{t(`fields.${f}`)}</option>)}
                </select>
              </label>
            ))}
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { label: t('statNew'), value: result.records.length - updateCount },
              { label: t('statUpdate'), value: updateCount },
              { label: t('statError'), value: result.errors.length },
            ].map((k) => (
              <div key={k.label} className="rounded-field bg-secondary px-4 py-3">
                <dt className="text-13 font-semibold text-muted-foreground">{k.label}</dt>
                <dd className="type-h2 tabular">{k.value}</dd>
              </div>
            ))}
          </dl>
          {result.errors.length > 0 && (
            <ul className="grid gap-1 text-13 text-muted-foreground">
              {result.errors.slice(0, 6).map((e) => <li key={`${e.line}-${e.reason}`}>{t(`errors.${e.reason}`, { line: e.line, value: e.value })}</li>)}
              {result.errors.some((e) => e.reason === 'scientific') && <li className="text-destructive">{t('scientificHelp')}</li>}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {updateCount > 0 ? (
              <Segmented aria-label={t('policyTitle')} value={policy} onValueChange={setPolicy}
                options={(['overwrite', 'fill', 'skip'] as Policy[]).map((p) => ({ value: p, label: t(`policy.${p}`) }))} />
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPending(null)} disabled={progress !== null}>{t('cancel')}</Button>
              <Button onClick={upload} disabled={!result.records.length || progress !== null}>
                {progress !== null ? t('uploading', { pct: progress }) : t('saveCount', { count: result.records.length })}
              </Button>
            </div>
          </div>
        </section>
      )}

      {items === null ? (
        <ListRowSkeleton count={4} />
      ) : items.length === 0 ? (
        <Empty icon={<Package />} title={t('itemsEmptyTitle')} description={t('itemsEmptyDesc')}
          action={<Button onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" />{t('upload')}</Button>} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} />
            </div>
            <span className="text-13 text-muted-foreground tabular">{query ? t('searchCount', { count: filtered.length, total: items.length }) : t('count', { count: items.length })}</span>
          </div>
          <div className="overflow-x-auto rounded-card border">
            <Table>
              <TableHeader>
                <TableRow>
                  {(['code', 'name', 'spec', 'unit', 'location', 'altCodes'] as ItemField[]).map((f) => <TableHead key={f}>{t(`fields.${f}`)}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 500).map((it) => (
                  <TableRow key={it.code}>
                    <TableCell className="font-mono text-13">{it.code}</TableCell>
                    <TableCell className="font-semibold">{it.name}</TableCell>
                    <TableCell>{it.spec}</TableCell>
                    <TableCell>{it.unit}</TableCell>
                    <TableCell>{it.location}</TableCell>
                    <TableCell className="font-mono text-13">{(it.altCodes || []).join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 500 && <p className="mt-2 text-13 text-muted-foreground">{t('showingFirst', { count: 500 })}</p>}
          <p className="mt-4 text-13 text-muted-foreground">{t('appSyncHint')}</p>
        </>
      )}
      {ConfirmDialog}
    </WorkPageShell>
  );
}
