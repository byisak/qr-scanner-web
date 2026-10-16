"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Unlock, Lock, Eye, Ban, Plus, Minus, Trash2 } from "lucide-react"

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
import { Chip } from "@/components/ui/chip"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notify } from "@/lib/notify"
import { useConfirmDialog } from "@/components/confirm-dialog"
import type { AdminUser, UserAdRecords } from "@/types"

// 잠금 가능한 기능 목록 (모바일 앱과 동일 - lockedFeatures.js)
const FEATURE_CONFIG: Record<string, { name: string; type: string; adCount: number }> = {
  // ===== QR Types =====
  qrTypeWebsite: { name: "Website", type: "qrType", adCount: 2 },
  qrTypeContact: { name: "Contact", type: "qrType", adCount: 2 },
  qrTypeWifi: { name: "WiFi", type: "qrType", adCount: 2 },
  qrTypeClipboard: { name: "Clipboard", type: "qrType", adCount: 2 },
  qrTypeEmail: { name: "Email", type: "qrType", adCount: 2 },
  qrTypeSms: { name: "SMS", type: "qrType", adCount: 2 },
  qrTypePhone: { name: "Phone", type: "qrType", adCount: 2 },
  qrTypeEvent: { name: "Event", type: "qrType", adCount: 2 },
  qrTypeLocation: { name: "Location", type: "qrType", adCount: 2 },

  // ===== QR Styles =====
  qrStyleRounded: { name: "Rounded", type: "qrStyle", adCount: 3 },
  qrStyleDots: { name: "Dots", type: "qrStyle", adCount: 3 },
  qrStyleClassy: { name: "Classy", type: "qrStyle", adCount: 3 },
  qrStyleBlueGradient: { name: "Blue Gradient", type: "qrStyle", adCount: 3 },
  qrStyleSunset: { name: "Sunset", type: "qrStyle", adCount: 3 },
  qrStyleDarkMode: { name: "Dark Mode", type: "qrStyle", adCount: 3 },
  qrStyleNeon: { name: "Neon", type: "qrStyle", adCount: 3 },

  // ===== Settings =====
  batchScan: { name: "Batch Scan", type: "settings", adCount: 3 },
  realtimeSync: { name: "Realtime Sync", type: "settings", adCount: 4 },
  scanUrlIntegration: { name: "URL Integration", type: "settings", adCount: 3 },
  productSearch: { name: "Product Search", type: "settings", adCount: 2 },
  photoSave: { name: "Photo Save", type: "settings", adCount: 3 },
  lotteryScan: { name: "Lottery Scan", type: "settings", adCount: 2 },

  // ===== Backup =====
  icloudBackup: { name: "iCloud Backup", type: "backup", adCount: 3 },
  googleDriveBackup: { name: "Google Drive Backup", type: "backup", adCount: 3 },

  // ===== Barcode Types (97 types) =====
  // --- 1D Industrial/Logistics ---
  barcodeCode39: { name: "Code 39", type: "barcode", adCount: 2 },
  barcodeCode39ext: { name: "Code 39 Extended", type: "barcode", adCount: 2 },
  barcodeCode93: { name: "Code 93", type: "barcode", adCount: 2 },
  barcodeCode93ext: { name: "Code 93 Extended", type: "barcode", adCount: 2 },
  barcodeCode11: { name: "Code 11", type: "barcode", adCount: 2 },
  barcodeIndustrial2of5: { name: "Industrial 2 of 5", type: "barcode", adCount: 2 },
  barcodeInterleaved2of5: { name: "Interleaved 2 of 5", type: "barcode", adCount: 2 },
  barcodeItf14: { name: "ITF-14", type: "barcode", adCount: 2 },
  barcodeMatrix2of5: { name: "Matrix 2 of 5", type: "barcode", adCount: 2 },
  barcodeCoop2of5: { name: "COOP 2 of 5", type: "barcode", adCount: 2 },
  barcodeIata2of5: { name: "IATA 2 of 5", type: "barcode", adCount: 2 },
  barcodeDatalogic2of5: { name: "Datalogic 2 of 5", type: "barcode", adCount: 2 },

  // --- Retail ---
  barcodeEan13: { name: "EAN-13", type: "barcode", adCount: 2 },
  barcodeEan8: { name: "EAN-8", type: "barcode", adCount: 2 },
  barcodeEan5: { name: "EAN-5", type: "barcode", adCount: 2 },
  barcodeEan2: { name: "EAN-2", type: "barcode", adCount: 2 },
  barcodeUpca: { name: "UPC-A", type: "barcode", adCount: 2 },
  barcodeUpce: { name: "UPC-E", type: "barcode", adCount: 2 },
  barcodeIsbn: { name: "ISBN", type: "barcode", adCount: 2 },
  barcodeIsmn: { name: "ISMN", type: "barcode", adCount: 2 },
  barcodeIssn: { name: "ISSN", type: "barcode", adCount: 2 },
  barcodeEan13composite: { name: "EAN-13 Composite", type: "barcode", adCount: 2 },
  barcodeEan8composite: { name: "EAN-8 Composite", type: "barcode", adCount: 2 },
  barcodeUpcacomposite: { name: "UPC-A Composite", type: "barcode", adCount: 2 },
  barcodeUpcecomposite: { name: "UPC-E Composite", type: "barcode", adCount: 2 },

  // --- GS1 / Logistics ---
  barcodeGs1128: { name: "GS1-128", type: "barcode", adCount: 2 },
  barcodeGs1cc: { name: "GS1 Composite", type: "barcode", adCount: 2 },
  barcodeGs1databar: { name: "GS1 DataBar Omnidirectional", type: "barcode", adCount: 2 },
  barcodeGs1databarstacked: { name: "GS1 DataBar Stacked", type: "barcode", adCount: 2 },
  barcodeGs1databarstackedomni: { name: "GS1 DataBar Stacked Omni", type: "barcode", adCount: 2 },
  barcodeGs1databartruncated: { name: "GS1 DataBar Truncated", type: "barcode", adCount: 2 },
  barcodeGs1databarlimited: { name: "GS1 DataBar Limited", type: "barcode", adCount: 2 },
  barcodeGs1databarexpanded: { name: "GS1 DataBar Expanded", type: "barcode", adCount: 2 },
  barcodeGs1databarexpandedstacked: { name: "GS1 DataBar Expanded Stacked", type: "barcode", adCount: 2 },
  barcodeGs1northamericancoupon: { name: "GS1 North American Coupon", type: "barcode", adCount: 2 },
  barcodeGs1qrcode: { name: "GS1 QR Code", type: "barcode", adCount: 2 },
  barcodeGs1dotcode: { name: "GS1 DotCode", type: "barcode", adCount: 2 },
  barcodeSscc18: { name: "SSCC-18", type: "barcode", adCount: 2 },
  barcodeEan14: { name: "EAN-14", type: "barcode", adCount: 2 },

  // --- Medical/Pharmaceutical ---
  barcodePharmacode: { name: "Pharmacode", type: "barcode", adCount: 2 },
  barcodePharmacode2: { name: "Pharmacode Two-Track", type: "barcode", adCount: 2 },
  barcodeCode32: { name: "Code 32 (Italian Pharma)", type: "barcode", adCount: 2 },
  barcodePzn: { name: "PZN", type: "barcode", adCount: 2 },
  barcodeHibc39: { name: "HIBC Code 39", type: "barcode", adCount: 2 },
  barcodeHibc128: { name: "HIBC Code 128", type: "barcode", adCount: 2 },
  barcodeHibcdatamatrix: { name: "HIBC Data Matrix", type: "barcode", adCount: 2 },
  barcodeHibcpdf417: { name: "HIBC PDF417", type: "barcode", adCount: 2 },
  barcodeHibcqrcode: { name: "HIBC QR Code", type: "barcode", adCount: 2 },
  barcodeHibcazteccode: { name: "HIBC Aztec Code", type: "barcode", adCount: 2 },
  barcodeHibccodablockf: { name: "HIBC Codablock F", type: "barcode", adCount: 2 },
  barcodeHibcmicropdf417: { name: "HIBC MicroPDF417", type: "barcode", adCount: 2 },

  // --- Library/Special ---
  barcodeCodabar: { name: "Codabar", type: "barcode", adCount: 2 },
  barcodeBc412: { name: "BC412", type: "barcode", adCount: 2 },
  barcodeMsi: { name: "MSI", type: "barcode", adCount: 2 },
  barcodePlessey: { name: "Plessey", type: "barcode", adCount: 2 },
  barcodeTelepen: { name: "Telepen", type: "barcode", adCount: 2 },
  barcodeTelepennumeric: { name: "Telepen Numeric", type: "barcode", adCount: 2 },
  barcodeChannelcode: { name: "Channel Code", type: "barcode", adCount: 2 },
  barcodePosicode: { name: "PosiCode", type: "barcode", adCount: 2 },

  // --- Postal ---
  barcodePostnet: { name: "POSTNET", type: "barcode", adCount: 2 },
  barcodePlanet: { name: "PLANET", type: "barcode", adCount: 2 },
  barcodeUspsintellligentmail: { name: "USPS Intelligent Mail", type: "barcode", adCount: 2 },
  barcodeOnecode: { name: "OneCode", type: "barcode", adCount: 2 },
  barcodeRoyalmail: { name: "Royal Mail 4-State", type: "barcode", adCount: 2 },
  barcodeKix: { name: "KIX (Dutch)", type: "barcode", adCount: 2 },
  barcodeJapanpost: { name: "Japan Post", type: "barcode", adCount: 2 },
  barcodeAuspost: { name: "Australia Post", type: "barcode", adCount: 2 },
  barcodeDeutschepost: { name: "Deutsche Post Leitcode", type: "barcode", adCount: 2 },
  barcodeDeutschepostidentcode: { name: "Deutsche Post Identcode", type: "barcode", adCount: 2 },
  barcodeCepnet: { name: "CEPNet", type: "barcode", adCount: 2 },
  barcodeFlattermarken: { name: "Flattermarken", type: "barcode", adCount: 2 },
  barcodeLeitcode: { name: "Leitcode", type: "barcode", adCount: 2 },
  barcodeIdentcode: { name: "Identcode", type: "barcode", adCount: 2 },

  // --- 2D Barcodes ---
  barcodeQrcode: { name: "QR Code", type: "barcode", adCount: 2 },
  barcodeMicroqrcode: { name: "Micro QR Code", type: "barcode", adCount: 2 },
  barcodeRectangularmicroqrcode: { name: "Rectangular Micro QR", type: "barcode", adCount: 2 },
  barcodeDatamatrix: { name: "Data Matrix", type: "barcode", adCount: 2 },
  barcodeDatamatrixrectangular: { name: "Data Matrix Rectangular", type: "barcode", adCount: 2 },
  barcodeDatamatrixrectangularextension: { name: "Data Matrix Rectangular Ext", type: "barcode", adCount: 2 },
  barcodePdf417: { name: "PDF417", type: "barcode", adCount: 2 },
  barcodePdf417compact: { name: "Compact PDF417", type: "barcode", adCount: 2 },
  barcodeMicropdf417: { name: "MicroPDF417", type: "barcode", adCount: 2 },
  barcodeAzteccode: { name: "Aztec Code", type: "barcode", adCount: 2 },
  barcodeAzteccodecompact: { name: "Compact Aztec Code", type: "barcode", adCount: 2 },
  barcodeAztecrune: { name: "Aztec Runes", type: "barcode", adCount: 2 },
  barcodeMaxicode: { name: "MaxiCode", type: "barcode", adCount: 2 },
  barcodeDotcode: { name: "DotCode", type: "barcode", adCount: 2 },
  barcodeHanxin: { name: "Han Xin Code", type: "barcode", adCount: 2 },
  barcodeCodeone: { name: "Code One", type: "barcode", adCount: 2 },
  barcodeUltracode: { name: "Ultracode", type: "barcode", adCount: 2 },

  // --- Stacked Barcodes ---
  barcodeCodablockf: { name: "Codablock F", type: "barcode", adCount: 2 },
  barcodeCode16k: { name: "Code 16K", type: "barcode", adCount: 2 },
  barcodeCode49: { name: "Code 49", type: "barcode", adCount: 2 },

  // --- Automotive ---
  barcodeVin: { name: "VIN (Vehicle ID)", type: "barcode", adCount: 2 },
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
      } else {
        notify.error(t("adRecords.loadError"))
      }
    } catch {
      notify.error(t("adRecords.loadError"))
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
        notify.success(t("adRecords.saveSuccess"))
        onSuccess()
        onOpenChange(false)
      } else {
        notify.error(t("adRecords.saveError"))
      }
    } catch {
      notify.error(t("adRecords.saveError"))
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
        notify.success(t("adRecords.resetSuccess"))
        onSuccess()
      } else {
        notify.error(t("adRecords.resetError"))
      }
    } catch {
      notify.error(t("adRecords.resetError"))
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

    // 필요 광고 횟수 확인
    const requiredCount = FEATURE_CONFIG[featureId]?.adCount || 0

    // 광고 횟수가 필요 횟수를 충족하면 자동 잠금 해제
    if (newCount >= requiredCount && !unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures([...unlockedFeatures, featureId])
    }
    // 광고 횟수가 필요 횟수 미만이면 잠금 상태로 변경
    else if (newCount < requiredCount && unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures(unlockedFeatures.filter((f) => f !== featureId))
    }
  }

  // 광고 횟수 직접 입력 시
  const setWatchCount = (featureId: string, value: number) => {
    const newCount = Math.max(0, value)
    setAdWatchCounts({ ...adWatchCounts, [featureId]: newCount })

    // 필요 광고 횟수 확인
    const requiredCount = FEATURE_CONFIG[featureId]?.adCount || 0

    // 광고 횟수가 필요 횟수를 충족하면 자동 잠금 해제
    if (newCount >= requiredCount && !unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures([...unlockedFeatures, featureId])
    }
    // 광고 횟수가 필요 횟수 미만이면 잠금 상태로 변경
    else if (newCount < requiredCount && unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures(unlockedFeatures.filter((f) => f !== featureId))
    }
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

  const groupTitle = "text-13 font-bold text-muted-foreground"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl" closeLabel={t('common.close')}>
          <DialogHeader>
            <DialogTitle>{t('admin.adRecords.title')}</DialogTitle>
            <DialogDescription className="break-all">
              {user?.name} ({user?.email})
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <span className="sr-only" role="status">{t('common.loading')}</span>
              <Skeleton className="h-10 rounded-full" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <Skeleton key={i} className="h-9 rounded-full" style={{ width: 72 + ((i * 23) % 50) }} />
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="unlocked" className="min-w-0">
              <TabsList className="w-full overflow-x-auto">
                <TabsTrigger value="unlocked" className="flex-1">
                  <Unlock aria-hidden="true" />
                  {t('admin.adRecords.unlocked')}
                </TabsTrigger>
                <TabsTrigger value="counts" className="flex-1">
                  <Eye aria-hidden="true" />
                  {t('admin.adRecords.watchCounts')}
                </TabsTrigger>
                <TabsTrigger value="banner" className="flex-1">
                  <Ban aria-hidden="true" />
                  {t('admin.adRecords.banner')}
                </TabsTrigger>
              </TabsList>

              {/* 해제된 기능 탭: 칩을 눌러 켜고 끄기 (aria-pressed + 자물쇠 아이콘) */}
              <TabsContent value="unlocked">
                <ScrollArea className="h-[min(400px,50dvh)] pr-3">
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={unlockAll}>
                        {t('admin.adRecords.unlockAll')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={lockAll}>
                        {t('admin.adRecords.lockAll')}
                      </Button>
                    </div>

                    {["qrType", "barcode", "qrStyle", "settings", "backup"].map((type) => (
                      <div key={type} role="group" aria-labelledby={`ad-unlock-${type}`} className="space-y-2">
                        <h4 id={`ad-unlock-${type}`} className={groupTitle}>
                          {t(`adRecords.featureTypes.${type}`)}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {getFeaturesByType(type).map(([featureId, config]) => {
                            const isUnlocked = unlockedFeatures.includes(featureId)
                            return (
                              <Chip
                                key={featureId}
                                selected={isUnlocked}
                                onClick={() => toggleFeature(featureId)}
                              >
                                {isUnlocked ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" className="text-faint" />}
                                {config.name}
                              </Chip>
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
                <ScrollArea className="h-[min(400px,50dvh)] pr-3">
                  <div className="space-y-5">
                    <Button variant="outline" size="sm" onClick={resetAllCounts}>
                      {t('admin.adRecords.resetCounts')}
                    </Button>

                    {["qrType", "barcode", "qrStyle", "settings", "backup"].map((type) => (
                      <div key={type} className="space-y-2">
                        <h4 className={groupTitle}>
                          {t(`adRecords.featureTypes.${type}`)}
                        </h4>
                        <ul className="grid grid-cols-1 gap-2">
                          {getFeaturesByType(type).map(([featureId, config]) => {
                            const count = adWatchCounts[featureId] || 0
                            const inputId = `ad-count-${featureId}`
                            return (
                              <li
                                key={featureId}
                                className="flex min-w-0 items-center justify-between gap-2 rounded-field border bg-card px-3 py-2"
                              >
                                <label htmlFor={inputId} className="min-w-0 text-15">
                                  <span className="break-words">{config.name}</span>{' '}
                                  <span className="tabular text-13 text-muted-foreground">
                                    {t('adRecords.required', { count: config.adCount })}
                                  </span>
                                </label>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label={t('adRecords.decrease', { name: config.name })}
                                    onClick={() => updateWatchCount(featureId, -1)}
                                  >
                                    <Minus aria-hidden="true" />
                                  </Button>
                                  <Input
                                    id={inputId}
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={count}
                                    onChange={(e) =>
                                      setWatchCount(featureId, parseInt(e.target.value) || 0)
                                    }
                                    className="tabular h-[34px] w-16 text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label={t('adRecords.increase', { name: config.name })}
                                    onClick={() => updateWatchCount(featureId, 1)}
                                  >
                                    <Plus aria-hidden="true" />
                                  </Button>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* 배너 광고 설정 탭 */}
              <TabsContent value="banner">
                <div className="space-y-4">
                  <p id="ad-banner-desc" className="text-15 text-muted-foreground">
                    {t('admin.adRecords.bannerDesc')}
                  </p>
                  <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    {Object.entries(BANNER_SCREENS).map(([screenId, screenName]) => {
                      const on = bannerSettings[screenId] !== false
                      return (
                        <li key={screenId} className="flex items-center justify-between gap-3 rounded-field border bg-card px-3 py-2.5">
                          <label htmlFor={`banner-${screenId}`} className="text-15">
                            {screenName}
                            <span className="ml-2 text-13 text-muted-foreground">
                              {on ? t('adRecords.bannerOn') : t('adRecords.bannerOff')}
                            </span>
                          </label>
                          <Switch
                            id={`banner-${screenId}`}
                            aria-describedby="ad-banner-desc"
                            checked={on}
                            onCheckedChange={() => toggleBannerSetting(screenId)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isLoading || isSaving}
              className="sm:mr-auto"
            >
              <Trash2 aria-hidden="true" />
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
              {isSaving ? t('adRecords.saving') : t('adRecords.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </>
  )
}
