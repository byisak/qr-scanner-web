"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChipGroup, ChipRadio } from "@/components/ui/chip"

/**
 * 세그먼트 전환 (탭 내용이 따로 없는 보기 전환용: 목록/격자, 기간 등).
 * 둥근 회색 틀 + 선택된 칸 = 카드색 + 그림자. role=radiogroup, 화살표 키 이동.
 * 탭 내용(패널)이 있으면 components/ui/tabs.tsx (같은 모양) 를 쓴다.
 *
 *   <Segmented aria-label="보기" value={view} onValueChange={setView}
 *              options={[{ value: "list", label: "목록" }, { value: "grid", label: "격자", icon: <Grid2x2 /> }]} />
 */
export function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof ChipGroup>, "value" | "defaultValue" | "onValueChange" | "children"> & {
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }[]
  value: T
  onValueChange: (value: T) => void
}) {
  return (
    <ChipGroup
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      className={cn("inline-flex h-10 w-fit max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-full bg-secondary p-1", className)}
      {...props}
    >
      {options.map((o) => (
        <ChipRadio
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "h-full flex-1 border-0 bg-transparent px-3.5 text-muted-foreground hover:bg-transparent hover:text-foreground active:scale-100",
            "aria-checked:bg-card aria-checked:text-foreground aria-checked:shadow-soft"
          )}
        >
          {o.icon}
          {o.label}
        </ChipRadio>
      ))}
    </ChipGroup>
  )
}
