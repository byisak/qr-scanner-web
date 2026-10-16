"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Segmented } from "@/components/ui/segmented"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartData {
  date: string
  count: number
}

interface UserGrowthData {
  date: string
  newUsers: number
  totalUsers: number
}

interface AdminChartsProps {
  dailySignups: ChartData[]
  dailyScans: ChartData[]
  userGrowth?: UserGrowthData[]
  isLoading: boolean
  period: number
  onPeriodChange: (period: number) => void
}

// 날짜를 형식에 맞게 변환
function formatDate(dateStr: string, period: number) {
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (period <= 7) {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else {
    return `${months[date.getMonth()]} ${date.getDate()}`
  }
}

// 기간에 맞게 데이터 채우기 (빈 날짜는 0으로)
function fillMissingDates(data: ChartData[], period: number): ChartData[] {
  const result: ChartData[] = []
  const today = new Date()

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const existing = data.find(d => d.date === dateStr)
    result.push({
      date: dateStr,
      count: existing?.count || 0,
    })
  }

  return result
}

// 기간 전환 (세그먼트)
function PeriodTabs({
  period,
  onPeriodChange
}: {
  period: number
  onPeriodChange: (period: number) => void
}) {
  const t = useTranslations()

  const periods = [
    { value: "90", label: t('admin.dashboard.period.3months') },
    { value: "30", label: t('admin.dashboard.period.30days') },
    { value: "7", label: t('admin.dashboard.period.7days') },
  ]

  return (
    <Segmented
      aria-label={t('admin.dashboard.periodLabel')}
      value={String(period)}
      onValueChange={(v) => onPeriodChange(Number(v))}
      options={periods}
    />
  )
}

// 차트 공통: 색·글자는 모두 CSS 변수(라이트/다크 자동). 툴팁도 팝오버 토큰을 따른다
const AXIS_TICK = { fontSize: 13, fill: 'var(--muted-foreground)' }
const TOOLTIP_PROPS = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    fontSize: '13px',
    fontVariantNumeric: 'tabular-nums',
    boxShadow: 'var(--shadow-soft)',
  },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: '4px' },
  itemStyle: { color: 'var(--popover-foreground)' },
  cursor: { stroke: 'var(--tint-line)' },
}

// 움직임 줄이기 설정이면 차트 그리기 애니메이션을 끈다
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  )
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <Card className="min-w-0" aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="mt-1 h-4 w-48 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="rounded-card" style={{ height }} />
      </CardContent>
    </Card>
  )
}

// 사용자 증가 데이터에 빈 날짜 채우기
function fillUserGrowthDates(data: UserGrowthData[], period: number): UserGrowthData[] {
  if (data.length === 0) return []

  const result: UserGrowthData[] = []
  const today = new Date()
  let lastTotalUsers = data[0]?.totalUsers || 0

  // 첫 날짜 이전의 총 사용자 수 계산
  if (data.length > 0) {
    lastTotalUsers = data[0].totalUsers - data[0].newUsers
  }

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const existing = data.find(d => d.date === dateStr)

    if (existing) {
      lastTotalUsers = existing.totalUsers
      result.push(existing)
    } else {
      result.push({
        date: dateStr,
        newUsers: 0,
        totalUsers: lastTotalUsers,
      })
    }
  }

  return result
}

