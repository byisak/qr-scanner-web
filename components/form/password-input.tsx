"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** 비밀번호 입력 + 보기/숨기기 토글 (토글 버튼에 이름과 눌림 상태) */
export function PasswordInput({
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
