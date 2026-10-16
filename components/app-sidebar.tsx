"use client"

import * as React from "react"
import { ScanLine } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
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

export function AppSidebar({ currentSessionId, ...props }: AppSidebarProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const t = useTranslations()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-code">
                  <ScanLine className="size-4" aria-hidden="true" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-15 font-bold">{t('sidebar.appTitle')}</span>
                  <span className="truncate text-13 text-muted-foreground">{t('sidebar.appSubtitle')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain currentSessionId={currentSessionId} />
        <NavProjects />
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
