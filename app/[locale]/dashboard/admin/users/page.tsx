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
import { useConfirmDialog } from '@/components/confirm-dialog';
import { notify } from '@/lib/notify';

import { UserManagementTable } from '@/components/admin/user-management-table';
import { UserDetailModal } from '@/components/admin/user-detail-modal';
import { UserEditModal } from '@/components/admin/user-edit-modal';
import { AdRecordsModal } from '@/components/admin/ad-records-modal';
import type { AdminUser } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated, isLoading: authLoading, isAdmin, isSuperAdmin, accessToken } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 상태
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [adRecordsModalOpen, setAdRecordsModalOpen] = useState(false);
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
      } else {
        notify.error(t('admin.users.loadError'));
      }
    } catch {
      notify.error(t('admin.users.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, pagination.page, pagination.limit, search, providerFilter, roleFilter, statusFilter, t]);

  useEffect(() => {
    if (isAdmin && accessToken) {
      fetchUsers();
    }
  }, [isAdmin, accessToken, fetchUsers]);

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

  const handleManageAdRecords = (user: AdminUser) => {
    setSelectedUser(user);
    setAdRecordsModalOpen(true);
  };

  const handleDeleteUser = async (user: AdminUser) => {
    // 되돌리기 어려운 작업: 사용자 이름(없으면 이메일)을 똑같이 입력해야 실행
    const confirmed = await confirm({
      title: t('admin.users.deleteConfirmTitle'),
      description: t('admin.users.deleteConfirmDesc', { name: user.name || user.email }),
      confirmText: t('admin.users.delete'),
      variant: 'destructive',
      typeToConfirm: user.name || user.email,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        notify.success(t('admin.users.deleteSuccessDesc'));
        fetchUsers();
      } else {
        // 서버 문구 대신 해요체 문구
        notify.error(t('admin.users.deleteErrorDesc'));
      }
    } catch {
      notify.error(t('admin.users.deleteErrorDesc'));
    }
  };

  const handleRestoreUser = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        notify.success(t('admin.users.restoreSuccessDesc'));
        fetchUsers();
      } else {
        notify.error(t('admin.users.restoreErrorDesc'));
      }
    } catch {
      notify.error(t('admin.users.restoreErrorDesc'));
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
        notify.success(user.isActive ? t('admin.users.deactivateSuccess') : t('admin.users.activateSuccess'));
        fetchUsers();
      } else {
        notify.error(t('admin.users.updateErrorDesc'));
      }
    } catch {
      notify.error(t('admin.users.updateErrorDesc'));
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

      if (res.ok) {
        notify.success(t('admin.users.resetPasswordSuccessDesc'));
      } else {
        notify.error(t('admin.users.resetPasswordErrorDesc'));
      }
    } catch {
      notify.error(t('admin.users.resetPasswordErrorDesc'));
    }
  };

  const handleBulkDelete = async (selectedUsers: AdminUser[]) => {
    const confirmed = await confirm({
      title: t('admin.users.bulkDeleteConfirmTitle'),
      description: t('admin.users.bulkDeleteConfirmDesc', { count: selectedUsers.length }),
      confirmText: t('admin.users.bulkDelete'),
      variant: 'destructive',
      // 일괄 삭제: 선택한 사람 수를 숫자로 입력해야 실행
      typeToConfirm: String(selectedUsers.length),
      typeToConfirmLabel: t('admin.users.typeBulkCount', { count: selectedUsers.length }),
    });

    if (!confirmed) return;

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
      } catch {
        // Continue with other users
      }
    }

    notify.success(t('admin.users.bulkDeleteSuccessDesc', { count: successCount }));

    fetchUsers();
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', t('admin.users.email'), t('admin.users.name'), t('admin.users.role'), t('admin.users.provider'), t('admin.users.status'), t('admin.users.createdAt'), t('admin.users.lastLogin')].join(','),
      ...users.map((user) =>
        [
          user.id,
          `"${user.email}"`,
          `"${user.name}"`,
          user.role,
          user.provider,
          user.isActive ? t('admin.users.active') : t('admin.users.inactive'),
          user.createdAt,
          user.lastLoginAt || '',
        ].join(',')
      ),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
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
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('dashboard.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/admin">{t('admin.dashboard.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('admin.users.title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="page pb-16">
          <div className="enter pb-6 pt-8 sm:pt-9" style={{ "--i": 0 } as React.CSSProperties}>
            <h1 className="type-h1">{t('admin.users.title')}</h1>
            <p className="mt-2 type-lead">{t('admin.users.userListDesc')}</p>
          </div>

          {/* 사용자 테이블 */}
          <div className="min-w-0">
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
                onManageAdRecords={handleManageAdRecords}
                onBulkDelete={handleBulkDelete}
                onExport={handleExport}
                isSuperAdmin={isSuperAdmin}
              />
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
          onSuccess={fetchUsers}
        />

        <AdRecordsModal
          open={adRecordsModalOpen}
          onOpenChange={setAdRecordsModalOpen}
          user={selectedUser}
          accessToken={accessToken}
          onSuccess={fetchUsers}
        />

        {ConfirmDialog}
      </SidebarInset>
    </SidebarProvider>
  );
}
