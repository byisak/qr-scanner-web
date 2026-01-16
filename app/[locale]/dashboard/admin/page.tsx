'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { AdminStatsCards, ProviderStatsCard } from '@/components/admin/admin-stats-cards';
import { AdminCharts } from '@/components/admin/admin-charts';

interface ChartData {
  date: string;
  count: number;
}

interface AdminStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newWeek: number;
    activeWeek: number;
  };
  sessions: {
    total: number;
    newToday: number;
    activeWeek: number;
  };
  scans: {
    total: number;
    today: number;
    week: number;
  };
  providers: {
    email: number;
    google: number;
    apple: number;
    kakao: number;
  };
  charts: {
    dailySignups: ChartData[];
    dailyScans: ChartData[];
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated, isLoading: authLoading, isAdmin, accessToken } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAdmin && accessToken) {
      fetchStats();
    }
  }, [isAdmin, accessToken, fetchStats]);

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('dashboard.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('admin.dashboard.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* 통계 카드 */}
          <AdminStatsCards stats={stats} isLoading={isLoading} />

          {/* 그래프 */}
          <AdminCharts
            dailySignups={stats?.charts?.dailySignups || []}
            dailyScans={stats?.charts?.dailyScans || []}
            isLoading={isLoading}
          />

          {/* 제공자 통계 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ProviderStatsCard providers={stats?.providers} isLoading={isLoading} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
