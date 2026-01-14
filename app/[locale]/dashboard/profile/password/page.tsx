"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Key, Eye, EyeOff } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/sonner"

export default function ChangePasswordPage() {
  const router = useRouter()
  const t = useTranslations()
  const { user, accessToken, isAuthenticated, logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    // 소셜 로그인 계정은 비밀번호 변경 불가
    if (user && user.provider !== "email") {
      router.push("/dashboard/profile")
    }
  }, [isAuthenticated, user, router])

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false
    if (!/[A-Za-z]/.test(password)) return false
    if (!/[0-9]/.test(password)) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("profile.passwordMismatch"))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t("profile.passwordMismatch"))
      return
    }

    if (!validatePassword(newPassword)) {
      setError(t("profile.passwordRequirements"))
      return
    }

    setIsSaving(true)
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
        // 로그아웃 후 로그인 페이지로 이동
        setTimeout(() => {
          logout()
        }, 1500)
      } else {
        setError(data.error?.message || t("profile.passwordChangeError"))
      }
    } catch (error) {
      // console.error("Password change error:", error)
      setError(t("profile.passwordChangeError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || user.provider !== "email") {
    return null
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => router.push("/dashboard/profile")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("profile.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("profile.changePassword")}
          </CardTitle>
          <CardDescription>{t("profile.changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label>
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
              <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
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
              <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
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

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSaving ? t("profile.saving") : t("profile.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
