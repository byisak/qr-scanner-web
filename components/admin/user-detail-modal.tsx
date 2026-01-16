"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSettings } from "@/contexts/settings-context"
import { Loader2, User, Mail, Calendar, Clock, FolderOpen, ScanLine, Shield } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    } catch (err) {
      setError(t('admin.users.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive">{t('admin.users.roleSuperAdmin')}</Badge>
      case 'admin':
        return <Badge variant="default">{t('admin.users.roleAdmin')}</Badge>
      default:
        return <Badge variant="secondary">{t('admin.users.roleUser')}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('admin.users.userDetail')}</DialogTitle>
          <DialogDescription>
            {t('admin.users.userDetailDesc')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : data ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-6 pr-4">
              {/* 사용자 기본 정보 */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={data.user.profileImage || undefined} />
                  <AvatarFallback className="text-xl">
                    {data.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{data.user.name}</h3>
                    {getRoleBadge(data.user.role)}
                    {data.user.deletedAt && (
                      <Badge variant="destructive">{t('admin.users.deleted')}</Badge>
                    )}
                    {!data.user.isActive && !data.user.deletedAt && (
                      <Badge variant="outline" className="text-red-600">
                        {t('admin.users.inactive')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-4 w-4" />
                    {data.user.email}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('admin.users.createdAt')}: {formatDateTime(data.user.createdAt, settings.dateFormat, settings.timeFormat)}
                    </span>
                    {data.user.lastLoginAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {t('admin.users.lastLogin')}: {formatDateTime(data.user.lastLoginAt, settings.dateFormat, settings.timeFormat)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="stats">
                <TabsList>
                  <TabsTrigger value="stats">{t('admin.users.statistics')}</TabsTrigger>
                  <TabsTrigger value="sessions">{t('admin.users.sessions')}</TabsTrigger>
                  <TabsTrigger value="adRecords">{t('admin.users.adRecords')}</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {t('admin.users.totalSessions')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{data.stats.sessionCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ScanLine className="h-4 w-4" />
                          {t('admin.users.totalScans')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{data.stats.scanCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="sessions" className="mt-4">
                  {data.sessions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      {t('admin.users.noSessions')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.sessions.map((session) => (
                        <Card key={session.sessionId}>
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {session.sessionName || session.sessionId.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session.sessionId}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">{session.scanCount} {t('admin.users.scans')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(session.lastActivity, settings.dateFormat, settings.timeFormat)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="adRecords" className="mt-4">
                  {!data.adRecords ? (
                    <p className="text-center py-8 text-muted-foreground">
                      {t('admin.users.noAdRecords')}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{t('adRecords.unlockedFeatures')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {data.adRecords.unlockedFeatures.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('adRecords.noUnlockedFeatures')}</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {data.adRecords.unlockedFeatures.map((feature) => (
                                <Badge key={feature} variant="outline">{feature}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{t('adRecords.adWatchCounts')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {Object.keys(data.adRecords.adWatchCounts).length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('adRecords.noAdWatchHistory')}</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(data.adRecords.adWatchCounts).map(([key, count]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span>{key}</span>
                                  <span className="font-medium">{count} {t('adRecords.times')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {data.adRecords.lastSyncedAt && (
                        <p className="text-xs text-muted-foreground text-center">
                          {t('adRecords.lastSynced')}: {formatDateTime(data.adRecords.lastSyncedAt, settings.dateFormat, settings.timeFormat)}
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
