"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type ListRowProps = Omit<React.ComponentProps<"div">, "title" | "onClick"> & {
  /** 왼쪽 아이콘 (lucide 요소) */
  icon?: React.ReactNode
  /** 굵은 제목 (한 줄, 넘치면 …) */
  title: React.ReactNode
  /** 흐린 설명 한 줄 (넘치면 …) */
  description?: React.ReactNode
  /** 오른쪽 행동 (버튼·메뉴 등). 행 클릭과 따로 동작한다 */
  action?: React.ReactNode
  /** 행 전체(아이콘·제목·설명)를 누르는 동작. 버튼이 되어 키보드로도 누를 수 있다 (children 이 있으면 무시, 펼침이 우선) */
  onSelect?: () => void
  /** 펼침 내용. 주면 행이 펼침 버튼이 되고 aria-expanded 로 그 자리에서 펼쳐진다 */
  children?: React.ReactNode
  /** 펼침 상태 (제어). 안 주면 내부 상태 */
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** 현재 선택된 행 표시 (aria-current) */
  current?: boolean
}

/**
 * 목록 행: [아이콘] 굵은 제목 / 흐린 설명 한 줄 ……… [오른쪽 행동]
 * 반경 14, 카드색, 얇은 테두리. children 을 주면 행을 눌러 그 자리에서 펼친다.
 *
 *   <ListRow icon={<QrCode />} title={name} description={`${count}개 스캔`}
 *            onSelect={() => router.push(...)} action={<Button size="icon-sm" variant="ghost" aria-label="삭제"><Trash2 /></Button>} />
 */
export function ListRow({
  icon,
  title,
  description,
  action,
  onSelect,
  children,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  current,
  className,
  ...props
}: ListRowProps) {
  const [inner, setInner] = React.useState(defaultExpanded)
  const open = expanded ?? inner
  const panelId = React.useId()
  const expandable = children !== undefined && children !== null && children !== false

  const toggle = () => {
    const next = !open
    if (expanded === undefined) setInner(next)
    onExpandedChange?.(next)
  }

  const body = (
    <>
      {icon ? (
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground [&_svg]:size-[18px]"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-15 font-bold text-foreground">{title}</span>
        {description ? (
          <span className="block truncate text-13 text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {expandable ? (
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  const mainClass =
    "flex min-w-0 flex-1 items-center gap-3 rounded-field px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

  return (
    <div
      data-slot="list-row"
      data-current={current || undefined}
      className={cn(
        "min-w-0 rounded-field border bg-card transition-[border-color,box-shadow] data-[current]:border-primary",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1 pr-2">
        {expandable ? (
          <button
            type="button"
            className={cn(mainClass, "hover:bg-muted")}
            aria-expanded={open}
            aria-controls={panelId}
            aria-current={current || undefined}
            onClick={toggle}
          >
            {body}
          </button>
        ) : onSelect ? (
          <button
            type="button"
            className={cn(mainClass, "hover:bg-muted")}
            aria-current={current || undefined}
            onClick={onSelect}
          >
            {body}
          </button>
        ) : (
          <div className={mainClass}>{body}</div>
        )}
        {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
      </div>
      {expandable ? (
        <div id={panelId} hidden={!open} className="border-t px-4 py-4">
          {children}
        </div>
      ) : null}
    </div>
  )
}

/** 목록을 불러오는 동안 ListRow 모양 자리 표시 */
export function ListRowSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-field border bg-card px-4 py-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-4 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-3/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
