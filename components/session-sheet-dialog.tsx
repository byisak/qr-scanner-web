"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sheet as SheetIcon, Copy, Check, Send } from "lucide-react"
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
import { Field } from "@/components/form/field"
import { notify } from "@/lib/notify"

interface WebhookState {
  url: string | null
  lastStatus: string | null
  lastAt: string | null
}

/**
 * 세션 스캔을 구글 시트로 보내기: Apps Script 코드 복사 → 웹 앱 주소 저장 → 시험 전송.
 * 저장은 PUT /api/sessions/:id/webhook (소유자·관리자만). 서버가 스캔마다 그 주소로 POST 한다.
 */
export function SessionSheetDialog({
  sessionId,
  authHeaders,
}: {
  sessionId: string
  authHeaders: Record<string, string>
}) {
  const t = useTranslations("sheet")
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<WebhookState | null>(null)
  const [url, setUrl] = React.useState("")
  const [error, setError] = React.useState("")
  const [busy, setBusy] = React.useState<"save" | "test" | null>(null)
  const [copied, setCopied] = React.useState(false)

  const script = React.useMemo(
    () => `// ScanView → Google Sheets: ${t("scriptComment")}
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['${t("colTime")}', '${t("colCode")}', '${t("colSession")}', '${t("colUser")}']);
  }
  var s = data.scan || {};
  // 코드 앞의 ' 는 바코드 숫자가 지수(8.8E+12)로 바뀌지 않게 글자로 넣는 표시
  sheet.appendRow([new Date(s.scannedAt || Date.now()), "'" + (s.code || ''), data.sessionName || data.sessionId, s.user || '']);
  return ContentService.createTextOutput('ok');
}`,
    [t]
  )

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/webhook`, { headers: authHeaders })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setState({ url: data.url, lastStatus: data.lastStatus, lastAt: data.lastAt })
      setUrl(data.url || "")
    } catch {
      setState({ url: null, lastStatus: null, lastAt: null })
    }
  }, [sessionId, authHeaders])

  React.useEffect(() => {
    if (open) {
      setError("")
      load()
    }
  }, [open, load])

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      notify.error(t("copyFailed"))
    }
  }

  const save = async (next: string) => {
    const value = next.trim()
    if (value && !/^https:\/\//i.test(value)) {
      setError(t("httpsOnly"))
      return
    }
    setBusy("save")
    try {
      const res = await fetch(`/api/sessions/${sessionId}/webhook`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ url: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || t("saveFailed"))
        return
      }
      setState({ url: data.url, lastStatus: data.lastStatus, lastAt: data.lastAt })
      notify.success(value ? t("saved") : t("turnedOff"))
    } catch {
      setError(t("saveFailed"))
    } finally {
      setBusy(null)
    }
  }

  const test = async () => {
    setBusy("test")
    try {
      const res = await fetch(`/api/sessions/${sessionId}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "test" }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.result?.ok) notify.success(t("testOk"))
      else notify.error(t("testFailed", { reason: data?.result?.error || data?.error || "" }))
      load()
    } catch {
      notify.error(t("testFailed", { reason: "" }))
    } finally {
      setBusy(null)
    }
  }

  const connected = !!state?.url
  const lastOk = state?.lastStatus?.startsWith("ok")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SheetIcon aria-hidden="true" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl" closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-5">
          <ol className="grid list-decimal gap-1.5 pl-5 text-14 text-muted-foreground">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
            <li>{t("step4")}</li>
          </ol>

          <div className="grid min-w-0 gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-13 font-semibold text-muted-foreground">{t("scriptLabel")}</span>
              <Button variant="outline" size="sm" onClick={copyScript}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? t("copied") : t("copyScript")}
              </Button>
            </div>
            <pre className="max-h-40 overflow-auto rounded-field bg-secondary px-4 py-3 font-mono text-12 leading-relaxed">{script}</pre>
          </div>

          <Field label={t("urlLabel")} help={t("urlHelp")} error={error}>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://script.google.com/macros/s/…/exec"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError("") }}
            />
          </Field>

          {connected && (
            <p className="text-13 text-muted-foreground" role="status">
              {state?.lastStatus
                ? (lastOk ? t("lastOk", { at: new Date(state.lastAt || "").toLocaleString() }) : t("lastFail", { reason: state.lastStatus.replace(/^fail\s*/, "") }))
                : t("noSendYet")}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          {connected && (
            <Button variant="ghost" onClick={() => { setUrl(""); save("") }} disabled={!!busy}>{t("turnOff")}</Button>
          )}
          {connected && (
            <Button variant="outline" onClick={test} disabled={!!busy}>
              <Send aria-hidden="true" />
              {busy === "test" ? t("testing") : t("test")}
            </Button>
          )}
          <Button onClick={() => save(url)} disabled={!!busy || !url.trim()}>{busy === "save" ? t("saving") : t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
