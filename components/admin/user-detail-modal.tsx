"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSettings } from "@/contexts/settings-context"
import { User, Mail, Calendar, Clock, FolderOpen, ScanLine, Shield, ShieldCheck, Trash2, Ban, Tv, CircleAlert } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import type { AdminUser } from "@/types"

interface UserSession {
  sessionId: string
  sessionName: string | null
  createdAt: string
  lastActivity: string
  status: string
  deletedAt: string | null
  scanCount: number
}

interface UserAdRecords {
  unlockedFeatures: string[]
  adWatchCounts: Record<string, number>
  bannerSettings: Record<string, boolean>
  lastSyncedAt: string | null
}

interface UserDetailData {
  user: AdminUser
  sessions: UserSession[]
  stats: {
    sessionCount: number
    scanCount: number
  }
  adRecords: UserAdRecords | null
}

interface UserDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  accessToken: string | null
}

const formatDateTime = (
  dateString: string,
  dateFormat: string,
  timeFormat: string
): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  let dateStr: string
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      dateStr = `${day}/${month}/${year}`
      break
    case 'MM/DD/YYYY':
      dateStr = `${month}/${day}/${year}`
      break
    default:
      dateStr = `${year}-${month}-${day}`
  }

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${dateStr} ${hours}:${minutes} ${ampm}`
  }

  return `${dateStr} ${String(hours).padStart(2, '0')}:${minutes}`
}

export function UserDetailModal({
  open,
  onOpenChange,
  userId,
  accessToken,
}: UserDetailModalProps) {
  const t = useTranslations()
  const { settings } = useSettings()
  const [data, setData] = React.useState<UserDetailData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && userId && accessToken) {
      fetchUserDetail()
    } else {
      setData(null)
      setError(null)
    }
  }, [open, userId, accessToken])

  const fetchUserDetail = async () => {
    if (!userId || !accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch user detail')
      }

      const result = await res.json()
      setData(result)
    } catch {
      setError(t('admin.users.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  // 역할·상태 뱃지: 아이콘 + 글자 (빨강은 삭제됨에만)
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="default"><ShieldCheck aria-hidden="true" />{t('admin.users.roleSuperAdmin')}</Badge>
      case 'admin':
        return <Badge variant="outline"><Shield aria-hidden="true" />{t('admin.users.roleAdmin')}</Badge>
      default:
        return <Badge variant="secondary"><User aria-hidden="true" />{t('admin.users.roleUser')}</Badge>
    }
  }

  const fmt = (iso: string) => formatDateTime(iso, settings.dateFormat, settings.timeFormat)

  const sectionTitle = "flex items-center gap-2 text-15 font-bold"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl" closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('admin.users.userDetail')}</DialogTitle>
          <DialogDescription>
            {t('admin.users.userDetailDesc')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-5" aria-busy="true">
            <span className="sr-only" role="status">{t('common.loading')}</span>
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40 rounded-full" />
                <Skeleton className="h-4 w-56 rounded-full" />
                <Skeleton className="h-4 w-64 max-w-full rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-72 max-w-full rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-card" />
              <Skeleton className="h-24 rounded-card" />
            </div>
          </div>
        ) : error ? (
          <p role="alert" className="flex items-center justify-center gap-2 py-12 text-15 font-semibold text-destructive">
            <CircleAlert className="size-4" aria-hidden="true" />
            {error}
          </p>
        ) : data ? (
          <div className="min-w-0 space-y-6">
            {/* 사용자 기본 정보 */}
            <div className="flex min-w-0 items-start gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
                <AvatarImage src={data.user.profileImage || undefined} alt="" />
                <AvatarFallback className="type-h3">
                  {(data.user.name || data.user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="type-h3 break-all">{data.user.name}</h3>
                  {getRoleBadge(data.user.role)}
                  {data.user.deletedAt && (
                    <Badge variant="destructive"><Trash2 aria-hidden="true" />{t('admin.users.deleted')}</Badge>
                  )}
                  {!data.user.isActive && !data.user.deletedAt && (
                    <Badge variant="secondary" className="text-muted-foreground"><Ban aria-hidden="true" />{t('admin.users.inactive')}</Badge>
                  )}
                </div>
                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-15 text-muted-foreground">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <span className="break-all">{data.user.email}</span>
                </p>
                <div className="tabular mt-2 flex flex-wrap gap-x-4 gap-y-1 text-13 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" aria-hidden="true" />
                    {t('admin.users.createdAt')} {fmt(data.user.createdAt)}
                  </span>
                  {data.user.lastLoginAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" aria-hidden="true" />
                      {t('admin.users.lastLogin')} {fmt(data.user.lastLoginAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="stats">
              <TabsList className="max-w-full overflow-x-auto">
                <TabsTrigger value="stats">{t('admin.users.statistics')}</TabsTrigger>
                <TabsTrigger value="sessions">{t('admin.users.sessions')}</TabsTrigger>
                <TabsTrigger value="adRecords">{t('admin.users.adRecords')}</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4">
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-field border bg-card p-4">
                    <dt className="flex items-center gap-2 text-13 font-semibold text-muted-foreground">
                      <FolderOpen className="size-4" aria-hidden="true" />
                      {t('admin.users.totalSessions')}
                    </dt>
                    <dd className="type-h2 tabular mt-1">{data.stats.sessionCount.toLocaleString()}</dd>
                  </div>
                  <div className="rounded-field border bg-card p-4">
                    <dt className="flex items-center gap-2 text-13 font-semibold text-muted-foreground">
                      <ScanLine className="size-4" aria-hidden="true" />
                      {t('admin.users.totalScans')}
                    </dt>
                    <dd className="type-h2 tabular mt-1">{data.stats.scanCount.toLocaleString()}</dd>
                  </div>
                </dl>
              </TabsContent>

              <TabsContent value="sessions" className="mt-4">
                {data.sessions.length === 0 ? (
                  <Empty icon={<FolderOpen />} title={t('admin.users.noSessions')} />
                ) : (
                  <ul className="grid gap-2">
                    {data.sessions.map((session) => (
                      <li key={session.sessionId} className="flex min-w-0 items-center justify-between gap-3 rounded-field border bg-card px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {session.sessionName || session.sessionId.slice(0, 8)}
                          </p>
                          <p className="break-all font-mono text-13 text-muted-foreground">
                            {session.sessionId}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tabular text-15">{session.scanCount.toLocaleString()} {t('admin.users.scans')}</p>
                          <p className="tabular text-13 text-muted-foreground">
                            {fmt(session.lastActivity)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="adRecords" className="mt-4">
                {!data.adRecords ? (
                  <Empty icon={<Tv />} title={t('admin.users.noAdRecords')} />
                ) : (
                  <div className="space-y-4">
                    <section className="rounded-field border bg-card p-4">
                      <h4 className={sectionTitle}>{t('adRecords.unlockedFeatures')}</h4>
                      <div className="mt-2">
                        {data.adRecords.unlockedFeatures.length === 0 ? (
                          <p className="text-15 text-muted-foreground">{t('adRecords.noUnlockedFeatures')}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {data.adRecords.unlockedFeatures.map((feature) => (
                              <Badge key={feature} variant="outline">{feature}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="rounded-field border bg-card p-4">
                      <h4 className={sectionTitle}>{t('adRecords.adWatchCounts')}</h4>
                      <div className="mt-2">
                        {Object.keys(data.adRecords.adWatchCounts).length === 0 ? (
                          <p className="text-15 text-muted-foreground">{t('adRecords.noAdWatchHistory')}</p>
                        ) : (
                          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                            {Object.entries(data.adRecords.adWatchCounts).map(([key, count]) => (
                              <div key={key} className="flex min-w-0 justify-between gap-3 text-15">
                                <dt className="min-w-0 break-all">{key}</dt>
                                <dd className="tabular shrink-0 font-semibold">{count} {t('adRecords.times')}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    </section>

                    {data.adRecords.lastSyncedAt && (
                      <p className="tabular text-center text-13 text-muted-foreground">
                        {t('adRecords.lastSynced')} {fmt(data.adRecords.lastSyncedAt)}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
