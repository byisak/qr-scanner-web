"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Segmented } from "@/components/ui/segmented"
import { LABEL_TEMPLATES, buildLabelHtml, labelPageCount } from "@/lib/label-sheet"

type Template = keyof typeof LABEL_TEMPLATES
type Mode = "auto" | "barcode" | "qr"
interface LabelItem { code: string; name: string; spec?: string; location?: string }

/**
 * 품목 라벨 인쇄: 지금 목록(검색 결과)의 품목을 A4 라벨지에 바코드·QR 라벨로 인쇄한다.
 * 숨긴 iframe 에 라벨지 HTML 을 넣고 브라우저 인쇄 창을 연다 (PDF로 저장도 그 창에서).
 */
export function LabelPrintDialog({ items }: { items: LabelItem[] }) {
  const t = useTranslations("work.labels")
  const [open, setOpen] = React.useState(false)
  const [template, setTemplate] = React.useState<Template>("3x7")
  const [mode, setMode] = React.useState<Mode>("auto")
  const [copies, setCopies] = React.useState(1)
  const [skip, setSkip] = React.useState(0)
  const [showName, setShowName] = React.useState(true)
  const [showMeta, setShowMeta] = React.useState(true)

  const tp = LABEL_TEMPLATES[template]
  const perPage = tp.cols * tp.rows
  const skipCells = Math.min(Math.max(0, skip), perPage - 1)
  const pages = labelPageCount(items.length, { template, copies, skip: skipCells })

  const print = () => {
    const html = buildLabelHtml(items, { template, mode, copies, skip: skipCells, showName, showMeta })
    const frame = document.createElement("iframe")
    frame.setAttribute("aria-hidden", "true")
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"
    document.body.appendChild(frame)
    const doc = frame.contentWindow?.document
    if (!doc) { frame.remove(); return }
    doc.open(); doc.write(html); doc.close()
    // 글꼴이 다 그려진 다음 인쇄
    setTimeout(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      setTimeout(() => frame.remove(), 60_000)
    }, 300)
  }

  const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || min)))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!items.length}><Printer aria-hidden="true" />{t("open")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc", { count: items.length })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <span className="text-14 font-semibold">{t("sheet")}</span>
            <Segmented aria-label={t("sheet")} value={template} onValueChange={(v) => { setTemplate(v as Template); setSkip(0) }}
              options={(Object.keys(LABEL_TEMPLATES) as Template[]).map((k) => ({
                value: k, label: t("templateOption", { layout: k.replace("x", "×"), count: LABEL_TEMPLATES[k].cols * LABEL_TEMPLATES[k].rows }),
              }))} />
            <p className="text-13 text-muted-foreground">{t("templateDesc", { w: tp.w, h: tp.h })}</p>
          </div>
          <div className="grid gap-2">
            <span className="text-14 font-semibold">{t("symbol")}</span>
            <Segmented aria-label={t("symbol")} value={mode} onValueChange={(v) => setMode(v as Mode)}
              options={[{ value: "auto", label: t("modeAuto") }, { value: "barcode", label: t("modeBarcode") }, { value: "qr", label: "QR" }]} />
            <p className="text-13 text-muted-foreground">{t(`modeDesc.${mode}`)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-14 font-semibold">
              {t("copies")}
              <Input type="number" min={1} max={99} value={copies} onChange={(e) => setCopies(num(e.target.value, 1, 99))} />
            </label>
            <label className="grid gap-1.5 text-14 font-semibold">
              {t("skip")}
              <Input type="number" min={0} max={perPage - 1} value={skipCells} onChange={(e) => setSkip(num(e.target.value, 0, perPage - 1))} />
            </label>
          </div>
          <p className="-mt-3 text-13 text-muted-foreground">{t("skipDesc")}</p>
          <div className="grid gap-3">
            <label className="flex items-center justify-between gap-3 text-14">{t("showName")}<Switch checked={showName} onCheckedChange={setShowName} /></label>
            <label className="flex items-center justify-between gap-3 text-14">
              <span>{t("showMeta")} <span className="text-13 text-muted-foreground">{t("showMetaDesc")}</span></span>
              <Switch checked={showMeta} onCheckedChange={setShowMeta} />
            </label>
          </div>
        </div>
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <span className="text-13 text-muted-foreground tabular">{t("summary", { labels: items.length * copies, pages })}</span>
          <Button onClick={print} disabled={!items.length}><Printer aria-hidden="true" />{t("print")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
