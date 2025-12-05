'use client';

import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] = useState<string>();

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
