"use client"

import * as React from "react"

/**
 * 첫 화면 줌 영상: 창고 → 라벨 → 바코드 막대 하나 → 스캔 → PC 세션 표의 새 줄 → 다시 창고 (22초 반복).
 * scripts/zoom-film 에서 코드로 렌더한 영상. 소리 없음, 화면에 보일 때만 재생, '움직임 줄이기'면 정지 이미지.
 */
export function ZoomFilm({ lang, label }: { lang: "ko" | "en"; label: string }) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    const v = ref.current
    if (!v || reduced) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting)
        if (visible) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.2 }
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduced])

  const poster = `/landing/zoom-poster-${lang}.webp`
  return (
    <figure className="mx-auto w-full max-w-[460px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border bg-card shadow-[var(--shadow-soft)]">
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={label} width={720} height={900} className="h-full w-full object-cover" />
        ) : (
          <video
            ref={ref}
            className="h-full w-full object-cover"
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
          >
            <source src={`/landing/zoom-${lang}.webm`} type="video/webm" />
            <source src={`/landing/zoom-${lang}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
    </figure>
  )
}
