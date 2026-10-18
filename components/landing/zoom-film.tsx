"use client"

import * as React from "react"

/**
 * 첫 화면 영상 (35초 반복, Anatomy 화풍: 종이색 면·4단 음영·윤곽선): 창고 → 폰 화면 시점 스캔(해독 + 연속) → 바로 앞 PC,
 * 지구 건너 LA PC(엑셀 내보내기) → 다시 창고.
 * scripts/zoom-film (?style=anatomy) 로 렌더한 영상. 소리 없음, 화면에 보일 때만 재생, '움직임 줄이기'면 정지 이미지.
 * portrait: 4:5 카드 (좁은 화면) / wide: 16:9, 피사체가 오른쪽이라 부모를 꽉 채우는 배경용 (넓은 화면)
 * mp4(H.264)만 쓴다: 1080p VP9 webm 은 PC 크롬에서 디코딩 오류가 나는 일이 있었다. 사이트가 다크 테마면 먹색 바탕 판(-dark)을 쓴다. 라벨이 읽히는 순간 'zoomfilm:scan' 이벤트로 바코드 종류를 알린다.
 */

// 영상 속 라벨이 읽히는 시각(초)과 바코드 종류 — scripts/zoom-film 의 SCANS.at 을 영상 시각으로 옮긴 값
const SCAN_MARKS: [number, string][] = [[8.6, "EAN-13"], [11.4, "QR Code"], [14.1, "Code 128"]]

function useDarkTheme() {
  const [dark, setDark] = React.useState(false)
  React.useEffect(() => {
    const el = document.documentElement
    const sync = () => setDark(el.classList.contains("dark"))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])
  return dark
}

/** 바코드 종류 띠: 영상에서 그 종류가 읽히는 순간 잠깐 금색으로 */
export function MarqueeScanSync() {
  React.useEffect(() => {
    const timers = new Map<string, number>()
    const on = (e: Event) => {
      const name = (e as CustomEvent<string>).detail
      document.querySelectorAll<HTMLElement>(`[data-barcode="${name}"]`).forEach((el) => el.setAttribute("data-hit", ""))
      window.clearTimeout(timers.get(name))
      timers.set(name, window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>(`[data-barcode="${name}"]`).forEach((el) => el.removeAttribute("data-hit"))
      }, 1600))
    }
    window.addEventListener("zoomfilm:scan", on)
    return () => window.removeEventListener("zoomfilm:scan", on)
  }, [])
  return null
}
export function ZoomFilm({
  lang,
  label,
  variant = "portrait",
  className,
  bleed = false,
}: {
  lang: "ko" | "en"
  label: string
  variant?: "portrait" | "wide"
  className?: string
  /** portrait 를 화면 폭 전체로 (둥근 모서리·테두리 없이) */
  bleed?: boolean
}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [reduced, setReduced] = React.useState(false)
  const dark = useDarkTheme()

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
    // 라벨이 읽히는 순간을 알린다 (지난 시각 → 지금 시각 사이에 표시가 있으면)
    let last = 0
    const tick = () => {
      const now = v.currentTime
      for (const [at, type] of SCAN_MARKS) {
        if ((last < at && at <= now) || (now < last && (at > last || at <= now))) window.dispatchEvent(new CustomEvent("zoomfilm:scan", { detail: type }))
      }
      last = now
    }
    v.addEventListener("timeupdate", tick)
    return () => { io.disconnect(); v.removeEventListener("timeupdate", tick) }
  }, [reduced, dark])

  const suffix = dark ? "-dark" : ""
  const name = (variant === "wide" ? `zoom-wide-${lang}` : `zoom-${lang}`) + suffix
  const poster = (variant === "wide" ? `/landing/zoom-wide-poster-${lang}` : `/landing/zoom-poster-${lang}`) + suffix + ".webp"

  if (variant === "wide") {
    return (
      <div className={className}>
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={label} width={1280} height={720} className="h-full w-full object-cover object-[66%_50%]" />
        ) : (
          <video
            key={name}
            ref={ref}
            className="h-full w-full object-cover object-[66%_50%]"
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
          >
            <source src={`/landing/${name}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
    )
  }

  return (
    <figure className={className ?? (bleed ? "w-full" : "mx-auto w-full max-w-[460px]")}>
      <div className={bleed ? "relative aspect-[4/5] max-h-[80svh] w-full overflow-hidden bg-background" : "relative aspect-[4/5] overflow-hidden rounded-card border bg-card shadow-[var(--shadow-soft)]"}>
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={label} width={720} height={900} className="h-full w-full object-cover" />
        ) : (
          <video
            key={name}
            ref={ref}
            className="h-full w-full object-cover"
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
          >
            <source src={`/landing/${name}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
    </figure>
  )
}
