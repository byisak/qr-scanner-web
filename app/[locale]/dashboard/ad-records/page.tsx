"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { ArrowLeft, Unlock, Eye, Ban, RefreshCw, Trash2, Plus, Minus } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/sonner"
import { useConfirmDialog } from "@/components/confirm-dialog"
import type { UserAdRecords } from "@/types"

// 잠금 가능한 기능 목록 (모바일 앱과 동일)
const FEATURE_CONFIG: Record<string, { name: string; type: string; adCount: number }> = {
  // QR Types
  qrTypeWebsite: { name: "Website", type: "qrType", adCount: 2 },
  qrTypeContact: { name: "Contact", type: "qrType", adCount: 2 },
  qrTypeWifi: { name: "WiFi", type: "qrType", adCount: 2 },
  qrTypeClipboard: { name: "Clipboard", type: "qrType", adCount: 2 },
  qrTypeEmail: { name: "Email", type: "qrType", adCount: 2 },
  qrTypeSms: { name: "SMS", type: "qrType", adCount: 2 },
  qrTypePhone: { name: "Phone", type: "qrType", adCount: 2 },
  qrTypeEvent: { name: "Event", type: "qrType", adCount: 2 },
  qrTypeLocation: { name: "Location", type: "qrType", adCount: 2 },
  // QR Styles
  qrStyleRounded: { name: "Rounded", type: "qrStyle", adCount: 3 },
  qrStyleDots: { name: "Dots", type: "qrStyle", adCount: 3 },
  qrStyleClassy: { name: "Classy", type: "qrStyle", adCount: 3 },
  qrStyleBlueGradient: { name: "Blue Gradient", type: "qrStyle", adCount: 3 },
  qrStyleSunset: { name: "Sunset", type: "qrStyle", adCount: 3 },
  qrStyleDarkMode: { name: "Dark Mode", type: "qrStyle", adCount: 3 },
  qrStyleNeon: { name: "Neon", type: "qrStyle", adCount: 3 },
  // Settings
  batchScan: { name: "Batch Scan", type: "settings", adCount: 3 },
  realtimeSync: { name: "Realtime Sync", type: "settings", adCount: 4 },
  scanUrlIntegration: { name: "URL Integration", type: "settings", adCount: 3 },
  productSearch: { name: "Product Search", type: "settings", adCount: 2 },
  photoSave: { name: "Photo Save", type: "settings", adCount: 3 },
  lotteryScan: { name: "Lottery Scan", type: "settings", adCount: 2 },
  // Backup
  icloudBackup: { name: "iCloud Backup", type: "backup", adCount: 3 },
  googleDriveBackup: { name: "Google Drive Backup", type: "backup", adCount: 3 },
}

// 배너 광고가 표시되는 화면 목록
const BANNER_SCREENS: Record<string, string> = {
  scanner: "Scanner",
  history: "History",
  generator: "Generator",
  settings: "Settings",
  lotto: "Lotto",
}

