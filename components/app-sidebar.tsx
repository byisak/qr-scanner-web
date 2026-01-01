"use client"

import * as React from "react"
import { QrCode, Plus, Trash2, RotateCcw, Trash, List, Clock, LogIn, LogOut, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

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
  const [sessionInput, setSessionInput] = React.useState('')
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [deletedSessions, setDeletedSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

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

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sessionInput.trim()) {
      const sessionId = sessionInput.trim()

      // 중복 체크
      if (sessions.find(s => s.session_id === sessionId)) {
        router.push(`/session/${sessionId}`)
        setSessionInput('')
        return
      }

      // 새 세션으로 이동 (세션 페이지에서 자동 생성됨)
      setSessionInput('')
      router.push(`/session/${sessionId}`)

      // 약간의 지연 후 목록 새로고침
      setTimeout(() => {
        fetchSessions()
      }, 1000)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    router.push(`/session/${sessionId}`)
  }

  // Soft Delete
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('세션을 삭제하시겠습니까?')) return

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
        alert(data.error || '삭제 실패')
      }
    } catch (error) {
      console.error('세션 삭제 실패:', error)
      alert('세션 삭제 중 오류가 발생했습니다.')
    }
  }

  // 복구
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
        alert(data.error || '복구 실패')
      }
    } catch (error) {
      console.error('세션 복구 실패:', error)
      alert('세션 복구 중 오류가 발생했습니다.')
    }
  }

  // 영구 삭제
  const handlePermanentDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('세션을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

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
        alert(data.error || '영구 삭제 실패')
      }
    } catch (error) {
      console.error('세션 영구 삭제 실패:', error)
      alert('세션 영구 삭제 중 오류가 발생했습니다.')
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
                  <span className="truncate font-semibold">QR Scanner</span>
                  <span className="truncate text-xs">실시간 스캔 모니터</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>세션 추가</SidebarGroupLabel>
          <SidebarGroupContent>
            <form onSubmit={handleAddSession} className="flex gap-2 px-2 py-2">
              <Input
                placeholder="세션 ID..."
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                className="h-8"
              />
              <Button type="submit" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
            >
              <List className="size-4" />
              세션 목록 {isAuthenticated ? `(${sessions.length})` : ''}
            </a>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isAuthenticated ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  <p className="mb-2">세션 목록을 보려면</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="size-4 mr-2" />
                    로그인
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  로딩 중...
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  세션을 추가하세요
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
                      <span className="sr-only">삭제</span>
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
                삭제대기 ({deletedSessions.length})
              </a>
            </SidebarGroupLabel>
            {deletedSessions.length > 0 && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {deletedSessions.slice(0, 5).map((session) => (
                    <SidebarMenuItem key={session.session_id}>
                      <SidebarMenuButton
                        className="opacity-60"
                        tooltip={`${session.session_name || session.session_id} (삭제됨)`}
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
                        <span className="sr-only">복구</span>
                      </SidebarMenuAction>
                      <SidebarMenuAction
                        onClick={(e) => handlePermanentDelete(session.session_id, e)}
                        showOnHover
                      >
                        <Trash className="size-4 text-destructive" />
                        <span className="sr-only">영구삭제</span>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                  {deletedSessions.length > 5 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="text-muted-foreground"
                        onClick={() => router.push('/dashboard/trash')}
                      >
                        <span className="text-xs">+{deletedSessions.length - 5}개 더보기...</span>
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
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={user.email}>
                  <User className="size-4" />
                  <span className="truncate">{user.name || user.email}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  <span>로그아웃</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/login')}
                className="text-primary"
              >
                <LogIn className="size-4" />
                <span>로그인</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
