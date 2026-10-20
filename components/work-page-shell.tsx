'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

/** 대시보드와 같은 틀(사이드바 + 위 빵부스러기)로 업무 화면(품목·실사)을 감싼다 */
export function WorkPageShell({
  crumbs,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {c.href ? (
                        <BreadcrumbLink asChild><Link href={c.href}>{c.label}</Link></BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="page pb-16">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
