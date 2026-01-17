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
import { Search, Download, RefreshCw, UserPlus, Filter } from "lucide-react"
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

  return (
    <div className="space-y-4">
      {/* 필터 및 액션 바 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t('admin.users.search')}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Select onValueChange={(v) => onProviderFilter(v === "all" ? "" : v)} defaultValue="all">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('admin.users.allProviders')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.allProviders')}</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="kakao">Kakao</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => onRoleFilter(v === "all" ? "" : v)} defaultValue="all">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('admin.users.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.allRoles')}</SelectItem>
              <SelectItem value="user">{t('admin.users.roleUser')}</SelectItem>
              <SelectItem value="admin">{t('admin.users.roleAdmin')}</SelectItem>
              <SelectItem value="super_admin">{t('admin.users.roleSuperAdmin')}</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => onStatusFilter(v === "all" ? "" : v)} defaultValue="all">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('admin.users.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.allStatus')}</SelectItem>
              <SelectItem value="active">{t('admin.users.active')}</SelectItem>
              <SelectItem value="inactive">{t('admin.users.inactive')}</SelectItem>
              <SelectItem value="dormant">{t('admin.users.dormant')}</SelectItem>
              <SelectItem value="deleted">{t('admin.users.deleted')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('admin.users.export')}
          </Button>
        </div>
      </div>

      {/* 선택된 항목 액션 */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {t('admin.users.selectedCount', { count: selectedUsers.length })}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onBulkDelete(selectedUsers)}
          >
            {t('admin.users.bulkDelete')}
          </Button>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('admin.users.noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t('admin.users.showingCount', {
            from: (pagination.page - 1) * pagination.limit + 1,
            to: Math.min(pagination.page * pagination.limit, pagination.total),
            total: pagination.total,
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            {t('table.previous')}
          </Button>
          <span className="text-sm">
            {t('table.page')} {pagination.page} / {pagination.totalPages}
          </span>
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
  )
}
