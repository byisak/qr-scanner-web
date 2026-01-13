"use client"

import * as React from "react"
import { QrCode } from "lucide-react"
import { useTranslations } from "next-intl"

import { NavUser } from "@/components/nav-user"
import { NavSessions } from "@/components/nav-sessions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UnifiedSettingsModal } from "@/components/unified-settings-modal"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentSessionId?: string
  onSessionChange?: () => void
}

export function AppSidebar({ currentSessionId, onSessionChange, ...props }: AppSidebarProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const t = useTranslations()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
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
        <NavSessions
          currentSessionId={currentSessionId}
          onSessionChange={onSessionChange}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser onSettingsClick={() => setSettingsOpen(true)} />
      </SidebarFooter>

      <SidebarRail />

      <UnifiedSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </Sidebar>
  )
}
