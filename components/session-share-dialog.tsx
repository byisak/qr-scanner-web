"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Share2, Copy, Check, Globe, KeyRound, Lock } from "lucide-react"
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

type Scope = "public" | "password" | "private"

/**
 * 세션 공유: 링크 복사 + 누가 볼 수 있는지 (링크가 있는 누구나 / 비밀번호 / 나만).
 * 세션 소유자·관리자에게만 보인다. 저장은 PUT /api/sessions/:id/settings
 */
export function SessionShareDialog({
  sessionId,
  isPublic,
  hasPassword,
  authHeaders,
  onSaved,
}: {
  sessionId: string
  isPublic: boolean
  hasPassword: boolean
  authHeaders: Record<string, string>
  onSaved: (next: { isPublic: boolean; hasPassword: boolean }) => void
}) {
  const t = useTranslations("share")
  const current: Scope = !isPublic ? "private" : hasPassword ? "password" : "public"
  const [open, setOpen] = React.useState(false)
  const [scope, setScope] = React.useState<Scope>(current)
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const url = `https://scanview.app/session/${sessionId}`

  React.useEffect(() => {
    if (open) {
      setScope(current)
      setPassword("")
      setError("")
    }
  }, [open, current])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      notify.error(t("copyFailed"))
    }
  }

  const save = async () => {
    // 비밀번호 보호로 처음 바꾸면 비밀번호가 꼭 있어야 한다 (이미 있으면 비워 두면 그대로)
    if (scope === "password" && !hasPassword && password.length < 4) {
      setError(t("passwordTooShort"))
      return
    }
    if (scope === "password" && password && password.length < 4) {
      setError(t("passwordTooShort"))
      return
    }
    const body: Record<string, unknown> = { isPublic: scope !== "private" }
    if (scope === "public") body.password = ""
    if (scope === "password" && password) body.password = password

    setSaving(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      onSaved({
        isPublic: scope !== "private",
        hasPassword: scope === "password" ? true : scope === "public" ? false : hasPassword,
      })
      notify.success(t("saved"))
      setOpen(false)
    } catch {
      notify.error(t("saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const options: { value: Scope; icon: React.ReactNode; title: string; desc: string }[] = [
    { value: "public", icon: <Globe />, title: t("public"), desc: t("publicDesc") },
    { value: "password", icon: <KeyRound />, title: t("password"), desc: t("passwordDesc") },
    { value: "private", icon: <Lock />, title: t("private"), desc: t("privateDesc") },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 aria-hidden="true" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-5">
          <div className="flex min-w-0 items-center gap-2 rounded-field bg-secondary px-4 py-3">
            <span className="min-w-0 flex-1 truncate font-mono text-13">{url}</span>
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label={t("copy")}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </Button>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-13 font-semibold text-muted-foreground">{t("who")}</legend>
            {options.map((o) => (
              <label
                key={o.value}
                className={
                  scope === o.value
                    ? "flex cursor-pointer items-start gap-3 rounded-field border has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 border-primary bg-secondary px-4 py-3"
                    : "flex cursor-pointer items-start gap-3 rounded-field border has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 px-4 py-3 hover:bg-secondary"
                }
              >
                <input
                  type="radio"
                  name="share-scope"
                  value={o.value}
                  checked={scope === o.value}
                  onChange={() => { setScope(o.value); setError("") }}
                  className="sr-only"
                />
                <span className="mt-0.5 text-muted-foreground [&_svg]:size-4" aria-hidden="true">{o.icon}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{o.title}</span>
                  <span className="block text-13 text-muted-foreground">{o.desc}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {scope === "password" && (
            <Field
              label={hasPassword ? t("newPassword") : t("setPassword")}
              help={hasPassword ? t("keepPasswordHelp") : t("passwordHelp")}
              error={error}
            >
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                maxLength={64}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
              />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
