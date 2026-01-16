"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2, Unlock, Eye, Ban, Plus, Minus, Trash2 } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/sonner"
import { useConfirmDialog } from "@/components/confirm-dialog"
import type { AdminUser, UserAdRecords } from "@/types"

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
  // Barcode Types
  barcodeEAN13: { name: "EAN-13", type: "barcode", adCount: 2 },
  barcodeEAN8: { name: "EAN-8", type: "barcode", adCount: 2 },
  barcodeUPCA: { name: "UPC-A", type: "barcode", adCount: 2 },
  barcodeUPCE: { name: "UPC-E", type: "barcode", adCount: 2 },
  barcodeCode128: { name: "Code 128", type: "barcode", adCount: 2 },
  barcodeCode39: { name: "Code 39", type: "barcode", adCount: 2 },
  barcodeCode93: { name: "Code 93", type: "barcode", adCount: 2 },
  barcodeCodabar: { name: "Codabar", type: "barcode", adCount: 2 },
  barcodeITF: { name: "ITF", type: "barcode", adCount: 2 },
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

interface AdRecordsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  accessToken: string | null
  onSuccess: () => void
}

export function AdRecordsModal({
  open,
  onOpenChange,
  user,
  accessToken,
  onSuccess,
}: AdRecordsModalProps) {
  const t = useTranslations()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // 편집 상태
  const [unlockedFeatures, setUnlockedFeatures] = React.useState<string[]>([])
  const [adWatchCounts, setAdWatchCounts] = React.useState<Record<string, number>>({})
  const [bannerSettings, setBannerSettings] = React.useState<Record<string, boolean>>({})

  // 데이터 로드
  React.useEffect(() => {
    if (open && user && accessToken) {
      fetchAdRecords()
    }
  }, [open, user, accessToken])

  const fetchAdRecords = async () => {
    if (!user || !accessToken) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}/ad-records`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUnlockedFeatures(data.data.unlockedFeatures || [])
          setAdWatchCounts(data.data.adWatchCounts || {})
          setBannerSettings(data.data.bannerSettings || {})
        }
      }
    } catch {
      toast.error(t("adRecords.loadError"))
    } finally {
      setIsLoading(false)
    }
  }

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
        toast.success(t("adRecords.saveSuccess"))
        onSuccess()
        onOpenChange(false)
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
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        setUnlockedFeatures([])
        setAdWatchCounts({})
        setBannerSettings({})
        toast.success(t("adRecords.resetSuccess"))
        onSuccess()
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

  // 전체 해제/잠금
  const unlockAll = () => {
    setUnlockedFeatures(Object.keys(FEATURE_CONFIG))
  }

  const lockAll = () => {
    setUnlockedFeatures([])
  }

  // 광고 횟수 전체 초기화
  const resetAllCounts = () => {
    setAdWatchCounts({})
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('admin.adRecords.title')}</DialogTitle>
            <DialogDescription>
              {user?.name} ({user?.email})
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="unlocked" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unlocked">
                  <Unlock className="h-4 w-4 mr-2" />
                  {t('admin.adRecords.unlocked')}
                </TabsTrigger>
                <TabsTrigger value="counts">
                  <Eye className="h-4 w-4 mr-2" />
                  {t('admin.adRecords.watchCounts')}
                </TabsTrigger>
                <TabsTrigger value="banner">
                  <Ban className="h-4 w-4 mr-2" />
                  {t('admin.adRecords.banner')}
                </TabsTrigger>
              </TabsList>

              {/* 해제된 기능 탭 */}
              <TabsContent value="unlocked">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={unlockAll}>
                        {t('admin.adRecords.unlockAll')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={lockAll}>
                        {t('admin.adRecords.lockAll')}
                      </Button>
                    </div>

                    {["qrType", "barcode", "qrStyle", "settings", "backup"].map((type) => (
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
                                {isUnlocked && <Unlock className="mr-1 h-3 w-3" />}
                                {config.name}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* 광고 시청 횟수 탭 */}
              <TabsContent value="counts">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <Button variant="outline" size="sm" onClick={resetAllCounts}>
                      {t('admin.adRecords.resetCounts')}
                    </Button>

                    {["qrType", "barcode", "qrStyle", "settings", "backup"].map((type) => (
                      <div key={type} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          {t(`adRecords.featureTypes.${type}`)}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
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
                                    (필요: {config.adCount})
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
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* 배너 광고 설정 탭 */}
              <TabsContent value="banner">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('admin.adRecords.bannerDesc')}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-xs text-muted-foreground">
                    * ON = 배너 광고 표시, OFF = 배너 광고 숨김
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isLoading || isSaving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('adRecords.reset')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('adRecords.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </>
  )
}
