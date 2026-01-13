"use client"

import * as React from "react"
import {
  FileX,
  RotateCcw,
  Trash,
  Trash2,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmDialog } from "@/components/confirm-dialog"

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
  const { confirm, ConfirmDialog } = useConfirmDialog()

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

  const handleRestoreSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handlePermanentDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('dialog.permanentDelete'),
      description: t('trash.confirmPermanentDelete'),
      confirmText: t('sidebar.permanentDelete'),
      variant: "destructive"
    })
    if (!confirmed) return

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
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible
          asChild
          defaultOpen={false}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={t('sidebar.deletedSessions')}>
                <Trash2 className="size-4" />
                <span>{t('sidebar.deletedSessions')}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {deletedSessions.length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      <span className="text-muted-foreground">{t('sidebar.noDeletedSessions')}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  <>
                    {deletedSessions.slice(0, 5).map((session) => (
                      <SidebarMenuSubItem key={session.session_id} className="group/session relative">
                        <SidebarMenuSubButton
                          className="opacity-60 cursor-pointer pr-16"
                          onClick={() => router.push('/dashboard/trash')}
                        >
                          <span className="line-through truncate">
                            {session.session_name || session.session_id.slice(0, 8)}
                          </span>
                        </SidebarMenuSubButton>

                        {/* 드롭다운 메뉴 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/session:opacity-100 p-1 hover:bg-accent rounded z-10">
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-48 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                          >
                            <DropdownMenuItem onClick={(e) => handleRestoreSession(session.session_id, e)}>
                              <RotateCcw className="mr-2 size-4 text-muted-foreground" />
                              <span>{t('sidebar.restore')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handlePermanentDelete(session.session_id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 size-4" />
                              <span>{t('sidebar.permanentDelete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                    ))}
                    {deletedSessions.length > 5 && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          className="text-muted-foreground"
                          onClick={() => router.push('/dashboard/trash')}
                        >
                          <span>+{deletedSessions.length - 5} {t('sidebar.moreItems')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </>
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
      {ConfirmDialog}
    </SidebarGroup>
  )
}
