"use client"

import * as React from "react"
import { QrCode, Trash2, RotateCcw, Trash, List, Clock, LogIn, LogOut, User, Settings, ChevronUp } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ProfileModal } from "@/components/profile-modal"

interface Session {
  session_id: string;
  session_name: string | null;
  created_at: string;
  last_activity: string;
  status: string;
  deleted_at: string | null;
  scan_count: number;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentSessionId?: string;
  onSessionChange?: () => void;
}

export function AppSidebar({ currentSessionId, onSessionChange, ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, accessToken, logout } = useAuth()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [deletedSessions, setDeletedSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [profileModalOpen, setProfileModalOpen] = React.useState(false)
  const t = useTranslations()

  // 세션 목록 가져오기 (로그인한 경우만)
  const fetchSessions = React.useCallback(async () => {
    // 비로그인 시 세션 목록을 가져오지 않음 (보안)
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
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm(t('dashboard.confirmDelete'))) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSessions()
        onSessionChange?.()
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
        // 현재 보고 있는 세션이 삭제되면 대시보드로 이동
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

  const handleRestoreSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

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

  const handlePermanentDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

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

  const isTrashPage = pathname === '/dashboard/trash'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <QrCode className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('sidebar.appTitle')}</span>
                  <span className="truncate text-xs">{t('sidebar.appSubtitle')}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
            >
              <List className="size-4" />
              {t('sidebar.sessionList')} {isAuthenticated ? `(${sessions.length})` : ''}
            </a>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isAuthenticated ? (
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
              ) : isLoading ? (
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
                    <SidebarMenuAction
                      onClick={(e) => handleDeleteSession(session.session_id, e)}
                      showOnHover
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">{t('table.delete')}</span>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <a
                href="/dashboard/trash"
                className={`flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer ${isTrashPage ? 'text-foreground font-medium' : ''}`}
              >
                <Clock className="size-4" />
                {t('sidebar.deletedSessions')} ({deletedSessions.length})
              </a>
            </SidebarGroupLabel>
            {deletedSessions.length > 0 && (
              <SidebarGroupContent>
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
                      <SidebarMenuAction
                        onClick={(e) => handleRestoreSession(session.session_id, e)}
                        showOnHover
                        className="right-8"
                      >
                        <RotateCcw className="size-4" />
                        <span className="sr-only">{t('sidebar.restore')}</span>
                      </SidebarMenuAction>
                      <SidebarMenuAction
                        onClick={(e) => handlePermanentDelete(session.session_id, e)}
                        showOnHover
                      >
                        <Trash className="size-4 text-destructive" />
                        <span className="sr-only">{t('sidebar.permanentDelete')}</span>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                  {deletedSessions.length > 5 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="text-muted-foreground"
                        onClick={() => router.push('/dashboard/trash')}
                      >
                        <span className="text-xs">+{deletedSessions.length - 5} {t('sidebar.moreItems')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isAuthenticated && user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name || t('sidebar.user')}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                    <Settings className="mr-2 size-4" />
                    {t('sidebar.profileSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/login')}
                className="text-primary"
              >
                <LogIn className="size-4" />
                <span>{t('sidebar.login')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </Sidebar>
  )
}
