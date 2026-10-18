import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  QrCode,
  Zap,
  Database,
  Globe,
  Smartphone,
  Download,
  CheckCircle,
  Truck,
  Warehouse,
  Store,
  Factory,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/store-links'
import { ZoomFilm, MarqueeScanSync } from '@/components/landing/zoom-film'
import { Reveal } from '@/components/landing/reveal'

// SEO 메타데이터 - 매우 중요!
export const metadata: Metadata = {
  title: 'QR Scanner Pro - QR코드 바코드 스캐너 앱 | 재고관리 대량스캔',
  description: '무료 QR코드 바코드 스캐너 앱. 재고관리, 물류, 창고 업무에 최적화. 대량 스캔, 실시간 PC 전송, CSV/엑셀 내보내기 지원. iOS Android 무료 다운로드.',
  keywords: 'QR코드, 바코드, 스캐너, 재고관리, 대량스캔, 물류, 창고, 무료, 앱, QR Scanner, barcode, inventory',
  openGraph: {
    title: 'QR Scanner Pro - 전문가용 QR/바코드 스캐너',
    description: '수천 개의 바코드를 연속으로 스캔하고 바로 PC로 보내요.',
    url: 'https://scanview.app',
    siteName: 'QR Scanner Pro',
    images: [
      {
        url: 'https://scanview.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QR Scanner Pro 앱 스크린샷',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Scanner Pro - 전문가용 QR/바코드 스캐너',
    description: '수천 개의 바코드를 연속으로 스캔하고 바로 PC로 보내요.',
    images: ['https://scanview.app/og-image.png'],
  },
  alternates: {
    canonical: 'https://scanview.app',
    languages: {
      'ko-KR': 'https://scanview.app',
      'en-US': 'https://scanview.app/en',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}


// href: 기능 소개 상세 페이지 (없으면 링크 없이 카드만)
const FEATURES = [
  { key: 'bulkScan', icon: Zap, href: '/features/continuous-scan' },
  { key: 'realtime', icon: Globe, href: '/features/live-pc-sync' },
  { key: 'export', icon: Database, href: '/features/export' },
  { key: 'offline', icon: Smartphone, href: '/features/history' },
  { key: 'allBarcodes', icon: QrCode, href: '/features/scan-area' },
  { key: 'validation', icon: CheckCircle, href: null },
] as const

// 스캔으로 인식하는 바코드 13종 (앱 설정 > 바코드 종류와 같음)
const BARCODE_TYPES = ['QR Code', 'EAN-13', 'EAN-8', 'Code 128', 'Code 39', 'Code 93', 'UPC-A', 'UPC-E', 'ITF-14', 'Codabar', 'PDF417', 'Data Matrix', 'Aztec']

const USE_CASES = [
  { key: 'logistics', icon: Truck },
  { key: 'warehouse', icon: Warehouse },
  { key: 'retail', icon: Store },
  { key: 'manufacturing', icon: Factory },
] as const

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const

// 기능 벤토: big 2×2 (영상 장면), wide 2×1, small 1×1. href 는 FEATURES 와 같다
type BentoImg = 'decode' | 'globe' | 'excel'
const BENTO: { key: (typeof FEATURES)[number]['key']; href: string | null; size: 'big' | 'wide' | 'small'; img?: BentoImg; dark?: boolean }[] = [
  { key: 'bulkScan', href: '/features/continuous-scan', size: 'big', img: 'decode' },
  { key: 'realtime', href: '/features/live-pc-sync', size: 'wide', img: 'globe' },
  { key: 'allBarcodes', href: '/features/scan-area', size: 'small' },
  { key: 'offline', href: '/features/history', size: 'small' },
  { key: 'export', href: '/features/export', size: 'wide', img: 'excel' },
  { key: 'validation', href: null, size: 'wide', dark: true },
]
const BENTO_ALT: Record<BentoImg, string> = { decode: 'landing.bentoBulkAlt', globe: 'landing.bentoRealtimeAlt', excel: 'landing.bentoExportAlt' }

/** 도면의 모서리 맞춤 표시 (칸 네 귀퉁이) */
function Ticks() {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <span key={c} aria-hidden="true" className="bp-tick" data-c={c} />)}
    </>
  )
}

export default async function HomePage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const lang = locale === 'ko' ? 'ko' : 'en'

  // JSON-LD 구조화 데이터 (확인되지 않은 평점·리뷰 수는 넣지 않는다)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'QR Scanner Pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: t('footer.description'),
    screenshot: 'https://scanview.app/screenshot.png',
    featureList: FEATURES.map((f) => t(`features.${f.key}.title`)).join(', '),
    downloadUrl: APP_STORE_URL,
    author: {
      '@type': 'Organization',
      name: 'ScanView',
      url: 'https://scanview.app',
    },
  }

  // FAQ 구조화 데이터 (화면의 질문·답과 같은 글)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map((q) => ({
      '@type': 'Question',
      name: t(`faq.${q}.question`),
      acceptedAnswer: { '@type': 'Answer', text: t(`faq.${q}.answer`) },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <SiteHeader active="home" />

      <main id="main" className="blueprint min-h-screen">
        {/* 첫 화면: 넓은 화면은 화면 폭 전체에 가로 영상(피사체는 오른쪽), 왼쪽 빈 자리에 문구.
            좁은 화면은 문구 아래에 세로 영상 (역시 양쪽 여백 없이) */}
        <section className="pb-12 sm:pb-16">
          <div className="relative overflow-hidden border-b bg-background lg:min-h-[min(56.25vw,calc(100svh-68px))]">
            <ZoomFilm
              variant="wide"
              lang={locale === 'ko' ? 'ko' : 'en'}
              label={t('landing.demoAlt')}
              className="absolute inset-0 hidden lg:block"
            />
            {/* 문구가 영상 위에서도 읽히도록 왼쪽만 바탕색으로 덮는다 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,var(--background)_0,var(--background)_calc(50%-200px),color-mix(in_oklab,var(--background)_80%,transparent)_calc(50%+60px),transparent_calc(50%+260px))] lg:block"
            />
            <div className="page relative flex flex-col justify-center py-10 sm:py-14 lg:min-h-[min(56.25vw,calc(100svh-68px))]">
              <div className="lg:max-w-[620px]">
              <p className="enter bp-label mb-5 flex items-center gap-2.5" style={{ '--i': 0 } as React.CSSProperties}>
                <span aria-hidden="true" className="inline-block size-2 bg-[#f2b230]" />
                FIG.01 · {t('landing.eyebrow')}
              </p>
              <h1 className="enter type-display" style={{ '--i': 0 } as React.CSSProperties}>
                {t('home.heroTitle1')}
                <br />
                <span className="text-muted-foreground">{t('home.heroTitle2')}</span>
              </h1>
              <p className="enter mt-5 max-w-xl type-lead" style={{ '--i': 1 } as React.CSSProperties}>
                {t('home.heroDescription')}
              </p>
              <div className="enter mt-8 flex flex-col gap-3 sm:flex-row" style={{ '--i': 2 } as React.CSSProperties}>
                <Button asChild size="xl">
                  <a href={APP_STORE_URL}>
                    <Download aria-hidden="true" />
                    {t('home.downloadAppStore')}
                  </a>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <a href={PLAY_STORE_URL}>
                    <Download aria-hidden="true" />
                    {t('home.downloadGooglePlay')}
                  </a>
                </Button>
              </div>
              <p className="enter bp-label mt-6" style={{ '--i': 3 } as React.CSSProperties}>{t('landing.meta')}</p>
              </div>
            </div>
            <div className="enter lg:hidden" style={{ '--i': 3 } as React.CSSProperties}>
              <ZoomFilm lang={locale === 'ko' ? 'ko' : 'en'} label={t('landing.demoAlt')} bleed />
            </div>
          </div>
        </section>

        {/* 인식하는 바코드 13종이 흘러가는 띠 */}
        <section aria-labelledby="types-title" className="border-y bg-[var(--bp-paper)] py-5">
          <h2 id="types-title" className="sr-only">{t('landing.typesTitle')}</h2>
          <MarqueeScanSync />
          <div className="marquee">
            <ul className="marquee-track">
              {[...BARCODE_TYPES, ...BARCODE_TYPES].map((name, i) => (
                <li
                  key={i}
                  aria-hidden={i >= BARCODE_TYPES.length ? 'true' : undefined}
                  data-barcode={name}
                  className="shrink-0 border bg-background px-3.5 py-1.5 font-mono text-13 font-semibold text-muted-foreground"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 주요 기능: 벤토 그리드 (큰 칸에는 영상 속 장면) */}
        <section id="features" aria-labelledby="features-title" className="page scroll-mt-20 pb-8 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="bp-label">02 · {t('nav.features')}</p>
              <h2 id="features-title" className="mt-2 type-h1">{t('home.whyChoose')}</h2>
            </div>
            <Link href="/features" className="bp-label border-b border-foreground pb-0.5 text-foreground">{t('nav.allFeatures')} →</Link>
          </div>
          <Reveal as="ul" stagger className="mt-8 grid gap-4 lg:auto-rows-[230px] lg:grid-cols-4">
            {BENTO.map(({ key, href, size, img, dark }, idx) => {
              const n = String(idx + 1).padStart(2, '0')
              const text = (
                <div className="flex min-w-0 flex-col gap-2 p-6">
                  <span className="bp-label bp-gold">{n}</span>
                  <h3 className={size === 'big' ? 'type-h2' : 'type-h3'}>{t(`features.${key}.title`)}</h3>
                  <p className={dark ? 'type-body text-[#f4f4f5]/75' : 'type-body text-muted-foreground'}>{t(`features.${key}.description`)}</p>
                  {key === 'allBarcodes' ? <span className="mt-auto font-mono text-3xl font-bold" aria-hidden="true">13</span> : null}
                </div>
              )
              const pic = img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/landing/bento-${img}-${lang}.webp`} alt={t(BENTO_ALT[img])} loading="lazy" className="h-full max-h-[300px] w-full object-cover object-[66%_50%] dark:hidden lg:max-h-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/landing/bento-${img}-${lang}-dark.webp`} alt="" aria-hidden="true" loading="lazy" className="hidden h-full max-h-[300px] w-full object-cover object-[66%_50%] dark:block lg:max-h-none" />
                </>
              ) : null
              const inner =
                size === 'big' ? (
                  <div className="flex h-full flex-col"><div className="min-h-0 overflow-hidden border-b lg:h-[300px]">{pic}</div>{text}</div>
                ) : size === 'wide' && img ? (
                  <div className={`grid h-full sm:grid-cols-2 ${key === 'export' ? '' : '[&>*:first-child]:sm:order-2'}`}><div className="min-h-0 overflow-hidden border-b sm:border-b-0 sm:border-x">{pic}</div>{text}</div>
                ) : (
                  <div className="h-full">{text}</div>
                )
              const span = size === 'big' ? 'lg:col-span-2 lg:row-span-2' : size === 'wide' ? 'lg:col-span-2' : ''
              return (
                <li key={key} className={`min-w-0 ${span}`} style={{ '--i': idx } as React.CSSProperties}>
                  <div className={`bp-cell h-full overflow-visible ${dark ? 'border-[#18181b] bg-[#18181b]! text-[#f4f4f5] dark:border-[#3a3a40]' : ''} ${size === 'big' ? 'border-foreground' : ''}`}>
                    {size === 'big' ? <Ticks /> : null}
                    {href ? <Link href={href} className="block h-full overflow-hidden">{inner}</Link> : <div className="h-full overflow-hidden">{inner}</div>}
                  </div>
                </li>
              )
            })}
          </Reveal>
        </section>

        {/* 규격 띠: 사실만 */}
        <section aria-label={t('nav.features')} className="page pb-20 pt-8">
          <dl className="grid grid-cols-2 border bg-[var(--bp-paper)] lg:grid-cols-4">
            {[
              ['PLATFORM', 'iOS · Android'],
              ['SCAN', t('landing.specScan')],
              ['RECEIVE', t('landing.specReceive')],
              ['EXPORT', 'Excel · CSV'],
            ].map(([k, v], i) => (
              <div key={k} className={`flex flex-col gap-1.5 p-6 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''} ${i === 1 ? 'lg:border-r' : ''}`}>
                <dt className="bp-label">{k}</dt>
                <dd className="text-[17px] font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 활용 사례 */}
        <section id="usecases" aria-labelledby="usecases-title" className="scroll-mt-20 border-y bg-[var(--bp-paper)] py-20">
          <div className="page">
            <p className="bp-label">03 · {t('nav.useCases')}</p>
            <h2 id="usecases-title" className="mt-2 type-h1">{t('home.whoUses')}</h2>
            <Reveal as="ul" stagger className="mt-8 grid border-l border-t sm:grid-cols-2 lg:grid-cols-4">
              {USE_CASES.map(({ key, icon: Icon }, idx) => (
                <li key={key} className="flex min-w-0 flex-col gap-2.5 border-b border-r p-6" style={{ '--i': idx } as React.CSSProperties}>
                  <div className="flex items-center justify-between">
                    <span className="bp-gold font-mono text-2xl font-bold">{String(idx + 1).padStart(2, '0')}</span>
                    <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="type-h3">{t(`useCases.${key}.title`)}</h3>
                  <p className="type-body text-muted-foreground">{t(`useCases.${key}.description`)}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section id="faq" aria-labelledby="faq-title" className="page scroll-mt-20 py-20">
          <div className="max-w-3xl">
            <p className="bp-label">04 · {t('nav.faq')}</p>
            <h2 id="faq-title" className="mt-2 type-h1">{t('home.faqTitle')}</h2>
            <Reveal className="mt-8 border-t border-foreground">
              {FAQ_KEYS.map((q) => (
                <details key={q} className="bp-faq border-b py-5">
                  <summary className="flex items-start justify-between gap-4 type-h3">
                    {t(`faq.${q}.question`)}
                    <span aria-hidden="true" className="bp-faq-plus bp-gold font-mono text-xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 type-body text-muted-foreground">{t(`faq.${q}.answer`)}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 마무리 안내: 먹색 띠 */}
        <section className="border-y border-[#18181b] bg-[#18181b] text-[#f4f4f5] dark:border-[#3a3a40]">
          <div className="page flex flex-wrap items-center justify-between gap-6 py-16">
            <div>
              <p className="font-mono text-xs tracking-wider text-[#f2b230]">START</p>
              <h2 className="mt-2 type-h1">{t('home.ctaTitle')}</h2>
              <p className="mt-2 max-w-xl text-[#f4f4f5]/75">{t('home.ctaDescription')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={APP_STORE_URL} className="inline-flex h-12 items-center justify-center bg-[#f2b230] px-6 font-bold text-[#18181b] hover:opacity-90">{t('home.appStore')}</a>
              <a href={PLAY_STORE_URL} className="inline-flex h-12 items-center justify-center border border-[#f4f4f5] px-6 font-bold hover:opacity-90">{t('home.googlePlay')}</a>
            </div>
          </div>
        </section>

        {/* 휴대폰: 아래 고정 다운로드 */}
        <div className="sticky bottom-0 z-10 flex gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <a href={APP_STORE_URL} className="flex h-12 flex-1 items-center justify-center bg-foreground text-sm font-semibold text-background">{t('home.appStore')}</a>
          <a href={PLAY_STORE_URL} className="flex h-12 flex-1 items-center justify-center border border-foreground text-sm font-semibold">{t('home.googlePlay')}</a>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
