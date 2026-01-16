"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { AdminUser } from "@/types"

interface UserEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  accessToken: string | null
  isSuperAdmin: boolean
  onSuccess: () => void
}

export function UserEditModal({
  open,
  onOpenChange,
  user,
  accessToken,
  isSuperAdmin,
  onSuccess,
}: UserEditModalProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (user) {
      setName(user.name)
      setRole(user.role)
      setIsActive(user.isActive)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !accessToken) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name !== user.name ? name : undefined,
          role: role !== user.role ? role : undefined,
          isActive: isActive !== user.isActive ? isActive : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update user')
      }

      toast({
        title: t('admin.users.updateSuccess'),
        description: t('admin.users.updateSuccessDesc'),
      })

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: t('admin.users.updateError'),
        description: err instanceof Error ? err.message : t('admin.users.updateErrorDesc'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canChangeRole = isSuperAdmin && user?.role !== 'super_admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.editUserDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('admin.users.email')}</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">{t('admin.users.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">{t('admin.users.role')}</Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={!canChangeRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('admin.users.roleUser')}</SelectItem>
                  <SelectItem value="admin">{t('admin.users.roleAdmin')}</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">{t('admin.users.roleSuperAdmin')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!canChangeRole && (
                <p className="text-xs text-muted-foreground">
                  {t('admin.users.roleChangeRestricted')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">{t('admin.users.activeStatus')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('admin.users.activeStatusDesc')}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.users.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
