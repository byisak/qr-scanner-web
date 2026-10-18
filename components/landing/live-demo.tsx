"use client"

import * as React from "react"
import { Check, Plug } from "lucide-react"

/**
 * 첫 화면 데모: 폰으로 찍으면 PC 브라우저 표에 한 줄씩 들어오는 장면을 되풀이한다.
 * 실제 서비스 화면(세션 화면)을 단순하게 옮긴 그림. 시간은 고정된 가상 시계라 서버·브라우저 결과가 같다.
 * 화면 밖이거나 탭이 숨겨지면 멈추고, '움직임 줄이기'면 처음 장면에서 멈춘다.
 */
export interface LiveDemoLabels {
  sessionName: string
  connected: string
  justScanned: string
  now: string
  todayCount: string // "{count}"
  distinctCodes: string // "{count}"
  code: string
  time: string
  saved: string
}

const CODES = [
  "8801234001014",
  "8801234002028",
  "BOX-A0312-07",
  "8801234003032",
  "8801234001014",
  "8801234004046",
  "8801234005050",
  "8801234002028",
  "8801234006064",
]

const START_SECONDS = 9 * 3600 + 41 * 60 + 2 // 09:41:02
const STEP_SECONDS = 3
const MAX_ROWS = 5
const INTERVAL_MS = 1900

function clock(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

// 코드 글자로 막대 너비를 정해 바코드처럼 그린다 (같은 코드 = 같은 모양)
function bars(code: string) {
  const out: number[] = []
  for (const ch of code) {
    const c = ch.charCodeAt(0)
    out.push(1 + (c % 3), 1 + ((c >> 2) % 2))
  }
  return out.slice(0, 26)
}

function fill(template: string, count: number) {
  return template.replace("{count}", String(count))
}

export function LiveDemo({ labels }: { labels: LiveDemoLabels }) {
  // step = 지금까지 들어온 스캔 수 (처음 3건은 미리 들어와 있음)
  const [step, setStep] = React.useState(3)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let visible = false
    let timer: number | undefined
    const tick = () => setStep((s) => s + 1)
    const sync = () => {
      const run = visible && document.visibilityState === "visible"
      if (run && timer === undefined) timer = window.setInterval(tick, INTERVAL_MS)
      if (!run && timer !== undefined) {
        window.clearInterval(timer)
        timer = undefined
      }
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      sync()
    })
    if (rootRef.current) io.observe(rootRef.current)
    document.addEventListener("visibilitychange", sync)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", sync)
      if (timer !== undefined) window.clearInterval(timer)
    }
  }, [])

  const scans = Array.from({ length: step }, (_, i) => ({
    n: i + 1,
    code: CODES[i % CODES.length],
    time: clock(START_SECONDS + i * STEP_SECONDS),
  }))
  const latest = scans[scans.length - 1]
  const rows = scans.slice(-MAX_ROWS).reverse()
  const distinct = new Set(scans.map((s) => s.code)).size
  const today = 124 + step

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[560px] pb-10 sm:pb-12" aria-hidden="true">
      {/* PC 브라우저 (폰이 왼쪽 아래에 겹치도록 오른쪽으로 비켜 둔다) */}
      <div className="ml-14 overflow-hidden rounded-card border bg-card shadow-[var(--shadow-soft)] sm:ml-24">
        <div className="flex h-9 items-center gap-1.5 border-b px-4">
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="ml-3 truncate font-mono text-13 text-muted-foreground">scanview.app/session/A3F9K2</span>
        </div>
        <div className="grid gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-bold">{labels.sessionName}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-13 font-semibold">
              <Plug className="size-3.5" />
              {labels.connected}
            </span>
          </div>
          <div className="rounded-field bg-secondary px-4 py-3">
            <p className="text-13 font-semibold text-muted-foreground">
              {labels.justScanned} · {labels.now}
            </p>
            <p key={latest.n} className="demo-toast-in mt-0.5 break-all font-mono text-[26px] font-bold leading-tight sm:text-[30px]">
              {latest.code}
            </p>
            <p className="mt-1 flex gap-3 text-13 text-muted-foreground tabular">
              <span>{fill(labels.todayCount, today)}</span>
              <span>{fill(labels.distinctCodes, distinct)}</span>
            </p>
          </div>
          <div className="overflow-hidden rounded-field border">
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-2 bg-muted px-3 py-2 text-13 font-semibold text-muted-foreground">
              <span>#</span>
              <span>{labels.code}</span>
              <span>{labels.time}</span>
            </div>
            <ul>
              {rows.map((r, i) => (
                <li
                  key={r.n}
                  className={`grid grid-cols-[2.5rem_1fr_auto] gap-2 border-t px-3 py-2 text-13 ${i === 0 ? "demo-row-in scan-new" : ""}`}
                >
                  <span className="tabular text-muted-foreground">{r.n}</span>
                  <span className="truncate font-mono">{r.code}</span>
                  <span className="tabular text-muted-foreground">{r.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 폰: 조준 틀 안의 바코드 + 스캔 선 + 결과. 카메라 화면이라 테마와 관계없이 어둡게 고정 */}
      <div className="absolute bottom-0 left-0 w-[112px] rounded-card border bg-card p-1.5 shadow-[var(--shadow-soft)] sm:w-[140px]">
        <div className="relative flex aspect-[9/17] flex-col items-center justify-center overflow-hidden rounded-field bg-[#111113]">
          <div className="relative flex h-[80px] w-[88px] items-center justify-center sm:h-[88px] sm:w-[108px]">
            {/* 조준 모서리 */}
            <span className="absolute left-0 top-0 size-4 rounded-tl-md border-l-2 border-t-2 border-white" />
            <span className="absolute right-0 top-0 size-4 rounded-tr-md border-r-2 border-t-2 border-white" />
            <span className="absolute bottom-0 left-0 size-4 rounded-bl-md border-b-2 border-l-2 border-white" />
            <span className="absolute bottom-0 right-0 size-4 rounded-br-md border-b-2 border-r-2 border-white" />
            {/* 바코드 라벨 */}
            <div key={latest.n} className="demo-toast-in flex h-[46px] items-end gap-[1.5px] overflow-hidden rounded-sm bg-white px-1.5 pb-1.5 pt-2 sm:h-[52px]">
              {bars(latest.code).map((w, i) => (
                <span key={i} className={i % 2 === 0 ? "h-full bg-[#111113]" : "h-full"} style={{ width: w }} />
              ))}
            </div>
            <span className="scan-sweep absolute inset-x-1 top-1/2 h-0.5 rounded-full bg-white/80" />
          </div>
          <div key={`t${latest.n}`} className="demo-toast-in absolute inset-x-2 bottom-3 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#111113]">
            <Check className="size-3 shrink-0" />
            <span className="truncate font-mono">{latest.code}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
