import Link from "next/link"
import { ChevronDown } from "lucide-react"

import type { FeaturesLocale, FeatureSlug } from "@/content/features/types"
import { FEATURE_GROUPS } from "@/content/features/types"
import { listFeatures } from "@/content/features"

/**
 * 기능 목록 (Tailwind 문서의 왼쪽 목록).
 * 넓은 화면: 묶음별 목록이 왼쪽에 고정 / 좁은 화면: 접히는 목록 (details, 자바스크립트 없음)
 */
export function FeatureNav({ data, current }: { data: FeaturesLocale; current?: FeatureSlug }) {
  const items = listFeatures(data)
  const list = (
    <div className="grid gap-6">
      {FEATURE_GROUPS.map((g) => {
        const inGroup = items.filter((i) => i.content.group === g)
        if (inGroup.length === 0) return null
        return (
          <div key={g}>
            <p className="px-3 text-13 font-bold text-muted-foreground">{data.groups[g].title}</p>
            <ul className="mt-2 grid gap-0.5">
              {inGroup.map(({ slug, content }) => (
                <li key={slug}>
                  <Link
                    href={`/features/${slug}`}
                    aria-current={slug === current ? "page" : undefined}
                    className="block rounded-field px-3 py-1.5 text-15 font-semibold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground"
                  >
                    {content.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <details className="group rounded-card border bg-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          {current ? data.features[current]?.title : data.ui.navTitle}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <nav aria-label={data.ui.navTitle} className="border-t px-1 py-4">
          <Link href="/features" className="mb-4 block px-3 text-15 font-semibold">{data.ui.allFeatures}</Link>
          {list}
        </nav>
      </details>
      <nav aria-label={data.ui.navTitle} className="sticky top-[92px] hidden max-h-[calc(100vh-112px)] overflow-y-auto pb-8 lg:block">
        <Link
          href="/features"
          aria-current={current ? undefined : "page"}
          className="mb-5 block rounded-field px-3 py-1.5 text-15 font-bold aria-[current=page]:bg-card"
        >
          {data.ui.allFeatures}
        </Link>
        {list}
      </nav>
    </>
  )
}
