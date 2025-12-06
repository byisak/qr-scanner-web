"use client"

import * as React from "react"
import { QrCode, Plus } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Session {
  id: string;
  name: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentSessionId?: string;
}

export function AppSidebar({ currentSessionId, ...props }: AppSidebarProps) {
  const router = useRouter()
  const [sessionInput, setSessionInput] = React.useState('')
  const [sessions, setSessions] = React.useState<Session[]>([])

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (sessionInput.trim()) {
      const newSession: Session = {
        id: sessionInput.trim(),
        name: sessionInput.trim(),
      }

      // 중복 체크
      if (!sessions.find(s => s.id === newSession.id)) {
        setSessions([...sessions, newSession])
      }

      setSessionInput('')
      router.push(`/session/${newSession.id}`)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    router.push(`/session/${sessionId}`)
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
              {sessions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  세션을 추가하세요
                </div>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      onClick={() => handleSessionClick(session.id)}
                      isActive={currentSessionId === session.id}
                      tooltip={session.name}
                    >
                      <QrCode className="size-4" />
                      <span className="truncate">{session.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
