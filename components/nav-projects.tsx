"use client"

import * as React from "react"
import {
  RotateCcw,
  Trash,
  Trash2,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/lib/notify"

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
    } catch {
      // 목록을 못 받으면 이전 목록 유지
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
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
        notify.success(t('trash.restored'))
      } else {
        // 서버 문구 대신 해요체 문구
        notify.error(t('trash.restoreFailed'))
      }
    } catch {
      notify.error(t('trash.restoreError'))
    }
  }

  const handlePermanentDelete = async (sessionId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // 되돌릴 수 없는 작업: 세션 이름(없으면 ID)을 똑같이 입력해야 실행 (휴지통 화면과 같게)
    const confirmed = await confirm({
      title: t('dialog.permanentDelete'),
      description: t('trash.confirmPermanentDelete'),
      confirmText: t('sidebar.permanentDelete'),
      variant: "destructive",
      typeToConfirm: name,
    })
    if (!confirmed) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
        notify.success(t('trash.permanentlyDeleted'))
      } else {
        notify.error(t('trash.permanentDeleteFailed'))
      }
    } catch {
      notify.error(t('trash.permanentDeleteError'))
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
              {/* 삭제대기는 경고가 아니므로 빨강 대신 기본 색 + 휴지통 아이콘 */}
              <SidebarMenuButton tooltip={t('sidebar.deletedSessions')}>
                <Trash2 className="size-4" aria-hidden="true" />
                <span>{t('sidebar.deletedSessions')}</span>
                <ChevronRight aria-hidden="true" className="ml-auto mr-7 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {deletedSessions.length === 0 ? (
                  // 빈 상태: 누를 수 없는 안내 글자 (버튼 모양 아님)
                  <SidebarMenuSubItem>
                    <p className="px-2 py-1.5 text-13 text-muted-foreground">{t('sidebar.noDeletedSessions')}</p>
                  </SidebarMenuSubItem>
                ) : (
                  <>
                    {deletedSessions.slice(0, 5).map((session) => {
                      const displayName = session.session_name || session.session_id.slice(0, 8)
                      return (
                      <SidebarMenuSubItem key={session.session_id} className="group/session relative">
                        <SidebarMenuSubButton
                          className="cursor-pointer pr-10 text-muted-foreground"
                          onClick={() => router.push('/dashboard/trash')}
                        >
                          <span className="truncate">{displayName}</span>
                        </SidebarMenuSubButton>

                        {/* 드롭다운 메뉴 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${displayName} ${t('table.actions')}`}
                              className="absolute right-1 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-opacity outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/session:opacity-100 [@media(hover:hover)]:group-focus-within/session:opacity-100"
                            >
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-48"
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                          >
                            <DropdownMenuItem onClick={(e) => handleRestoreSession(session.session_id, e)}>
                              <RotateCcw className="mr-2 size-4 text-muted-foreground" />
                              <span>{t('sidebar.restore')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handlePermanentDelete(session.session_id, session.session_name || session.session_id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 size-4" />
                              <span>{t('sidebar.permanentDelete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                      )
                    })}
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
