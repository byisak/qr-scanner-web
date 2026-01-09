"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, User, Mail, Shield, Key } from "lucide-react"

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

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations()
  const { user, accessToken, isAuthenticated, refreshUser } = useAuth()

  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user) {
      setName(user.name || "")
    }
  }, [isAuthenticated, user, router])

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
        toast.success(t("profile.saveSuccess"))
        refreshUser?.()
      } else {
        const data = await res.json()
        toast.error(data.error?.message || t("profile.saveError"))
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error(t("profile.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("profile.back")}
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
          <p className="text-muted-foreground">{t("profile.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("profile.name")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? t("profile.saving") : t("profile.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t("profile.email")}
            </CardTitle>
            <CardDescription>{t("profile.emailDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={user.email} disabled />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("profile.provider")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {getProviderLabel(user.provider)}
              </span>
            </div>
          </CardContent>
        </Card>

        {user.provider === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t("profile.changePassword")}
              </CardTitle>
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
    </div>
  )
}
