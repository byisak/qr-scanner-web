"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { QrCode, CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, focusFirstInvalid } from "@/components/form/field"
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card"
import { useAuth, type AuthError } from "@/contexts/auth-context"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = { name: string; email: string; password: string; confirmPassword: string }
const NO_ERRORS: Errors = { name: "", email: "", password: "", confirmPassword: "" }

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations()
  const { register, isAuthenticated, isLoading: authLoading } = useAuth()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [errors, setErrors] = React.useState<Errors>(NO_ERRORS)
  const formRef = React.useRef<HTMLFormElement>(null)

  // 이미 로그인된 경우 대시보드로 리다이렉트
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  const showErrors = (next: Errors) => {
    setErrors(next)
    requestAnimationFrame(() => focusFirstInvalid(formRef.current))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 입력 확인 (기존 규칙 그대로: 비밀번호 일치, 8자 이상) — 오류는 각 입력 아래에
    const next: Errors = {
      name: name.trim() ? "" : t("auth.nameRequired"),
      email: EMAIL_RE.test(email.trim()) ? "" : t("auth.invalidEmail"),
      password: password.length >= 8 ? "" : t("auth.passwordTooShort"),
      confirmPassword: password === confirmPassword ? "" : t("auth.passwordMismatch"),
    }
    if (Object.values(next).some(Boolean)) {
      showErrors(next)
      return
    }
    setErrors(NO_ERRORS)

    setIsLoading(true)

    try {
      await register(email, password, name)
      router.push("/dashboard")
    } catch (err) {
      // 서버 문구 대신 상황별 해요체 문구
      const code = (err as AuthError)?.code
      if (code === "AUTH_EMAIL_EXISTS") {
        showErrors({ ...NO_ERRORS, email: t("auth.emailExists") })
      } else {
        setError(t("auth.registerFailed"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-background px-4 py-16" aria-busy="true">
        <span className="sr-only" role="status">{t("common.loading")}</span>
        <Skeleton className="h-[560px] w-full max-w-md rounded-card" />
      </main>
    )
  }

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-background px-4 py-16">
      <Card className="enter w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
            <QrCode className="size-7" aria-hidden="true" />
          </div>
          <h1 className="type-h2">{t("auth.register")}</h1>
          <CardDescription>{t("auth.registerDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form ref={formRef} onSubmit={handleRegister} className="grid gap-4" noValidate>
            <Field label={t("auth.name")} error={errors.name}>
              <Input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field label={t("auth.email")} error={errors.email}>
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field label={t("auth.password")} error={errors.password} help={t("auth.passwordHint")}>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
              />
            </Field>

            <Field label={t("auth.confirmPassword")} error={errors.confirmPassword}>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-field bg-destructive-soft px-3.5 py-3 text-13 font-semibold text-destructive">
                <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <Button type="submit" size="xl" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.registering") : t("auth.register")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2 text-center">
          <p className="text-15 text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
              {t("auth.signIn")}
            </Link>
          </p>
          <Link href="/" className="text-13 text-muted-foreground underline-offset-4 hover:underline">
            {t("auth.backToHome")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
