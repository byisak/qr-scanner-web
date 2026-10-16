"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Key, Eye, EyeOff } from "lucide-react"

import { useAuth, type AuthError } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, focusFirstInvalid } from "@/components/form/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { notify } from "@/lib/notify"

/** 비밀번호 입력 + 보기/숨기기 토글 (토글 버튼에 이름과 눌림 상태) */
function PasswordInput({
  shown,
  onToggle,
  showLabel,
  hideLabel,
  ...props
}: React.ComponentProps<"input"> & { shown: boolean; onToggle: () => void; showLabel: string; hideLabel: string }) {
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-12" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={onToggle}
        aria-label={shown ? hideLabel : showLabel}
        aria-pressed={shown}
      >
        {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  )
}

type Errors = { current: string; next: string; confirm: string }
const NO_ERRORS: Errors = { current: "", next: "", confirm: "" }

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
  const [errors, setErrors] = useState<Errors>(NO_ERRORS)
  const formRef = useRef<HTMLFormElement>(null)

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

  const showErrors = (next: Errors) => {
    setErrors(next)
    requestAnimationFrame(() => focusFirstInvalid(formRef.current))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사 (오류는 해당 입력 아래에)
    const next: Errors = {
      current: currentPassword ? "" : t("profile.passwordRequired"),
      next: !newPassword
        ? t("profile.passwordRequired")
        : !validatePassword(newPassword)
          ? t("profile.passwordRequirements")
          : newPassword === currentPassword
            ? t("profile.samePassword")
            : "",
      confirm: newPassword !== confirmPassword ? t("profile.passwordMismatch") : "",
    }
    if (next.current || next.next || next.confirm) {
      showErrors(next)
      return
    }
    setErrors(NO_ERRORS)

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
        notify.success(t("profile.passwordChangeSuccess"))
        // 로그아웃 후 로그인 페이지로 이동
        setTimeout(() => {
          logout()
        }, 1500)
      } else {
        // 서버 문구 대신 상황별 해요체 문구
        const code = (data as { error?: AuthError })?.error?.code
        if (code === "AUTH_INVALID_CREDENTIALS") {
          showErrors({ ...NO_ERRORS, current: t("profile.wrongCurrentPassword") })
        } else if (code === "AUTH_VALIDATION_ERROR") {
          showErrors({ ...NO_ERRORS, next: t("profile.passwordRequirements") })
        } else {
          notify.error(t("profile.passwordChangeError"))
        }
      }
    } catch {
      notify.error(t("profile.passwordChangeError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || user.provider !== "email") {
    return null
  }

  const toggleLabels = { showLabel: t("profile.showPassword"), hideLabel: t("profile.hidePassword") }

  return (
    <main id="main" className="page-narrow pb-16 pt-6 sm:pt-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2.5 mb-4"
        onClick={() => router.push("/dashboard/profile")}
      >
        <ArrowLeft aria-hidden="true" />
        {t("profile.back")}
      </Button>

      <Card className="enter">
        <CardHeader>
          <h1 className="type-h2 flex items-center gap-2">
            <Key className="size-5" aria-hidden="true" />
            {t("profile.changePassword")}
          </h1>
          <CardDescription>{t("profile.changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4" noValidate>
            <Field label={t("profile.currentPassword")} id="currentPassword" error={errors.current}>
              {(control) => (
                <PasswordInput
                  {...control}
                  {...toggleLabels}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  shown={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              )}
            </Field>

            <Field
              label={t("profile.newPassword")}
              id="newPassword"
              error={errors.next}
              help={t("profile.passwordRequirements")}
            >
              {(control) => (
                <PasswordInput
                  {...control}
                  {...toggleLabels}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  shown={showNewPassword}
                  onToggle={() => setShowNewPassword(!showNewPassword)}
                />
              )}
            </Field>

            <Field label={t("profile.confirmPassword")} id="confirmPassword" error={errors.confirm}>
              {(control) => (
                <PasswordInput
                  {...control}
                  {...toggleLabels}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  shown={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            </Field>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSaving ? t("profile.saving") : t("profile.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
