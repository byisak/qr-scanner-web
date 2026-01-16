"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  date: string
  count: number
}

interface AdminChartsProps {
  dailySignups: ChartData[]
  dailyScans: ChartData[]
  isLoading: boolean
}

// 날짜를 MM/DD 형식으로 변환
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 7일 데이터 채우기 (빈 날짜는 0으로)
function fillMissingDates(data: ChartData[]): ChartData[] {
  const result: ChartData[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
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

export function AdminCharts({ dailySignups, dailyScans, isLoading }: AdminChartsProps) {
  const t = useTranslations()

  const signupData = React.useMemo(
    () => fillMissingDates(dailySignups).map(d => ({
      ...d,
      displayDate: formatDate(d.date),
    })),
    [dailySignups]
  )

  const scanData = React.useMemo(
    () => fillMissingDates(dailyScans).map(d => ({
      ...d,
      displayDate: formatDate(d.date),
    })),
    [dailyScans]
  )

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 일별 신규 가입자 그래프 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.dashboard.dailySignups')}</CardTitle>
          <CardDescription>{t('admin.dashboard.dailySignupsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  formatter={(value) => [value ?? 0, t('admin.dashboard.signups')]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#signupGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 일별 스캔 수 그래프 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.dashboard.dailyScans')}</CardTitle>
          <CardDescription>{t('admin.dashboard.dailyScansDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanData}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  formatter={(value) => [value ?? 0, t('admin.dashboard.scans')]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#scanGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
