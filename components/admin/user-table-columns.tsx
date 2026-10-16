"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Shield, ShieldCheck, User, Mail, Check, Ban, Trash2, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AdminUser } from "@/types"

interface ColumnProps {
  onViewUser: (user: AdminUser) => void
  onEditUser: (user: AdminUser) => void
  onDeleteUser: (user: AdminUser) => void
  onRestoreUser: (user: AdminUser) => void
  onToggleActive: (user: AdminUser) => void
  onResetPassword: (user: AdminUser) => void
  onManageAdRecords: (user: AdminUser) => void
  t: (key: string, values?: Record<string, string | number>) => string
  dateFormat: string
  timeFormat: string
  isSuperAdmin: boolean
}

const formatDateTime = (
  dateString: string,
  dateFormat: string,
  timeFormat: string
): string => {
  const date = new Date(dateString)

  let dateStr: string
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      dateStr = `${day}/${month}/${year}`
      break
    case 'MM/DD/YYYY':
      dateStr = `${month}/${day}/${year}`
      break
    default:
      dateStr = `${year}-${month}-${day}`
  }

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${dateStr} ${hours}:${minutes} ${ampm}`
  }

  return `${dateStr} ${String(hours).padStart(2, '0')}:${minutes}`
}

// 역할: 아이콘 + 글자 (색만으로 구분하지 않음, 빨강은 쓰지 않음)
const getRoleBadge = (role: string, t: (key: string) => string) => {
  switch (role) {
    case 'super_admin':
      return (
        <Badge variant="default">
          <ShieldCheck aria-hidden="true" />
          {t('admin.users.roleSuperAdmin')}
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="outline">
          <Shield aria-hidden="true" />
          {t('admin.users.roleAdmin')}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">
          <User aria-hidden="true" />
          {t('admin.users.roleUser')}
        </Badge>
      )
  }
}

// 로그인 방식: 브랜드 색 대신 같은 모양 + 이름
const getProviderBadge = (provider: string, t: (key: string) => string) => {
  const labels: Record<string, string> = {
    email: t('profile.providerEmail'),
    google: 'Google',
    apple: 'Apple',
    kakao: t('profile.providerKakao'),
  }

  return (
    <Badge variant="outline">
      {labels[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)}
    </Badge>
  )
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onClick}>
      {label}
      <ArrowUpDown aria-hidden="true" />
    </Button>
  )
}

export function createUserColumns({
  onViewUser,
  onEditUser,
  onDeleteUser,
  onRestoreUser,
  onToggleActive,
  onResetPassword,
  onManageAdRecords,
  t,
  dateFormat,
  timeFormat,
  isSuperAdmin,
}: ColumnProps): ColumnDef<AdminUser>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('table.selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`${t('table.selectRow')} ${row.original.name || row.original.email}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label={t('admin.users.name')} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={user.profileImage || undefined} alt="" />
              <AvatarFallback>{(user.name || user.email).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold">{user.name}</span>
              <span className="flex items-center gap-1 text-13 text-muted-foreground">
                <Mail className="size-3" aria-hidden="true" />
                {user.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: t('admin.users.role'),
      cell: ({ row }) => getRoleBadge(row.original.role, t),
    },
    {
      accessorKey: "provider",
      header: t('admin.users.provider'),
      cell: ({ row }) => getProviderBadge(row.original.provider, t),
    },
    {
      accessorKey: "isActive",
      header: t('admin.users.status'),
      cell: ({ row }) => {
        const user = row.original
        // 상태: 아이콘 + 글자. 삭제됨만 경고색
        if (user.deletedAt) {
          return (
            <Badge variant="destructive">
              <Trash2 aria-hidden="true" />
              {t('admin.users.deleted')}
            </Badge>
          )
        }
        return user.isActive ? (
          <Badge variant="outline">
            <Check aria-hidden="true" />
            {t('admin.users.active')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground">
            <Ban aria-hidden="true" />
            {t('admin.users.inactive')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "sessionCount",
      header: ({ column }) => (
        <SortHeader label={t('admin.users.sessions')} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="tabular">{row.original.sessionCount.toLocaleString()}</span>,
    },
    {
      accessorKey: "scanCount",
      header: ({ column }) => (
        <SortHeader label={t('admin.users.scans')} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="tabular">{row.original.scanCount.toLocaleString()}</span>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortHeader label={t('admin.users.createdAt')} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <span className="tabular">
          {formatDateTime(row.original.createdAt, dateFormat, timeFormat)}
        </span>
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: t('admin.users.lastLogin'),
      cell: ({ row }) => (
        <span className="tabular text-muted-foreground">
          {row.original.lastLoginAt
            ? formatDateTime(row.original.lastLoginAt, dateFormat, timeFormat)
            : '-'}
        </span>
      ),
    },
    {
      id: "adRecords",
      header: t('admin.users.adRecords'),
      cell: ({ row }) => {
        const user = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageAdRecords(user)}
            aria-label={t('admin.users.adRecordsLabel', { name: user.name || user.email, watched: user.adWatchedCount, unlocked: user.adUnlockedCount })}
          >
            <Tv aria-hidden="true" />
            <span className="tabular">{user.adWatchedCount}/{user.adUnlockedCount}</span>
          </Button>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const isDeleted = !!user.deletedAt
        const canModifyRole = isSuperAdmin && user.role !== 'super_admin'
        const canDelete = user.role !== 'super_admin' && (isSuperAdmin || user.role !== 'admin')

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`${user.name || user.email} ${t('admin.users.actions')}`}>
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('admin.users.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewUser(user)}>
                {t('admin.users.viewDetails')}
              </DropdownMenuItem>
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => onEditUser(user)}>
                    {t('admin.users.edit')}
                  </DropdownMenuItem>
                  {user.provider === 'email' && (
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      {t('admin.users.resetPassword')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleActive(user)}>
                    {user.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              {isDeleted ? (
                <DropdownMenuItem onClick={() => onRestoreUser(user)}>
                  {t('admin.users.restore')}
                </DropdownMenuItem>
              ) : canDelete ? (
                <DropdownMenuItem
                  onClick={() => onDeleteUser(user)}
                  className="text-destructive focus:text-destructive"
                >
                  {t('admin.users.delete')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
