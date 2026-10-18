import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, Download, ScanLine, FolderTree, Briefcase, QrCode, Lock, MonitorSmartphone, CircleAlert, Truck, Warehouse, Store, Factory } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { Shot, resolveScreenshot } from '@/components/features/frames'
import { Reveal } from '@/components/landing/reveal'
import { getFeaturesLocale, listFeatures } from '@/content/features'
import { FEATURE_GROUPS, type FeatureGroup } from '@/content/features/types'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/store-links'

const GROUP_ICONS: Record<FeatureGroup, typeof ScanLine> = {
  scan: ScanLine,
  organize: FolderTree,
  work: Briefcase,
  create: QrCode,
  secure: Lock,
  web: MonitorSmartphone,
}

const USE_CASES = [
  { key: 'logistics', icon: Truck },
  { key: 'warehouse', icon: Warehouse },
  { key: 'retail', icon: Store },
  { key: 'manufacturing', icon: Factory },
] as const

export async function generateMetadata(): Promise<Metadata> {
  const { data, locale } = getFeaturesLocale(await getLocale())
  const image = `https://scanview.app/api/og/features?lang=${locale}`
  return {
    title: data.meta.title,
    description: data.meta.description,
    alternates: { canonical: 'https://scanview.app/features' },
    openGraph: { title: data.meta.title, description: data.meta.description, url: 'https://scanview.app/features', type: 'website', images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: data.meta.title, description: data.meta.description, images: [image] },
  }
}

export default async function FeaturesPage() {
  const locale = await getLocale()
  const t = await getTranslations()
  const { data, isFallback } = getFeaturesLocale(locale)
  const items = listFeatures(data)
  const highlights = items.filter((i) => i.content.highlight)

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'QR Scanner Pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android',
    url: 'https://scanview.app/features',
    description: data.meta.description,
    featureList: items.map((i) => i.content.title),
    installUrl: [APP_STORE_URL, PLAY_STORE_URL],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader active="features" />
      <main id="main">
        {/* 첫 화면 */}
        <section className="page pb-12 pt-14 sm:pb-16 sm:pt-20">
          {isFallback && (
            <p role="note" className="mb-8 flex max-w-3xl items-start gap-2 rounded-field bg-secondary p-3 text-13 text-muted-foreground">
              <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
              {data.ui.fallbackNotice}
            </p>
          )}
          <div className="max-w-3xl">
            <h1 className="enter type-display" style={{ '--i': 0 } as React.CSSProperties}>{data.ui.heroTitle}</h1>
            <p className="enter mt-5 max-w-2xl type-lead" style={{ '--i': 1 } as React.CSSProperties}>{data.ui.heroLead}</p>
            <div className="enter mt-8 flex flex-col gap-3 sm:flex-row" style={{ '--i': 2 } as React.CSSProperties}>
              <Button asChild size="xl">
                <a href={APP_STORE_URL}><Download aria-hidden="true" />{data.ui.appStore}</a>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a href={PLAY_STORE_URL}><Download aria-hidden="true" />{data.ui.googlePlay}</a>
              </Button>
            </div>
          </div>
        </section>

        {/* 기능 지도: 묶음별 카드 */}
        <section aria-labelledby="groups-title" className="page py-12">
          <h2 id="groups-title" className="type-h1">{data.ui.groupsTitle}</h2>
          <Reveal stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_GROUPS.map((g, gi) => {
              const inGroup = items.filter((i) => i.content.group === g)
              if (inGroup.length === 0) return null
              const Icon = GROUP_ICONS[g]
              return (
                <div key={g} className="lift min-w-0 rounded-card border bg-card p-6" style={{ '--i': gi } as React.CSSProperties}>
                  <span className="flex size-10 items-center justify-center rounded-code bg-secondary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 type-h3">{data.groups[g].title}</h3>
                  <p className="mt-1 type-body text-muted-foreground">{data.groups[g].description}</p>
                  <ul className="mt-4 grid gap-1">
                    {inGroup.map(({ slug, content }) => (
                      <li key={slug}>
                        <Link href={`/features/${slug}`} className="group flex items-center justify-between gap-2 rounded-field px-2 py-1.5 -mx-2 text-15 font-semibold hover:bg-secondary">
                          <span className="min-w-0 truncate">{content.title}</span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </Reveal>
        </section>

        {/* 대표 기능: 설명 + 실제 화면 */}
        {highlights.length > 0 && (
          <section aria-labelledby="highlights-title" className="border-y bg-card py-16">
            <div className="page">
              <h2 id="highlights-title" className="type-h1">{data.ui.highlightsTitle}</h2>
              <div className="mt-10 grid gap-16">
                {highlights.map(({ slug, content }, i) => {
                  // 스크린샷이 아직 없으면 글만 한 단으로
                  const shot = content.screenshots[0] && resolveScreenshot(locale, content.screenshots[0].file) ? content.screenshots[0] : null
                  return (
                  <Reveal key={slug} className={shot ? 'grid items-center gap-8 lg:grid-cols-2 lg:gap-16' : 'max-w-2xl'}>
                    <div className={i % 2 === 1 ? 'lg:order-2' : undefined}>
                      <p className="text-13 font-bold text-muted-foreground">{data.groups[content.group].title}</p>
                      <h3 className="mt-2 type-h2">{content.title}</h3>
                      <p className="mt-3 type-lead">{content.lead}</p>
                      <ol className="mt-6 grid gap-2">
                        {content.steps.slice(0, 3).map((s, n) => (
                          <li key={n} className="flex gap-3 type-body">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-13 font-bold tabular" aria-hidden="true">{n + 1}</span>
                            <span>{s.title}</span>
                          </li>
                        ))}
                      </ol>
                      <Button asChild variant="outline" className="mt-6">
                        <Link href={`/features/${slug}`}>{data.ui.learnMore}<ArrowRight aria-hidden="true" /></Link>
                      </Button>
                    </div>
                    {shot && (
                      <div className={i % 2 === 1 ? 'lg:order-1' : undefined}>
                        <Shot shot={shot} locale={locale} />
                      </div>
                    )}
                  </Reveal>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* 업종별 쓰임 (홈 문구 재사용) */}
        <section aria-labelledby="usecases-title" className="page py-16">
          <h2 id="usecases-title" className="type-h1">{data.ui.useCasesTitle}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(({ key, icon: Icon }) => (
              <li key={key} className="min-w-0 rounded-card border bg-card p-6">
                <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-3 type-h3">{t(`useCases.${key}.title`)}</h3>
                <p className="mt-1.5 type-body text-muted-foreground">{t(`useCases.${key}.description`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {data.faq.length > 0 && (
          <section aria-labelledby="ffaq-title" className="page py-12">
            <h2 id="ffaq-title" className="type-h1">{data.ui.faqTitle}</h2>
            <dl className="mt-8 max-w-3xl divide-y rounded-card border bg-card">
              {data.faq.map((q) => (
                <div key={q.q} className="p-6">
                  <dt className="type-h3">{q.q}</dt>
                  <dd className="mt-2 type-body text-muted-foreground">{q.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="page pb-8 pt-4">
          <div className="rounded-card border bg-card px-6 py-12 text-center sm:px-12">
            <h2 className="type-h1">{data.ui.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl type-lead">{data.ui.ctaLead}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl"><a href={APP_STORE_URL}>{data.ui.appStore}</a></Button>
              <Button asChild size="xl" variant="outline"><a href={PLAY_STORE_URL}>{data.ui.googlePlay}</a></Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
