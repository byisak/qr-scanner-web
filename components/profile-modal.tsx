"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { User, Mail, Shield, Key, Eye, EyeOff } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/sonner"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const t = useTranslations()
  const { user, accessToken, refreshUser, logout } = useAuth()

  // Profile state
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    if (user && open) {
      setName(user.name || "")
      // Reset password fields when modal opens
      setShowPasswordSection(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordError("")
    }
  }, [user, open])

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "email":
        return t("profile.providerEmail")
      case "google":
        return t("profile.providerGoogle")
      case "apple":
        return t("profile.providerApple")
      case "kakao":
        return t("profile.providerKakao")
      default:
        return provider
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (res.ok) {
        toast.success(t("profile.saveSuccess"))
        refreshUser?.()
      } else {
        const data = await res.json()
        toast.error(data.error?.message || t("profile.saveError"))
      }
    } catch (error) {
      // console.error("Profile update error:", error)
      toast.error(t("profile.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false
    if (!/[A-Za-z]/.test(password)) return false
    if (!/[0-9]/.test(password)) return false
    return true
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"))
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"))
      return
    }

    if (!validatePassword(newPassword)) {
      setPasswordError(t("profile.passwordRequirements"))
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(t("profile.passwordChangeSuccess"))
        onOpenChange(false)
        setTimeout(() => {
          logout()
        }, 1500)
      } else {
        setPasswordError(data.error?.message || t("profile.passwordChangeError"))
      }
    } catch (error) {
      // console.error("Password change error:", error)
      setPasswordError(t("profile.passwordChangeError"))
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.title")}</DialogTitle>
          <DialogDescription>{t("profile.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              {t("profile.name")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
                className="flex-1"
              />
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !name.trim()}
                size="sm"
              >
                {isSaving ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              {t("profile.email")}
            </Label>
            <Input value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">{t("profile.emailDesc")}</p>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              {t("profile.provider")}
            </Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {getProviderLabel(user.provider)}
              </span>
            </div>
          </div>

          {/* Password Change Section - Only for email provider */}
          {user.provider === "email" && (
            <>
              <Separator />

              {!showPasswordSection ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPasswordSection(true)}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {t("profile.changePassword")}
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-4 w-4" />
                      {t("profile.changePassword")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswordSection(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-xs">
                      {t("profile.currentPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t("profile.currentPasswordPlaceholder")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs">
                      {t("profile.newPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t("profile.newPasswordPlaceholder")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("profile.passwordRequirements")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs">
                      {t("profile.confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t("profile.confirmPasswordPlaceholder")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? t("profile.saving") : t("profile.changePassword")}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
