"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Withdrawn {
  id: string
  email: string
  deletedAt: string
  purgeAt: string
}

interface Deletions {
  withdrawn: Withdrawn[]
  trash: { count: number; nextPurgeAt: string | null }
  purgeDays: number
  // 남은 날짜 계산 기준 시각 (불러온 때)
  fetchedAt: number
}

const DAY = 86400 * 1000

/** 탈퇴 회원 파기 D-day: "30일 이내 영구 삭제" 약속을 지키는지 한눈에 */
export function AdminDeletionsCard({ accessToken }: { accessToken: string | null }) {
  const t = useTranslations("admin.deletions")
  const locale = useLocale()
  const [data, setData] = React.useState<Deletions | null>(null)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (!accessToken) return
    fetch("/api/admin/deletions", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData({ ...d, fetchedAt: Date.now() }))
      .catch(() => setFailed(true))
  }, [accessToken])

  const dateFmt = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit" }), [locale])

  if (failed) return null
  if (!data) {
    return (
      <Card aria-busy="true">
        <CardHeader><Skeleton className="h-5 w-32 rounded-full" /></CardHeader>
        <CardContent className="grid gap-2">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 rounded-field" />)}
        </CardContent>
      </Card>
    )
  }

  const now = data.fetchedAt
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("desc", { days: data.purgeDays })}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {data.withdrawn.length === 0 ? (
          <p className="rounded-field bg-secondary px-4 py-3 text-13 text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-2">
            {data.withdrawn.map((w) => {
              const left = Math.ceil((new Date(w.purgeAt).getTime() - now) / DAY)
              const urgent = left <= 7
              return (
                <li key={w.id} className="flex items-center gap-3 rounded-field border px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-13">{w.email}</p>
                    <p className="text-13 text-muted-foreground tabular">
                      {t("dates", { withdrawn: dateFmt.format(new Date(w.deletedAt)), purge: dateFmt.format(new Date(w.purgeAt)) })}
                    </p>
                  </div>
                  <Badge variant={urgent ? "destructive" : "secondary"} className="tabular">
                    {left > 0 ? `D-${left}` : t("dueTonight")}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-13 text-muted-foreground tabular">
          {data.trash.count > 0 && data.trash.nextPurgeAt
            ? t("trash", { count: data.trash.count, date: dateFmt.format(new Date(data.trash.nextPurgeAt)) })
            : t("trashEmpty")}
        </p>
      </CardContent>
    </Card>
  )
}