export default function AdRecordsPage() {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const { user, accessToken, isAuthenticated } = useAuth()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const [adRecords, setAdRecords] = useState<UserAdRecords | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 편집 상태
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([])
  const [adWatchCounts, setAdWatchCounts] = useState<Record<string, number>>({})
  const [bannerSettings, setBannerSettings] = useState<Record<string, boolean>>({})

  const fetchAdRecords = useCallback(async () => {
    if (!user || !accessToken) return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/users/${user.id}/ad-records`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAdRecords(data.data)
          setUnlockedFeatures(data.data.unlockedFeatures || [])
          setAdWatchCounts(data.data.adWatchCounts || {})
          setBannerSettings(data.data.bannerSettings || {})
        }
      } else {
        toast.error(t("adRecords.loadError"))
      }
    } catch {
      toast.error(t("adRecords.loadError"))
    } finally {
      setIsLoading(false)
    }
  }, [user, accessToken, t])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    fetchAdRecords()
  }, [isAuthenticated, router, fetchAdRecords])

  const handleSave = async () => {
    if (!user || !accessToken) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}/ad-records`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          unlockedFeatures,
          adWatchCounts,
          bannerSettings,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAdRecords(data.data)
          toast.success(t("adRecords.saveSuccess"))
        }
      } else {
        toast.error(t("adRecords.saveError"))
      }
    } catch {
      toast.error(t("adRecords.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    const confirmed = await confirm({
      title: t("adRecords.reset"),
      description: t("adRecords.resetConfirm"),
      confirmText: t("adRecords.reset"),
      variant: "destructive",
    })

    if (!confirmed || !user || !accessToken) return

    try {
      const res = await fetch(`/api/users/${user.id}/ad-records`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        setUnlockedFeatures([])
        setAdWatchCounts({})
        setBannerSettings({})
        setAdRecords(null)
        toast.success(t("adRecords.resetSuccess"))
      } else {
        toast.error(t("adRecords.resetError"))
      }
    } catch {
      toast.error(t("adRecords.resetError"))
    }
  }

  const toggleFeature = (featureId: string) => {
    if (unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures(unlockedFeatures.filter((f) => f !== featureId))
    } else {
      setUnlockedFeatures([...unlockedFeatures, featureId])
    }
  }

  const updateWatchCount = (featureId: string, delta: number) => {
    const currentCount = adWatchCounts[featureId] || 0
    const newCount = Math.max(0, currentCount + delta)
    setAdWatchCounts({ ...adWatchCounts, [featureId]: newCount })
  }

  const toggleBannerSetting = (screenId: string) => {
    setBannerSettings({
      ...bannerSettings,
      [screenId]: !bannerSettings[screenId],
    })
  }

  const getFeaturesByType = (type: string) => {
    return Object.entries(FEATURE_CONFIG).filter(([, config]) => config.type === type)
  }

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl py-8">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("adRecords.title")}</h1>
            <p className="text-muted-foreground">{t("adRecords.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAdRecords} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {t("common.loading").replace("...", "")}
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("adRecords.reset")}
            </Button>
          </div>
        </div>

        {/* 마지막 동기화 시간 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("adRecords.lastSynced")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {adRecords?.lastSyncedAt
                ? new Date(adRecords.lastSyncedAt).toLocaleString(
                    locale === "ko" ? "ko-KR" : "en-US"
                  )
                : t("adRecords.neverSynced")}
            </p>
          </CardContent>
        </Card>

        {/* 배너 광고 설정 (화면별) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              {t("adRecords.bannerDisabled")}
            </CardTitle>
            <CardDescription>{t("adRecords.bannerDisabledDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(BANNER_SCREENS).map(([screenId, screenName]) => (
                <div key={screenId} className="flex items-center justify-between p-3 border rounded-md">
                  <Label htmlFor={`banner-${screenId}`} className="text-sm">
                    {screenName}
                  </Label>
                  <Switch
                    id={`banner-${screenId}`}
                    checked={bannerSettings[screenId] !== false}
                    onCheckedChange={() => toggleBannerSetting(screenId)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * ON = 배너 광고 표시, OFF = 배너 광고 숨김
            </p>
          </CardContent>
        </Card>

        {/* 해제된 기능 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              {t("adRecords.unlockedFeatures")}
            </CardTitle>
            <CardDescription>{t("adRecords.unlockedFeaturesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["qrType", "qrStyle", "settings", "backup"].map((type) => (
              <div key={type} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t(`adRecords.featureTypes.${type}`)}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getFeaturesByType(type).map(([featureId, config]) => {
                    const isUnlocked = unlockedFeatures.includes(featureId)
                    return (
                      <Badge
                        key={featureId}
                        variant={isUnlocked ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFeature(featureId)}
                      >
                        {isUnlocked ? <Unlock className="mr-1 h-3 w-3" /> : null}
                        {config.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ))}

            {unlockedFeatures.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("adRecords.noUnlockedFeatures")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 광고 시청 횟수 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("adRecords.adWatchCounts")}
            </CardTitle>
            <CardDescription>{t("adRecords.adWatchCountsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["qrType", "qrStyle", "settings", "backup"].map((type) => (
              <div key={type} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t(`adRecords.featureTypes.${type}`)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getFeaturesByType(type).map(([featureId, config]) => {
                    const count = adWatchCounts[featureId] || 0
                    return (
                      <div
                        key={featureId}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{config.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({t("adRecords.times")}: {config.adCount})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateWatchCount(featureId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={count}
                            onChange={(e) =>
                              setAdWatchCounts({
                                ...adWatchCounts,
                                [featureId]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 h-7 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateWatchCount(featureId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? t("adRecords.saving") : t("adRecords.save")}
          </Button>
        </div>
      </div>

      {ConfirmDialog}
    </div>
  )
}
