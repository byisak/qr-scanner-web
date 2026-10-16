"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

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
import { Field } from "@/components/form/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { notify } from "@/lib/notify"
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
  const [isLoading, setIsLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("user")
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

      if (!res.ok) {
        // 서버 문구 대신 해요체 문구
        notify.error(t('admin.users.updateErrorDesc'))
        return
      }

      notify.success(t('admin.users.updateSuccessDesc'))

      onSuccess()
      onOpenChange(false)
    } catch {
      notify.error(t('admin.users.updateErrorDesc'))
    } finally {
      setIsLoading(false)
    }
  }

  const canChangeRole = isSuperAdmin && user?.role !== 'super_admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" closeLabel={t('common.close')}>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.editUserDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label={t('admin.users.email')} id="admin-edit-email">
              <Input value={user?.email || ''} disabled readOnly className="bg-secondary" />
            </Field>

            <Field label={t('admin.users.name')} id="admin-edit-name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
            </Field>

            <Field
              label={t('admin.users.role')}
              id="admin-edit-role"
              help={!canChangeRole ? t('admin.users.roleChangeRestricted') : undefined}
            >
              {(p) => (
                <Select value={role} onValueChange={setRole} disabled={!canChangeRole}>
                  <SelectTrigger {...p}>
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
              )}
            </Field>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <label htmlFor="admin-edit-active" className="text-15 font-bold">{t('admin.users.activeStatus')}</label>
                <p id="admin-edit-active-desc" className="text-13 text-muted-foreground">
                  {t('admin.users.activeStatusDesc')}
                </p>
              </div>
              <Switch
                id="admin-edit-active"
                aria-describedby="admin-edit-active-desc"
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
              {isLoading ? t('profile.saving') : t('admin.users.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
