"use client"

import * as React from "react"

/**
 * 첫 화면 줌 영상: 창고 → 폰 화면 시점 스캔 → 바로 앞 PC, 지구 건너 LA PC → 다시 창고 (38초 반복).
 * scripts/zoom-film 에서 코드로 렌더한 영상. 소리 없음, 화면에 보일 때만 재생, '움직임 줄이기'면 정지 이미지.
 * portrait: 4:5 카드 (좁은 화면) / wide: 16:9, 피사체가 오른쪽이라 부모를 꽉 채우는 배경용 (넓은 화면)
 */
export function ZoomFilm({
  lang,
  label,
  variant = "portrait",
  className,
}: {
  lang: "ko" | "en"
  label: string
  variant?: "portrait" | "wide"
  className?: string
}) {
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

  const name = variant === "wide" ? `zoom-wide-${lang}` : `zoom-${lang}`
  const poster = variant === "wide" ? `/landing/zoom-wide-poster-${lang}.webp` : `/landing/zoom-poster-${lang}.webp`

  if (variant === "wide") {
    return (
      <div className={className}>
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={label} width={1280} height={720} className="h-full w-full object-cover object-[66%_50%]" />
        ) : (
          <video
            ref={ref}
            className="h-full w-full object-cover object-[66%_50%]"
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
          >
            <source src={`/landing/${name}.webm`} type="video/webm" />
            <source src={`/landing/${name}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
    )
  }

  return (
    <figure className={className ?? "mx-auto w-full max-w-[460px]"}>
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
            <source src={`/landing/${name}.webm`} type="video/webm" />
            <source src={`/landing/${name}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
    </figure>
  )
}
