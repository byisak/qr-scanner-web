"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, User, Mail, Shield, Key } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field } from "@/components/form/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { notify } from "@/lib/notify"

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations()
  const { user, accessToken, isAuthenticated, isLoading, refreshUser } = useAuth()

  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // 로그인 정보를 불러오는 중에는 기다린다 (주소로 바로 들어오면 /login 으로 튕겼다가 /dashboard 로 가던 문제)
    if (isLoading) return
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user) {
      setName(user.name || "")
    }
  }, [isLoading, isAuthenticated, user, router])

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

  const handleSave = async () => {
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
        notify.success(t("profile.saveSuccess"))
        refreshUser?.()
      } else {
        notify.error(t("profile.saveError"))
      }
    } catch {
      notify.error(t("profile.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <main id="main" className="page-narrow pb-16 pt-6 sm:pt-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2.5 mb-4"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft aria-hidden="true" />
        {t("profile.back")}
      </Button>

      <div className="grid gap-4">
        <div className="enter pb-2" style={{ "--i": 0 } as React.CSSProperties}>
          <h1 className="type-h1">{t("profile.title")}</h1>
          <p className="mt-2 type-lead">{t("profile.subtitle")}</p>
        </div>

        <Card className="enter" style={{ "--i": 1 } as React.CSSProperties}>
          <CardHeader>
            <h2 className="type-h3 flex items-center gap-2">
              <User className="size-5" aria-hidden="true" />
              {t("profile.name")}
            </h2>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <Field label={t("profile.name")} id="name">
                <Input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Button type="submit" className="justify-self-start" disabled={isSaving || !name.trim()}>
                {isSaving ? t("profile.saving") : t("profile.save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="enter" style={{ "--i": 2 } as React.CSSProperties}>
          <CardHeader>
            <h2 className="type-h3 flex items-center gap-2">
              <Mail className="size-5" aria-hidden="true" />
              {t("profile.email")}
            </h2>
          </CardHeader>
          <CardContent>
            <Field label={t("profile.email")} id="email" help={t("profile.emailDesc")}>
              <Input value={user.email} disabled readOnly className="break-all" />
            </Field>
          </CardContent>
        </Card>

        <Card className="enter" style={{ "--i": 3 } as React.CSSProperties}>
          <CardHeader>
            <h2 className="type-h3 flex items-center gap-2">
              <Shield className="size-5" aria-hidden="true" />
              {t("profile.provider")}
            </h2>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{getProviderLabel(user.provider)}</Badge>
          </CardContent>
        </Card>

        {user.provider === "email" && (
          <Card className="enter" style={{ "--i": 4 } as React.CSSProperties}>
            <CardHeader>
              <h2 className="type-h3 flex items-center gap-2">
                <Key className="size-5" aria-hidden="true" />
                {t("profile.changePassword")}
              </h2>
              <CardDescription>{t("profile.changePasswordDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/profile/password")}
              >
                {t("profile.changePassword")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
