import Image from "next/image"

import type { Screenshot } from "@/content/features/types"
import { FEATURE_SHOTS } from "@/content/features/shots.generated"

// 스크린샷 파일 찾기: 그 언어 → 영어 → 한국어 순. 없으면 null (그림 자리를 비운다)
// 목록은 빌드 전에 만든 FEATURE_SHOTS (서버리스에서 public 폴더를 읽을 수 없어서)
export function resolveScreenshot(locale: string, file: string): string | null {
  for (const l of [locale, "en", "ko"]) {
    if (FEATURE_SHOTS.has(`${l}/${file}`)) return `/features/${l}/${file}`
  }
  return null
}

/** 앱 화면: 기기 틀 안의 실제 스크린샷 (1080×2400) */
export function PhoneShot({ shot, locale, priority }: { shot: Screenshot; locale: string; priority?: boolean }) {
  const src = resolveScreenshot(locale, shot.file)
  if (!src) return null
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <div className="rounded-card border bg-card p-2 shadow-[var(--shadow-soft)]">
        <Image
          src={src}
          alt={shot.alt}
          width={1080}
          height={2400}
          sizes="(max-width: 640px) 80vw, 300px"
          priority={priority}
          className="h-auto w-full rounded-field"
        />
      </div>
    </figure>
  )
}

/** 웹 화면: 주소창이 있는 창 틀 안의 스크린샷 */
export function BrowserShot({ shot, locale, priority }: { shot: Screenshot; locale: string; priority?: boolean }) {
  const src = resolveScreenshot(locale, shot.file)
  if (!src) return null
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-card border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex h-9 items-center gap-1.5 border-b px-4" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="ml-3 truncate font-mono text-13 text-muted-foreground">scanview.app</span>
        </div>
        <Image src={src} alt={shot.alt} width={1280} height={800} sizes="(max-width: 1024px) 100vw, 720px" priority={priority} className="h-auto w-full" />
      </div>
    </figure>
  )
}

export function Shot({ shot, locale, priority }: { shot: Screenshot; locale: string; priority?: boolean }) {
  return shot.frame === "browser" ? (
    <BrowserShot shot={shot} locale={locale} priority={priority} />
  ) : (
    <PhoneShot shot={shot} locale={locale} priority={priority} />
  )
}
