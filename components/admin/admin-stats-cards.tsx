"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, UserCheck, UserPlus, FolderOpen, ScanLine, Activity } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminStats {
  users: {
    total: number
    active: number
    newToday: number
    newWeek: number
    activeWeek: number
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

  const cards = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats?.users.total || 0,
      description: t('admin.stats.activeUsers', { count: stats?.users.active || 0 }),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: t('admin.stats.newUsersToday'),
      value: stats?.users.newToday || 0,
      description: t('admin.stats.newUsersWeek', { count: stats?.users.newWeek || 0 }),
      icon: UserPlus,
      color: "text-green-600",
    },
    {
      title: t('admin.stats.totalSessions'),
      value: stats?.sessions.total || 0,
      description: t('admin.stats.activeSessionsWeek', { count: stats?.sessions.activeWeek || 0 }),
      icon: FolderOpen,
      color: "text-purple-600",
    },
    {
      title: t('admin.stats.totalScans'),
      value: stats?.scans.total || 0,
      description: t('admin.stats.scansToday', { count: stats?.scans.today || 0 }),
      icon: ScanLine,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
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

  const providerData = [
    { name: 'Email', value: providers?.email || 0, color: 'bg-gray-500' },
    { name: 'Google', value: providers?.google || 0, color: 'bg-red-500' },
    { name: 'Apple', value: providers?.apple || 0, color: 'bg-black' },
    { name: 'Kakao', value: providers?.kakao || 0, color: 'bg-yellow-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('admin.stats.usersByProvider')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {providerData.map((provider) => (
              <div key={provider.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{provider.name}</span>
                  <span className="font-medium">
                    {provider.value} ({getPercentage(provider.value)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${provider.color} transition-all`}
                    style={{ width: `${getPercentage(provider.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