export function AdminCharts({
  dailySignups,
  dailyScans,
  userGrowth = [],
  isLoading,
  period,
  onPeriodChange
}: AdminChartsProps) {
  const t = useTranslations()
  const reduceMotion = useReducedMotion()

  const chartData = React.useMemo(() => {
    const signups = fillMissingDates(dailySignups, period)
    const scans = fillMissingDates(dailyScans, period)

    return signups.map((s, i) => ({
      displayDate: formatDate(s.date, period),
      signups: s.count,
      scans: scans[i]?.count || 0,
    }))
  }, [dailySignups, dailyScans, period])

  // 총합 계산
  const totalSignups = dailySignups.reduce((sum, d) => sum + d.count, 0)
  const totalScans = dailyScans.reduce((sum, d) => sum + d.count, 0)

  if (isLoading) {
    return <ChartSkeleton height={300} />
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-3 pb-2">
        <div className="min-w-0">
          <CardTitle>{t('admin.dashboard.totalVisitors')}</CardTitle>
          <CardDescription className="mt-1">{t('admin.dashboard.totalForPeriod')}</CardDescription>
        </div>
        <PeriodTabs period={period} onPeriodChange={onPeriodChange} />
      </CardHeader>
      <CardContent className="pt-4">
        {/* 범례: 선 모양(실선/점선) + 글자로 구분 */}
        <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-15">
          <li className="flex items-center gap-2">
            <svg width="20" height="4" aria-hidden="true"><line x1="0" y1="2" x2="20" y2="2" stroke="var(--chart-1)" strokeWidth="2" /></svg>
            <span className="text-muted-foreground">{t('admin.dashboard.scans')}</span>
            <span className="tabular font-semibold">{totalScans.toLocaleString()}</span>
          </li>
          <li className="flex items-center gap-2">
            <svg width="20" height="4" aria-hidden="true"><line x1="0" y1="2" x2="20" y2="2" stroke="var(--chart-3)" strokeWidth="2" strokeDasharray="4 3" /></svg>
            <span className="text-muted-foreground">{t('admin.dashboard.signups')}</span>
            <span className="tabular font-semibold">{totalSignups.toLocaleString()}</span>
          </li>
        </ul>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="displayDate"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval={period <= 7 ? 0 : period <= 30 ? 4 : 14}
                dy={10}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                {...TOOLTIP_PROPS}
                formatter={(value, name) => {
                  const label = name === 'signups'
                    ? t('admin.dashboard.signups')
                    : t('admin.dashboard.scans')
                  return [value ?? 0, label]
                }}
              />
              <Area
                type="monotone"
                isAnimationActive={!reduceMotion}
                dataKey="scans"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.08}
              />
              <Area
                type="monotone"
                isAnimationActive={!reduceMotion}
                dataKey="signups"
                stroke="var(--chart-3)"
                strokeWidth={2}
                strokeDasharray="4 3"
                fill="var(--chart-3)"
                fillOpacity={0.08}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// 사용자 증가 그래프 컴포넌트
export function UserGrowthChart({
  userGrowth = [],
  isLoading,
  period,
}: {
  userGrowth?: UserGrowthData[]
  isLoading: boolean
  period: number
}) {
  const t = useTranslations()
  const reduceMotion = useReducedMotion()

  const chartData = React.useMemo(() => {
    const filled = fillUserGrowthDates(userGrowth, period)
    return filled.map((d) => ({
      displayDate: formatDate(d.date, period),
      newUsers: d.newUsers,
      totalUsers: d.totalUsers,
    }))
  }, [userGrowth, period])

  const latestTotalUsers = chartData.length > 0 ? chartData[chartData.length - 1].totalUsers : 0
  const firstTotalUsers = chartData.length > 0 ? chartData[0].totalUsers : 0
  const growthCount = latestTotalUsers - firstTotalUsers
  const growthPercentage = firstTotalUsers > 0 ? Math.round((growthCount / firstTotalUsers) * 100) : 0

  if (isLoading) {
    return <ChartSkeleton height={250} />
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle>{t('admin.dashboard.userGrowth')}</CardTitle>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-15">
          <p className="text-muted-foreground">
            {t('admin.dashboard.currentUsers')}{' '}
            <span className="tabular font-semibold text-foreground">{latestTotalUsers.toLocaleString()}</span>
          </p>
          {growthCount > 0 && (
            <p className="tabular flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="size-4" aria-hidden="true" />
              +{growthCount.toLocaleString()} ({growthPercentage}%)
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="displayDate"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval={period <= 7 ? 0 : period <= 30 ? 4 : 14}
                dy={10}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                {...TOOLTIP_PROPS}
                formatter={(value, name) => {
                  const label = name === 'totalUsers'
                    ? t('admin.dashboard.totalUsers')
                    : t('admin.dashboard.newUsers')
                  return [value, label]
                }}
              />
              <Area
                type="monotone"
                isAnimationActive={!reduceMotion}
                dataKey="totalUsers"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.08}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
