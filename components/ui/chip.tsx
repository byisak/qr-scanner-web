"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * 칩: 테두리만 있는 pill, 높이 36. 선택되면 먹색 테두리 + secondary 배경.
 * - 여러 개 고르기: <Chip selected={on} onClick={...}> → aria-pressed
 * - 하나만 고르기:  <ChipGroup aria-label="정렬" value={v} onValueChange={setV}>
 *                    <ChipRadio value="recent">최근</ChipRadio> …
 *                  </ChipGroup>                         → role=radiogroup / radio + 화살표 키 이동
 */
export const chipClass = (selected: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 text-15 font-semibold text-foreground transition-[color,background-color,border-color,box-shadow,transform] outline-none hover:bg-secondary active:scale-[.97] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    selected && "border-primary bg-secondary"
  )

type ChipProps = Omit<React.ComponentProps<"button">, "aria-pressed"> & {
  /** 선택(눌림) 상태 */
  selected?: boolean
}

/** 여러 개를 켜고 끄는 칩 (aria-pressed) */
export function Chip({ selected = false, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      data-slot="chip"
      aria-pressed={selected}
      data-selected={selected || undefined}
      className={cn(chipClass(selected), className)}
      {...props}
    />
  )
}

type GroupCtx = {
  value: string | undefined
  select: (v: string) => void
  disabled?: boolean
}
const ChipGroupContext = React.createContext<GroupCtx | null>(null)

type ChipGroupProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

/** 하나만 고르는 칩 묶음 (role=radiogroup). aria-label 또는 aria-labelledby 를 꼭 준다 */
export function ChipGroup({ value, defaultValue, onValueChange, disabled, className, children, ...props }: ChipGroupProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const current = value !== undefined ? value : inner

  const select = React.useCallback(
    (v: string) => {
      if (value === undefined) setInner(v)
      onValueChange?.(v)
    },
    [value, onValueChange]
  )

  return (
    <ChipGroupContext.Provider value={{ value: current, select, disabled }}>
      <div role="radiogroup" data-slot="chip-group" className={cn("flex flex-wrap gap-2", className)} {...props}>
        {children}
      </div>
    </ChipGroupContext.Provider>
  )
}

type ChipRadioProps = Omit<React.ComponentProps<"button">, "value" | "role" | "aria-checked"> & {
  value: string
}

/** ChipGroup 안의 칩 하나 (role=radio, aria-checked). 화살표 키로 옆 칩 선택 */
export function ChipRadio({ value, className, disabled, onKeyDown, onClick, ...props }: ChipRadioProps) {
  const ctx = React.useContext(ChipGroupContext)
  if (!ctx) throw new Error("ChipRadio must be used inside ChipGroup")
  const checked = ctx.value === value
  // 선택된 칩만 Tab 으로 들어가고(아무것도 안 골랐으면 모두), 나머지는 화살표로 이동
  const tabbable = checked || ctx.value === undefined

  const move = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const group = e.currentTarget.closest('[role="radiogroup"]')
    const radios = group
      ? Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'))
      : []
    const i = radios.indexOf(e.currentTarget)
    if (i < 0 || radios.length === 0) return
    let next = i
    if (e.key === "Home") next = 0
    else if (e.key === "End") next = radios.length - 1
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % radios.length
    else next = (i - 1 + radios.length) % radios.length
    radios[next].focus()
    radios[next].click()
  }

  return (
    <button
      type="button"
      role="radio"
      data-slot="chip"
      aria-checked={checked}
      data-selected={checked || undefined}
      tabIndex={tabbable ? 0 : -1}
      disabled={disabled ?? ctx.disabled}
      className={cn(chipClass(checked), className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.select(value)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (!e.defaultPrevented) move(e)
      }}
      {...props}
    />
  )
}
