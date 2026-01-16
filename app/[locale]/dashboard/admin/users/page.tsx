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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { toast } from '@/components/ui/sonner';

import { UserManagementTable } from '@/components/admin/user-management-table';
import { UserDetailModal } from '@/components/admin/user-detail-modal';
import { UserEditModal } from '@/components/admin/user-edit-modal';
import { AdminStatsCards, ProviderStatsCard } from '@/components/admin/admin-stats-cards';
import type { AdminUser } from '@/types';

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
}

export default function AdminUsersPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated, isLoading: authLoading, isAdmin, isSuperAdmin, accessToken } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 상태
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 필터 상태
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 모달 상태
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // 사용자 목록 조회
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.set('search', search);
      if (providerFilter) params.set('provider', providerFilter);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, pagination.page, pagination.limit, search, providerFilter, roleFilter, statusFilter]);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    if (!accessToken) return;

    setStatsLoading(true);
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
      setStatsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAdmin && accessToken) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin, accessToken, fetchUsers, fetchStats]);

  // 핸들러
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUserId(user.id);
    setDetailModalOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = await confirm({
      title: t('admin.users.deleteConfirmTitle'),
      description: t('admin.users.deleteConfirmDesc', { name: user.name }),
      confirmText: t('admin.users.delete'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        toast.success(t('admin.users.deleteSuccess'), {
          description: t('admin.users.deleteSuccessDesc'),
        });
        fetchUsers();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(t('admin.users.deleteError'), {
          description: data.error?.message || t('admin.users.deleteErrorDesc'),
        });
      }
    } catch (error) {
      toast.error(t('admin.users.deleteError'), {
        description: t('admin.users.deleteErrorDesc'),
      });
    }
  };

  const handleRestoreUser = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        toast.success(t('admin.users.restoreSuccess'), {
          description: t('admin.users.restoreSuccessDesc'),
        });
        fetchUsers();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(t('admin.users.restoreError'), {
          description: data.error?.message || t('admin.users.restoreErrorDesc'),
        });
      }
    } catch (error) {
      toast.error(t('admin.users.restoreError'), {
        description: t('admin.users.restoreErrorDesc'),
      });
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        toast.success(user.isActive ? t('admin.users.deactivateSuccess') : t('admin.users.activateSuccess'));
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(t('admin.users.updateError'), {
          description: data.error?.message,
        });
      }
    } catch (error) {
      toast.error(t('admin.users.updateError'));
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    const confirmed = await confirm({
      title: t('admin.users.resetPasswordConfirmTitle'),
      description: t('admin.users.resetPasswordConfirmDesc', { email: user.email }),
      confirmText: t('admin.users.resetPassword'),
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('admin.users.resetPasswordSuccess'), {
          description: t('admin.users.resetPasswordSuccessDesc'),
        });
      } else {
        toast.error(t('admin.users.resetPasswordError'), {
          description: data.error?.message,
        });
      }
    } catch (error) {
      toast.error(t('admin.users.resetPasswordError'));
    }
  };

  const handleBulkDelete = async (selectedUsers: AdminUser[]) => {
    const confirmed = await confirm({
      title: t('admin.users.bulkDeleteConfirmTitle'),
      description: t('admin.users.bulkDeleteConfirmDesc', { count: selectedUsers.length }),
      confirmText: t('admin.users.bulkDelete'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    // 일괄 삭제 처리
    let successCount = 0;
    for (const user of selectedUsers) {
      if (user.role === 'super_admin') continue;
      if (user.role === 'admin' && !isSuperAdmin) continue;

      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) successCount++;
      } catch (error) {
        // Continue with other users
      }
    }

    toast.success(t('admin.users.bulkDeleteSuccess'), {
      description: t('admin.users.bulkDeleteSuccessDesc', { count: successCount }),
    });

    fetchUsers();
    fetchStats();
  };

  const handleExport = () => {
    // CSV 내보내기
    const csvContent = [
      ['ID', 'Email', 'Name', 'Role', 'Provider', 'Active', 'Created At', 'Last Login'].join(','),
      ...users.map((user) =>
        [
          user.id,
          user.email,
          user.name,
          user.role,
          user.provider,
          user.isActive ? 'Yes' : 'No',
          user.createdAt,
          user.lastLoginAt || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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
                  <BreadcrumbPage>{t('admin.users.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* 통계 카드 */}
          <AdminStatsCards stats={stats} isLoading={statsLoading} />

          <div className="grid gap-4 lg:grid-cols-4">
            {/* 제공자 통계 */}
            <ProviderStatsCard providers={stats?.providers} isLoading={statsLoading} />

            {/* 사용자 테이블 */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>{t('admin.users.userList')}</CardTitle>
                <CardDescription>{t('admin.users.userListDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementTable
                  users={users}
                  isLoading={isLoading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onSearch={handleSearch}
                  onProviderFilter={setProviderFilter}
                  onRoleFilter={setRoleFilter}
                  onStatusFilter={setStatusFilter}
                  onRefresh={fetchUsers}
                  onViewUser={handleViewUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onRestoreUser={handleRestoreUser}
                  onToggleActive={handleToggleActive}
                  onResetPassword={handleResetPassword}
                  onBulkDelete={handleBulkDelete}
                  onExport={handleExport}
                  isSuperAdmin={isSuperAdmin}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 모달 */}
        <UserDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          userId={selectedUserId}
          accessToken={accessToken}
        />

        <UserEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          user={selectedUser}
          accessToken={accessToken}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            fetchUsers();
            fetchStats();
          }}
        />

        {ConfirmDialog}
      </SidebarInset>
    </SidebarProvider>
  );
}
