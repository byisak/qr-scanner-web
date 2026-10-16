"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, UserPlus, FolderOpen, ScanLine, UserX } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminStats {
  users: {
    total: number
    active: number
    newToday: number
    newWeek: number
    activeWeek: number
    dormant: number
  }
  sessions: {
    total: number
    newToday: number
    activeWeek: number
  }
  scans: {
    total: number
    today: number
    week: number
  }
  providers: {
    email: number
    google: number
    apple: number
    kakao: number
  }
}

interface AdminStatsCardsProps {
  stats: AdminStats | null
  isLoading: boolean
}

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  const t = useTranslations()

  // 휴면회원 비율 계산
  const dormantPercentage = stats?.users.active && stats?.users.dormant
    ? Math.round((stats.users.dormant / stats.users.active) * 100)
    : 0

  // 아이콘은 모두 같은 회색 (색으로 구분하지 않고 제목 글자로 구분)
  const cards = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats?.users.total || 0,
      description: t('admin.stats.activeUsers', { count: stats?.users.active || 0 }),
      icon: Users,
    },
    {
      title: t('admin.stats.newUsersToday'),
      value: stats?.users.newToday || 0,
      description: t('admin.stats.newUsersWeek', { count: stats?.users.newWeek || 0 }),
      icon: UserPlus,
    },
    {
      title: t('admin.stats.dormantUsers'),
      value: stats?.users.dormant || 0,
      description: t('admin.stats.dormantPercentage', { percentage: dormantPercentage }),
      icon: UserX,
    },
    {
      title: t('admin.stats.totalSessions'),
      value: stats?.sessions.total || 0,
      description: t('admin.stats.activeSessionsWeek', { count: stats?.sessions.activeWeek || 0 }),
      icon: FolderOpen,
    },
    {
      title: t('admin.stats.totalScans'),
      value: stats?.scans.total || 0,
      description: t('admin.stats.scansToday', { count: stats?.scans.today || 0 }),
      icon: ScanLine,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-busy={isLoading || undefined}>
      {cards.map((card, index) => (
        <Card key={index} className="enter min-w-0" style={{ "--i": index } as React.CSSProperties}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <h2 className="min-w-0 truncate text-15 font-semibold text-muted-foreground">{card.title}</h2>
            <card.icon className="size-4 shrink-0 text-faint" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24 rounded-code" />
                <Skeleton className="mt-2 h-4 w-32 rounded-full" />
              </>
            ) : (
              <>
                <p className="type-h1 tabular">{card.value.toLocaleString()}</p>
                <p className="tabular mt-1 text-13 text-muted-foreground">{card.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ProviderStatsProps {
  providers: AdminStats['providers'] | undefined
  isLoading: boolean
}

export function ProviderStatsCard({ providers, isLoading }: ProviderStatsProps) {
  const t = useTranslations()

  const total = providers
    ? providers.email + providers.google + providers.apple + providers.kakao
    : 0

  const getPercentage = (value: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  // 막대는 모두 먹색 — 제공자 이름·숫자 글자로 구분
  const providerData = [
    { name: t('profile.providerEmail'), value: providers?.email || 0 },
    { name: 'Google', value: providers?.google || 0 },
    { name: 'Apple', value: providers?.apple || 0 },
    { name: t('profile.providerKakao'), value: providers?.kakao || 0 },
  ]

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('admin.stats.usersByProvider')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-2 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {providerData.map((provider) => {
              const pct = getPercentage(provider.value)
              return (
                <li key={provider.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-15">
                    <span>{provider.name}</span>
                    <span className="tabular font-semibold">
                      {provider.value.toLocaleString()} <span className="font-normal text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
