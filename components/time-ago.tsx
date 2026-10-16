"use client"

import { useSyncExternalStore } from "react"
import { useLocale } from "next-intl"
import { timeAgo } from "@/lib/format"

// 1분마다 다시 계산
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

/**
 * "3시간 전"처럼 지금 시각이 필요한 글자는 브라우저에서만 계산한다
 * (서버에서 미리 그린 화면과 어긋나 hydration 오류가 나지 않게, 서버에서는 빈칸).
 *
 *   <TimeAgo iso={session.created_at} />            → "3시간 전" / "3 hours ago"
 *   <TimeAgo iso={x} suffix=" 수정" className="text-13 text-muted-foreground" />
 */
export function TimeAgo({
  iso,
  suffix = "",
  className,
}: {
  iso: string | number | Date
  suffix?: string
  className?: string
}) {
  const locale = useLocale()
  const text = useSyncExternalStore(
    subscribe,
    () => timeAgo(iso, locale),
    () => null
  )
  const date = iso instanceof Date ? iso : new Date(iso)
  const valid = !Number.isNaN(date.getTime())
  return (
    <time
      dateTime={valid ? date.toISOString() : undefined}
      title={valid && text !== null ? date.toLocaleString(locale) : undefined}
      className={className}
    >
      {text === null ? " " : text + suffix}
    </time>
  )
}
