"use client"

import * as React from "react"

interface SidebarRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const SidebarRefreshContext = React.createContext<SidebarRefreshContextType | null>(null)

export function SidebarRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = React.useState(0)

  const triggerRefresh = React.useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <SidebarRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </SidebarRefreshContext.Provider>
  )
}

export function useSidebarRefresh() {
  const context = React.useContext(SidebarRefreshContext)
  if (!context) {
    throw new Error("useSidebarRefresh must be used within SidebarRefreshProvider")
  }
  return context
}
