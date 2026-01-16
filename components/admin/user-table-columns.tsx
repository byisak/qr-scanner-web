"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Shield, ShieldCheck, User, Mail, Check, X } from "lucide-react"
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
  t: (key: string) => string
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

const getRoleBadge = (role: string, t: (key: string) => string) => {
  switch (role) {
    case 'super_admin':
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          {t('admin.users.roleSuperAdmin')}
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="h-3 w-3" />
          {t('admin.users.roleAdmin')}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <User className="h-3 w-3" />
          {t('admin.users.roleUser')}
        </Badge>
      )
  }
}

const getProviderBadge = (provider: string) => {
  const colors: Record<string, string> = {
    email: 'bg-gray-100 text-gray-800',
    google: 'bg-red-100 text-red-800',
    apple: 'bg-black text-white',
    kakao: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <Badge variant="outline" className={colors[provider] || ''}>
      {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </Badge>
  )
}

export function createUserColumns({
  onViewUser,
  onEditUser,
  onDeleteUser,
  onRestoreUser,
  onToggleActive,
  onResetPassword,
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
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('admin.users.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
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
      cell: ({ row }) => getProviderBadge(row.original.provider),
    },
    {
      accessorKey: "isActive",
      header: t('admin.users.status'),
      cell: ({ row }) => {
        const user = row.original
        if (user.deletedAt) {
          return <Badge variant="destructive">{t('admin.users.deleted')}</Badge>
        }
        return user.isActive ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            {t('admin.users.active')}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="h-3 w-3 mr-1" />
            {t('admin.users.inactive')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "sessionCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('admin.users.sessions')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-center">{row.original.sessionCount}</span>,
    },
    {
      accessorKey: "scanCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('admin.users.scans')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-center">{row.original.scanCount}</span>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('admin.users.createdAt')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDateTime(row.original.createdAt, dateFormat, timeFormat)}
        </span>
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: t('admin.users.lastLogin'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastLoginAt
            ? formatDateTime(row.original.lastLoginAt, dateFormat, timeFormat)
            : '-'}
        </span>
      ),
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
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
