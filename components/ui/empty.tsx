import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 빈 상태: 아이콘 + "아직 ○○가 없어요" + (설명) + 행동 버튼 하나.
 * 한국어 제목은 lib/format 의 emptyTitle("세션") → "아직 세션이 없어요" 로 만들 수 있다.
 *
 *   <Empty icon={<Inbox />} title={t("dashboard.empty")} description={...}
 *          action={<Button onClick={...}>세션 만들기</Button>} />
 */
export function Empty({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** lucide 아이콘 요소 (<Inbox />). 크기·색은 여기서 맞춘다 */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** 버튼 하나 */
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-tint-line px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-1 text-faint [&_svg]:size-8" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="type-h3 text-foreground">{title}</p>
      {description ? <p className="max-w-[40ch] text-15 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
