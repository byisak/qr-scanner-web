"use client"

import * as React from "react"
import {
  QrCode,
  Trash2,
  RotateCcw,
  Trash,
  MoreHorizontal,
  LogIn,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface Session {
  session_id: string
  session_name: string | null
  created_at: string
  last_activity: string
  status: string
  deleted_at: string | null
  scan_count: number
}

interface NavSessionsProps {
  currentSessionId?: string
  onSessionChange?: () => void
}

export function NavSessions({ currentSessionId, onSessionChange }: NavSessionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const { isAuthenticated, accessToken } = useAuth()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [deletedSessions, setDeletedSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const t = useTranslations()

  // 세션 목록 가져오기
  const fetchSessions = React.useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setSessions([])
      setDeletedSessions([])
      setIsLoading(false)
      return
    }

    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`
      }

      const [activeRes, deletedRes] = await Promise.all([
        fetch('/api/sessions?status=ACTIVE&mine=true', { headers }),
        fetch('/api/sessions?status=DELETED&mine=true', { headers })
      ])

      if (activeRes.ok) {
        const activeSessions = await activeRes.json()
        setSessions(activeSessions)
      }

      if (deletedRes.ok) {
        const deleted = await deletedRes.json()
        setDeletedSessions(deleted)
      }
    } catch (error) {
      console.error('세션 목록 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, accessToken])

  React.useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // 외부에서 새로고침 트리거를 위한 커스텀 이벤트 리스너
  React.useEffect(() => {
    const handleRefresh = () => {
      fetchSessions()
    }
    window.addEventListener('sidebar-refresh', handleRefresh)
    return () => window.removeEventListener('sidebar-refresh', handleRefresh)
  }, [fetchSessions])

  const handleSessionClick = (sessionId: string) => {
    router.push(`/session/${sessionId}`)
  }

  // Soft Delete
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t('dashboard.confirmDelete'))) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
        if (currentSessionId === sessionId) {
          router.push('/dashboard')
        }
      } else {
        const data = await res.json()
        alert(data.error || t('sidebar.deleteFailed'))
      }
    } catch (error) {
      console.error('Session delete failed:', error)
      alert(t('sidebar.deleteError'))
    }
  }

  const handleRestoreSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore`, {
        method: 'POST'
      })

      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
      } else {
        const data = await res.json()
        alert(data.error || t('trash.restoreFailed'))
      }
    } catch (error) {
      console.error('Session restore failed:', error)
      alert(t('trash.restoreError'))
    }
  }

  const handlePermanentDelete = async (sessionId: string) => {
    if (!confirm(t('trash.confirmPermanentDelete'))) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}/permanent`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
      } else {
        const data = await res.json()
        alert(data.error || t('trash.permanentDeleteFailed'))
      }
    } catch (error) {
      console.error('Session permanent delete failed:', error)
      alert(t('trash.permanentDeleteError'))
    }
  }

  const isTrashPage = pathname?.includes('/trash')

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <a
            href="/dashboard"
            className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
          >
            <QrCode className="size-4" />
            {t('sidebar.sessionList')}
          </a>
        </SidebarGroupLabel>
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">{t('sidebar.loginPrompt')}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            <LogIn className="size-4 mr-2" />
            {t('sidebar.login')}
          </Button>
        </div>
      </SidebarGroup>
    )
  }

  return (
    <>
      {/* Active Sessions */}
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <a
            href="/dashboard"
            className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
          >
            <QrCode className="size-4" />
            {t('sidebar.sessionList')} ({sessions.length})
          </a>
        </SidebarGroupLabel>
        <SidebarMenu>
          {isLoading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t('sidebar.noSessions')}
            </div>
          ) : (
            sessions.map((session) => (
              <SidebarMenuItem key={session.session_id}>
                <SidebarMenuButton
                  onClick={() => handleSessionClick(session.session_id)}
                  isActive={currentSessionId === session.session_id}
                  tooltip={session.session_name || session.session_id}
                >
                  <QrCode className="size-4" />
                  <span className="truncate">{session.session_name || session.session_id}</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem onClick={() => handleSessionClick(session.session_id)}>
                      <QrCode className="mr-2 size-4 text-muted-foreground" />
                      <span>{t('sidebar.viewSession')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteSession(session.session_id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      <span>{t('table.delete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Deleted Sessions */}
      {deletedSessions.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel asChild>
            <a
              href="/dashboard/trash"
              className={`flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer ${isTrashPage ? 'text-foreground font-medium' : ''}`}
            >
              <Trash className="size-4" />
              {t('sidebar.deletedSessions')} ({deletedSessions.length})
            </a>
          </SidebarGroupLabel>
          <SidebarMenu>
            {deletedSessions.slice(0, 5).map((session) => (
              <SidebarMenuItem key={session.session_id}>
                <SidebarMenuButton
                  className="opacity-60"
                  tooltip={`${session.session_name || session.session_id} (${t('sidebar.deleted')})`}
                  onClick={() => router.push('/dashboard/trash')}
                >
                  <QrCode className="size-4" />
                  <span className="truncate line-through">{session.session_name || session.session_id}</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem onClick={() => handleRestoreSession(session.session_id)}>
                      <RotateCcw className="mr-2 size-4 text-muted-foreground" />
                      <span>{t('sidebar.restore')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handlePermanentDelete(session.session_id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 size-4" />
                      <span>{t('sidebar.permanentDelete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
            {deletedSessions.length > 5 && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-muted-foreground"
                  onClick={() => router.push('/dashboard/trash')}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="text-xs">+{deletedSessions.length - 5} {t('sidebar.moreItems')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}
