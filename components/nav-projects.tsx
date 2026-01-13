"use client"

import * as React from "react"
import {
  FileX,
  RotateCcw,
  Trash,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
import { useAuth } from "@/contexts/auth-context"

interface Session {
  session_id: string
  session_name: string | null
  deleted_at: string | null
}

export function NavProjects() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const t = useTranslations()
  const { isAuthenticated, accessToken } = useAuth()
  const [deletedSessions, setDeletedSessions] = React.useState<Session[]>([])

  const fetchDeletedSessions = React.useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setDeletedSessions([])
      return
    }

    try {
      const res = await fetch('/api/sessions?status=DELETED&mine=true', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDeletedSessions(data)
      }
    } catch (error) {
      console.error('삭제된 세션 조회 실패:', error)
    }
  }, [isAuthenticated, accessToken])

  React.useEffect(() => {
    fetchDeletedSessions()
  }, [fetchDeletedSessions])

  React.useEffect(() => {
    const handleRefresh = () => fetchDeletedSessions()
    window.addEventListener('sidebar-refresh', handleRefresh)
    return () => window.removeEventListener('sidebar-refresh', handleRefresh)
  }, [fetchDeletedSessions])

  const handleRestoreSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore`, {
        method: 'POST'
      })
      if (res.ok) {
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

  // 비로그인 시 표시 안함
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <Trash2 className="size-4 mr-1" />
        {t('sidebar.deletedSessions')}
      </SidebarGroupLabel>
      <SidebarMenu>
        {deletedSessions.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground text-xs" disabled>
              <span>{t('sidebar.noDeletedSessions')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <>
            {deletedSessions.slice(0, 5).map((session) => (
              <SidebarMenuItem key={session.session_id}>
                <SidebarMenuButton
                  className="opacity-60"
                  onClick={() => router.push('/dashboard/trash')}
                >
                  <FileX className="size-4" />
                  <span className="line-through">{session.session_name || session.session_id.slice(0, 8)}</span>
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
                  <span>{t('sidebar.moreItems')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
