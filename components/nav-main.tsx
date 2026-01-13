"use client"

import * as React from "react"
import {
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Pin,
  PinOff,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
  Clock,
  SortAsc,
  Hash,
  Check,
  Pencil,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

interface Session {
  session_id: string
  session_name: string | null
  created_at: string
  last_activity: string
  scan_count: number
}

type SortOrder = "recent" | "name" | "scans"

interface NavMainProps {
  currentSessionId?: string
}

// 핀 고정 세션 ID를 localStorage에서 관리
const PINNED_SESSIONS_KEY = "pinned-sessions"
const SORT_ORDER_KEY = "session-sort-order"

function getPinnedSessions(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(PINNED_SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePinnedSessions(ids: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(PINNED_SESSIONS_KEY, JSON.stringify(ids))
}

function getSortOrder(): SortOrder {
  if (typeof window === "undefined") return "recent"
  return (localStorage.getItem(SORT_ORDER_KEY) as SortOrder) || "recent"
}

function saveSortOrder(order: SortOrder) {
  if (typeof window === "undefined") return
  localStorage.setItem(SORT_ORDER_KEY, order)
}

export function NavMain({ currentSessionId }: NavMainProps) {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated, accessToken } = useAuth()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [pinnedIds, setPinnedIds] = React.useState<string[]>([])
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("recent")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // 초기 로드 시 localStorage에서 값 가져오기
  React.useEffect(() => {
    setPinnedIds(getPinnedSessions())
    setSortOrder(getSortOrder())
  }, [])

  // 세션 목록 가져오기
  const fetchSessions = React.useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setSessions([])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/sessions?status=ACTIVE&mine=true', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
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

  React.useEffect(() => {
    const handleRefresh = () => fetchSessions()
    window.addEventListener('sidebar-refresh', handleRefresh)
    return () => window.removeEventListener('sidebar-refresh', handleRefresh)
  }, [fetchSessions])

  // 편집 모드일 때 input에 포커스
  React.useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // 정렬된 세션 목록
  const sortedSessions = React.useMemo(() => {
    const pinned: Session[] = []
    const unpinned: Session[] = []

    sessions.forEach(session => {
      if (pinnedIds.includes(session.session_id)) {
        pinned.push(session)
      } else {
        unpinned.push(session)
      }
    })

    const sortFn = (a: Session, b: Session) => {
      switch (sortOrder) {
        case "name":
          const nameA = a.session_name || a.session_id
          const nameB = b.session_name || b.session_id
          return nameA.localeCompare(nameB)
        case "scans":
          return b.scan_count - a.scan_count
        case "recent":
        default:
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
      }
    }

    pinned.sort(sortFn)
    unpinned.sort(sortFn)

    return [...pinned, ...unpinned]
  }, [sessions, pinnedIds, sortOrder])

  // 핀 토글
  const togglePin = (sessionId: string) => {
    const newPinned = pinnedIds.includes(sessionId)
      ? pinnedIds.filter(id => id !== sessionId)
      : [...pinnedIds, sessionId]
    setPinnedIds(newPinned)
    savePinnedSessions(newPinned)
  }

  // 정렬 순서 변경
  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order)
    saveSortOrder(order)
  }

  // 세션 이름 편집 시작
  const startEditing = (session: Session, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditingId(session.session_id)
    setEditValue(session.session_name || "")
  }

  // 세션 이름 저장
  const saveSessionName = async () => {
    if (!editingId) return

    try {
      const res = await fetch(`/api/sessions/${editingId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() || null })
      })

      if (res.ok) {
        // 로컬 상태 업데이트
        setSessions(prev => prev.map(s =>
          s.session_id === editingId
            ? { ...s, session_name: editValue.trim() || null }
            : s
        ))
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
      }
    } catch (error) {
      console.error('세션 이름 변경 실패:', error)
    } finally {
      setEditingId(null)
      setEditValue("")
    }
  }

  // 세션 삭제
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t('dashboard.confirmDelete'))) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSessions()
        window.dispatchEvent(new CustomEvent('sidebar-refresh'))
        if (currentSessionId === sessionId) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Session delete failed:', error)
    }
  }

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveSessionName()
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditValue("")
    }
  }

  // 세션 클릭 핸들러 (더블클릭 감지용)
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const handleSessionClick = (e: React.MouseEvent, session: Session) => {
    e.preventDefault()

    if (clickTimeoutRef.current) {
      // 더블클릭: 편집 모드
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      startEditing(session)
    } else {
      // 싱글클릭: 타임아웃 후 네비게이션
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
        router.push(`/session/${session.session_id}`)
      }, 250)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('sidebar.platform')}</SidebarGroupLabel>
      <SidebarMenu>
        {/* 대시보드 - 클릭 시 네비게이션 */}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t('sidebar.dashboard')}
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="size-4" />
            <span>{t('sidebar.dashboard')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* 세션 목록 - 접을 수 있는 메뉴 */}
        <Collapsible
          asChild
          defaultOpen={true}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={t('sidebar.sessionList')}>
                <FolderOpen className="size-4" />
                <span>{t('sidebar.sessionList')}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            {/* 정렬 드롭다운 */}
            {isAuthenticated && sessions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction className="mr-1">
                    <ArrowUpDown className="size-3.5" />
                    <span className="sr-only">{t('sidebar.sort')}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleSortChange("recent")}>
                    <Clock className="mr-2 size-4" />
                    {t('sidebar.sortRecent')}
                    {sortOrder === "recent" && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("name")}>
                    <SortAsc className="mr-2 size-4" />
                    {t('sidebar.sortName')}
                    {sortOrder === "name" && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("scans")}>
                    <Hash className="mr-2 size-4" />
                    {t('sidebar.sortScans')}
                    {sortOrder === "scans" && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <CollapsibleContent>
              <SidebarMenuSub>
                {isLoading ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      <span className="text-muted-foreground">{t('common.loading')}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : sortedSessions.length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      <span className="text-muted-foreground">{t('sidebar.noSessions')}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  sortedSessions.map((session) => {
                    const isPinned = pinnedIds.includes(session.session_id)
                    const isEditing = editingId === session.session_id
                    const displayName = session.session_name || session.session_id.slice(0, 8)

                    return (
                      <SidebarMenuSubItem key={session.session_id} className="group/session relative">
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveSessionName}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-sm px-2"
                            placeholder={t('sidebar.sessionNamePlaceholder')}
                          />
                        ) : (
                          <>
                            <SidebarMenuSubButton
                              isActive={currentSessionId === session.session_id}
                              onClick={(e) => handleSessionClick(e, session)}
                              className="cursor-pointer pr-16"
                            >
                              {isPinned && <Pin className="size-3 mr-1 text-primary shrink-0" />}
                              <span className="truncate">{displayName}</span>
                            </SidebarMenuSubButton>

                            {/* 스캔 수 - 고정 위치 */}
                            {session.scan_count > 0 && (
                              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                {session.scan_count}
                              </span>
                            )}

                            {/* 드롭다운 메뉴 */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/session:opacity-100 p-1 hover:bg-accent rounded z-10">
                                  <MoreHorizontal className="size-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={(e) => startEditing(session, e)}>
                                  <Pencil className="mr-2 size-4" />
                                  {t('sidebar.rename')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePin(session.session_id)}>
                                  {isPinned ? (
                                    <>
                                      <PinOff className="mr-2 size-4" />
                                      {t('sidebar.unpin')}
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="mr-2 size-4" />
                                      {t('sidebar.pin')}
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteSession(session.session_id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  {t('table.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </SidebarMenuSubItem>
                    )
                  })
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
