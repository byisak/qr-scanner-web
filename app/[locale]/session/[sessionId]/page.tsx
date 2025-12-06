'use client';

import { useSocket } from '@/hooks/use-socket';
import { useTranslations, useLocale } from 'next-intl';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ScanDataTable } from '@/components/scan-data-table';
import { useColumns } from '@/components/scan-table-columns';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function SessionPage() {
  const t = useTranslations('session');
  const tDashboard = useTranslations('dashboard');
  const locale = useLocale();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { scans, isConnected, error } = useSocket(sessionId);
  const columns = useColumns();

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error(t('exportFailed'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert(t('exportError'));
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar currentSessionId={sessionId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${locale}/dashboard`}>{tDashboard('title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('title')}: {sessionId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{t('title')}: {sessionId}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? t('connected') : t('disconnected')}
                  </Badge>
                </div>
              </div>
              {error && (
                <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  ⚠️ {error}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={scans.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('exportCsv')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('xlsx')}
                  disabled={scans.length === 0}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('exportExcel')}
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <ScanDataTable columns={columns} data={scans} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
