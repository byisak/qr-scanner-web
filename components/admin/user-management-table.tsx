"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Download, RefreshCw, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSettings } from "@/contexts/settings-context"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { createUserColumns } from "./user-table-columns"
import type { AdminUser } from "@/types"

interface UserManagementTableProps {
  users: AdminUser[]
  isLoading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onProviderFilter: (provider: string) => void
  onRoleFilter: (role: string) => void
  onStatusFilter: (status: string) => void
  onRefresh: () => void
  onViewUser: (user: AdminUser) => void
  onEditUser: (user: AdminUser) => void
  onDeleteUser: (user: AdminUser) => void
  onRestoreUser: (user: AdminUser) => void
  onToggleActive: (user: AdminUser) => void
  onResetPassword: (user: AdminUser) => void
  onManageAdRecords: (user: AdminUser) => void
  onBulkDelete: (users: AdminUser[]) => void
  onExport: () => void
  isSuperAdmin: boolean
}

export function UserManagementTable({
  users,
  isLoading,
  pagination,
  onPageChange,
  onSearch,
  onProviderFilter,
  onRoleFilter,
  onStatusFilter,
  onRefresh,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onRestoreUser,
  onToggleActive,
  onResetPassword,
  onManageAdRecords,
  onBulkDelete,
  onExport,
  isSuperAdmin,
}: UserManagementTableProps) {
  const t = useTranslations()
  const { settings } = useSettings()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState("")

  const columns = React.useMemo(
    () =>
      createUserColumns({
        onViewUser,
        onEditUser,
        onDeleteUser,
        onRestoreUser,
        onToggleActive,
        onResetPassword,
        onManageAdRecords,
        t,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        isSuperAdmin,
      }),
    [
      onViewUser,
      onEditUser,
      onDeleteUser,
      onRestoreUser,
      onToggleActive,
      onResetPassword,
      onManageAdRecords,
      t,
      settings.dateFormat,
      settings.timeFormat,
      isSuperAdmin,
    ]
  )

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  })

  const selectedUsers = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchValue)
  }

  const filterId = React.useId()

  // 필터 하나: 보이는 작은 이름 + Select (이름이 Select 에 연결된다)
  const filterSelect = (
    key: string,
    label: string,
    onChange: (v: string) => void,
    items: { value: string; label: string }[]
  ) => (
    <div className="grid min-w-0 gap-1">
      <label htmlFor={`${filterId}-${key}`} className="text-13 font-semibold text-muted-foreground">
        {label}
      </label>
      <Select onValueChange={(v) => onChange(v === "all" ? "" : v)} defaultValue="all">
        <SelectTrigger id={`${filterId}-${key}`} className="w-full sm:w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.value} value={it.value}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="grid min-w-0 gap-4">
      {/* 검색 + 필터 + 동작 */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSearch} role="search" className="flex w-full min-w-0 gap-2 sm:max-w-md">
          <div className="relative min-w-0 flex-1">
            <label htmlFor={`${filterId}-search`} className="sr-only">{t('admin.users.searchLabel')}</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={`${filterId}-search`}
              type="search"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            {t('admin.users.search')}
          </Button>
        </form>

        <div className="flex flex-wrap items-end gap-2">
          <div role="group" aria-label={t('admin.users.filters')} className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:w-auto">
            {filterSelect("provider", t('admin.users.provider'), onProviderFilter, [
              { value: "all", label: t('admin.users.allProviders') },
              { value: "email", label: t('profile.providerEmail') },
              { value: "google", label: "Google" },
              { value: "apple", label: "Apple" },
              { value: "kakao", label: t('profile.providerKakao') },
            ])}
            {filterSelect("role", t('admin.users.role'), onRoleFilter, [
              { value: "all", label: t('admin.users.allRoles') },
              { value: "user", label: t('admin.users.roleUser') },
              { value: "admin", label: t('admin.users.roleAdmin') },
              { value: "super_admin", label: t('admin.users.roleSuperAdmin') },
            ])}
            {filterSelect("status", t('admin.users.status'), onStatusFilter, [
              { value: "all", label: t('admin.users.allStatus') },
              { value: "active", label: t('admin.users.active') },
              { value: "inactive", label: t('admin.users.inactive') },
              { value: "dormant", label: t('admin.users.dormant') },
              { value: "deleted", label: t('admin.users.deleted') },
            ])}
          </div>

          <Button variant="outline" size="icon" onClick={onRefresh} aria-label={t('admin.users.refresh')} disabled={isLoading}>
            <RefreshCw aria-hidden="true" />
          </Button>

          <Button variant="outline" onClick={onExport}>
            <Download aria-hidden="true" />
            {t('admin.users.export')}
          </Button>
        </div>
      </div>

      {/* 선택된 항목 동작 */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-field border bg-card p-3" role="status">
          <span className="tabular text-15 font-semibold">
            {t('admin.users.selectedCount', { count: selectedUsers.length })}
          </span>
          <Button variant="destructive" size="sm" onClick={() => onBulkDelete(selectedUsers)}>
            {t('admin.users.bulkDelete')}
          </Button>
        </div>
      )}

      {/* 표: 좁은 화면에서는 표 안에서만 가로로 넘긴다 (Table 컨테이너가 overflow-auto) */}
      {!isLoading && users.length === 0 ? (
        <Empty icon={<Users />} title={t('admin.users.noUsers')} description={t('admin.users.noUsersDesc')} />
      ) : (
        <div className="min-w-0" aria-busy={isLoading || undefined}>
          {isLoading && <span className="sr-only" role="status">{t('common.loading')}</span>}
          <Table className="min-w-[900px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        className="whitespace-nowrap"
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i} aria-hidden="true">
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 rounded-full" style={{ width: j === 0 ? 16 : `${60 + ((i * 7 + j * 13) % 35)}%` }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 페이지 이동 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="tabular order-2 text-13 text-muted-foreground sm:order-1">
          {pagination.total > 0 &&
            t('admin.users.showingCount', {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
        </div>
        <div className="order-1 flex items-center justify-between gap-2 sm:order-2 sm:justify-end">
          <span className="tabular text-13 text-muted-foreground">
            {t('table.page')} {pagination.page} / {Math.max(pagination.totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              {t('table.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              {t('table.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
