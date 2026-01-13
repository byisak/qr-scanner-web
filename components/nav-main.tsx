"use client"

import * as React from "react"
import { ChevronRight, QrCode, Settings, LayoutDashboard, Plus } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

interface Session {
  session_id: string
  session_name: string | null
  created_at: string
  scan_count: number
}

interface NavMainProps {
  currentSessionId?: string
  onSettingsClick?: () => void
}

export function NavMain({ currentSessionId, onSettingsClick }: NavMainProps) {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated, accessToken } = useAuth()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

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

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: t('sidebar.sessionList'),
      url: "/dashboard",
      icon: QrCode,
      isActive: true,
      items: isAuthenticated
        ? sessions.map(session => ({
            id: session.session_id,
            title: session.session_name || session.session_id.slice(0, 8),
            url: `/session/${session.session_id}`,
            isActive: currentSessionId === session.session_id,
          }))
        : [],
      showAdd: isAuthenticated,
    },
    {
      title: t('sidebar.settings'),
      url: "#",
      icon: Settings,
      isActive: false,
      onClick: onSettingsClick,
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('sidebar.platform')}</SidebarGroupLabel>
      <SidebarMenu>
        {menuItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick?.() } : undefined}
                >
                  {item.icon && <item.icon className="size-4" />}
                  <span>{item.title}</span>
                  {item.items && (
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {isLoading ? (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span className="text-muted-foreground">{t('common.loading')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ) : item.items.length === 0 ? (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span className="text-muted-foreground">{t('sidebar.noSessions')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ) : (
                      item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    )}
                    {item.showAdd && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => router.push('/dashboard')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-3 mr-1" />
                          <span>{t('sidebar.newSession')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
