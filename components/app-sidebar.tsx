"use client"

import * as React from "react"
import { QrCode, Plus, Trash2, RotateCcw, Trash } from "lucide-react"
import { useRouter } from "next/navigation"

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

interface Session {
  session_id: string;
  created_at: string;
  last_activity: string;
  status: string;
  deleted_at: string | null;
  scan_count: number;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentSessionId?: string;
}

export function AppSidebar({ currentSessionId, ...props }: AppSidebarProps) {
  const router = useRouter()
  const [sessionInput, setSessionInput] = React.useState('')
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [deletedSessions, setDeletedSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // 세션 목록 가져오기
  const fetchSessions = React.useCallback(async () => {
    try {
      const [activeRes, deletedRes] = await Promise.all([
        fetch('/api/sessions?status=ACTIVE'),
        fetch('/api/sessions?status=DELETED')
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
  }, [])

  React.useEffect(() => {
    fetchSessions()
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
      } else {
        const data = await res.json()
        alert(data.error || '영구 삭제 실패')
      }
    } catch (error) {
      console.error('세션 영구 삭제 실패:', error)
      alert('세션 영구 삭제 중 오류가 발생했습니다.')
    }
  }

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
          <SidebarGroupLabel>세션 목록</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
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
                      tooltip={session.session_id}
                    >
                      <QrCode className="size-4" />
                      <span className="truncate">{session.session_id}</span>
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

        {deletedSessions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>삭제대기</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {deletedSessions.map((session) => (
                  <SidebarMenuItem key={session.session_id}>
                    <SidebarMenuButton
                      className="opacity-60"
                      tooltip={`${session.session_id} (삭제됨)`}
                    >
                      <QrCode className="size-4" />
                      <span className="truncate line-through">{session.session_id}</span>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard">
                <span className="text-xs text-muted-foreground">대시보드로 이동</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
