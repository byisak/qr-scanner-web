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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartData {
  date: string
  count: number
}

interface AdminChartsProps {
  dailySignups: ChartData[]
  dailyScans: ChartData[]
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

// 기간 탭 버튼
function PeriodTabs({
  period,
  onPeriodChange
}: {
  period: number
  onPeriodChange: (period: number) => void
}) {
  const t = useTranslations()

  const periods = [
    { value: 90, label: t('admin.dashboard.period.3months') },
    { value: 30, label: t('admin.dashboard.period.30days') },
    { value: 7, label: t('admin.dashboard.period.7days') },
  ]

  return (
    <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            period === p.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

export function AdminCharts({
  dailySignups,
  dailyScans,
  isLoading,
  period,
  onPeriodChange
}: AdminChartsProps) {
  const t = useTranslations()

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
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="h-5 w-32 bg-zinc-800 animate-pulse rounded" />
            <div className="h-4 w-48 bg-zinc-800 animate-pulse rounded mt-1" />
          </div>
          <div className="h-8 w-64 bg-zinc-800 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-zinc-800 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base text-zinc-100">
            {t('admin.dashboard.totalVisitors')}
          </CardTitle>
          <p className="text-sm text-zinc-400 mt-1">
            {t('admin.dashboard.totalForPeriod')}
          </p>
        </div>
        <PeriodTabs period={period} onPeriodChange={onPeriodChange} />
      </CardHeader>
      <CardContent className="pt-4">
        {/* 범례 */}
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-400" />
            <span className="text-sm text-zinc-400">
              {t('admin.dashboard.signups')}: {totalSignups}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-600" />
            <span className="text-sm text-zinc-400">
              {t('admin.dashboard.scans')}: {totalScans}
            </span>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#52525b" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#52525b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
                interval={period <= 7 ? 0 : period <= 30 ? 4 : 14}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                itemStyle={{ color: '#fafafa' }}
                formatter={(value, name) => {
                  const label = name === 'signups'
                    ? t('admin.dashboard.signups')
                    : t('admin.dashboard.scans')
                  return [value ?? 0, label]
                }}
              />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#52525b"
                strokeWidth={2}
                fill="url(#scanGradient)"
              />
              <Area
                type="monotone"
                dataKey="signups"
                stroke="#a1a1aa"
                strokeWidth={2}
                fill="url(#signupGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
