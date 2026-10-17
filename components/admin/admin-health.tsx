"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Database, Mail, Radio, Clock, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface CronRun {
  id: number
  job: string
  startedAt: string
  durationMs: number
  ok: boolean
  details: Record<string, number> | null
  error: string | null
}

export interface AdminHealth {
  db: { ok: boolean; latencyMs: number | null }
  storage?: { bytes: number; limitBytes: number; tables: { name: string; bytes: number; rows: number }[] }
  email?: { configured: boolean }
  realtime?: { configured: boolean }
  cron?: { lastRun: CronRun | null; recent: CronRun[]; stale: boolean } | null
  checkedAt?: string
}

function formatBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`
  if (n >= 1024) return `${Math.round(n / 1024)}KB`
  return `${n}B`
}

// 상태 한 칸: 점 + 글자. 문제가 있으면 빨간 점과 빨간 글자 (색만으로 구분하지 않도록 글자도 바뀐다)
function Signal({ icon, label, value, bad }: { icon: React.ReactNode; label: string; value: string; bad: boolean }) {
  return (
    <div
      className={
        bad
          ? "flex min-w-0 items-center gap-2 rounded-field border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-destructive"
          : "flex min-w-0 items-center gap-2 rounded-field border px-3 py-2.5"
      }
    >
      <span className="text-muted-foreground [&_svg]:size-4" aria-hidden="true">{icon}</span>
      <span className="text-13 font-semibold">{label}</span>
      <span className="ml-auto truncate text-13 tabular">{value}</span>
    </div>
  )
}

export function AdminHealthPanel({ accessToken }: { accessToken: string | null }) {
  const t = useTranslations("admin.health")
  const locale = useLocale()
  const [health, setHealth] = React.useState<AdminHealth | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/health", { headers: { Authorization: `Bearer ${accessToken}` } })
      const data = await res.json().catch(() => null)
      setHealth(data?.health ?? { db: { ok: false, latencyMs: null } })
    } catch {
      setHealth({ db: { ok: false, latencyMs: null } })
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  React.useEffect(() => {
    load()
  }, [load])

  const rtf = React.useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale])
  const ago = (iso: string) => {
    const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
    if (min === 0) return rtf.format(0, "second")
    if (Math.abs(min) < 60) return rtf.format(min, "minute")
    const hour = Math.round(min / 60)
    if (Math.abs(hour) < 48) return rtf.format(hour, "hour")
    return rtf.format(Math.round(hour / 24), "day")
  }
  const timeFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    [locale]
  )

  if (loading && !health) {
    return (
      <Card aria-busy="true">
        <CardHeader><Skeleton className="h-5 w-32 rounded-full" /></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-11 rounded-field" />)}
        </CardContent>
      </Card>
    )
  }
  if (!health) return null

  const cron = health.cron
  const cronBad = cron === null || cron === undefined || cron.stale || (cron.lastRun ? !cron.lastRun.ok : true)
  const cronValue = cron === null || cron === undefined
    ? t("cronNoTable")
    : cron.lastRun
      ? `${cron.lastRun.ok ? t("ok") : t("failed")} · ${ago(cron.lastRun.startedAt)}`
      : t("cronNever")
  const storage = health.storage
  const pct = storage ? Math.min(100, (storage.bytes / storage.limitBytes) * 100) : 0

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            {health.checkedAt && (
              <CardDescription className="tabular">{t("checkedAt", { time: timeFmt.format(new Date(health.checkedAt)) })}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={load} disabled={loading} aria-label={t("refresh")}>
            <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {/* 신호등: DB · 메일 · 실시간 · 크론 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="list">
          <div role="listitem"><Signal icon={<Database />} label={t("db")} bad={!health.db.ok}
            value={health.db.ok ? `${health.db.latencyMs}ms` : t("down")} /></div>
          <div role="listitem"><Signal icon={<Mail />} label={t("email")} bad={!health.email?.configured}
            value={health.email?.configured ? t("ok") : t("notConfigured")} /></div>
          <div role="listitem"><Signal icon={<Radio />} label={t("realtime")} bad={!health.realtime?.configured}
            value={health.realtime?.configured ? t("ok") : t("notConfigured")} /></div>
          <div role="listitem"><Signal icon={<Clock />} label={t("cron")} bad={cronBad} value={cronValue} /></div>
        </div>

        {/* DB 용량: 무료 플랜 한도 대비 */}
        {storage && (
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3 text-13">
              <span className="font-semibold">{t("storage")}</span>
              <span className="tabular text-muted-foreground">
                {formatBytes(storage.bytes)} / {formatBytes(storage.limitBytes)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label={t("storage")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div className={pct >= 80 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
            <ul className="grid gap-x-10 gap-y-1 text-13 text-muted-foreground sm:grid-cols-2">
              {storage.tables.map((tb) => (
                <li key={tb.name} className="flex justify-between gap-3">
                  <span className="truncate font-mono">{tb.name}</span>
                  <span className="tabular">{formatBytes(tb.bytes)} · {t("rows", { count: tb.rows })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 크론 이력: 최근 14번 */}
        {cron && cron.recent.length > 0 && (
          <div className="grid gap-2">
            <span className="text-13 font-semibold">{t("cronHistory")}</span>
            <ul className="grid gap-1.5">
              {cron.recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-13">
                  <span className={r.ok ? "font-semibold" : "font-semibold text-destructive"}>
                    {r.ok ? t("ok") : t("failed")}
                  </span>
                  <span className="tabular text-muted-foreground">{timeFmt.format(new Date(r.startedAt))}</span>
                  <span className="tabular text-muted-foreground">
                    {r.ok && r.details
                      ? t("cronResult", {
                          sessions: r.details.deletedSessionCount ?? 0,
                          scans: (r.details.deletedScanCount ?? 0) + (r.details.purgedScanCount ?? 0),
                          users: r.details.purgedUserCount ?? 0,
                        })
                      : r.error}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
