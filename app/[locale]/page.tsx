import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
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
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/store-links'
import { LiveDemo } from '@/components/landing/live-demo'
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

export default async function HomePage() {
  const t = await getTranslations()

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

      <main id="main" className="min-h-screen">
        {/* 첫 화면: 왼쪽 문구, 오른쪽 폰→PC 실시간 데모 */}
        <section className="page grid items-center gap-12 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          <div className="min-w-0">
            <h1 className="enter type-display" style={{ '--i': 0 } as React.CSSProperties}>
              {t('home.heroTitle1')}
              <br />
              <span className="text-muted-foreground">{t('home.heroTitle2')}</span>
            </h1>
            <p className="enter mt-5 max-w-2xl type-lead" style={{ '--i': 1 } as React.CSSProperties}>
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
          </div>
          <div className="enter min-w-0" style={{ '--i': 3 } as React.CSSProperties}>
            <LiveDemo
              labels={{
                sessionName: t('landing.demoSession'),
                connected: t('session.connected'),
                justScanned: t('session.lastScan'),
                now: t('landing.demoNow'),
                todayCount: t.raw('landing.demoToday') as string,
                distinctCodes: t.raw('landing.demoCodes') as string,
                code: t('table.code'),
                time: t('table.scanTime'),
                saved: t('landing.demoSaved'),
              }}
            />
            <p className="sr-only">{t('landing.demoAlt')}</p>
          </div>
        </section>

        {/* 인식하는 바코드 13종이 흘러가는 띠 */}
        <section aria-labelledby="types-title" className="border-y bg-card py-6">
          <h2 id="types-title" className="sr-only">{t('landing.typesTitle')}</h2>
          <div className="marquee">
            <ul className="marquee-track">
              {[...BARCODE_TYPES, ...BARCODE_TYPES].map((name, i) => (
                <li
                  key={i}
                  aria-hidden={i >= BARCODE_TYPES.length ? 'true' : undefined}
                  className="shrink-0 rounded-full border bg-background px-4 py-1.5 font-mono text-13 font-semibold text-muted-foreground"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 주요 기능 */}
        <section id="features" aria-labelledby="features-title" className="page scroll-mt-20 py-16">
          <h2 id="features-title" className="type-h1">{t('home.whyChoose')}</h2>
          <Reveal as="ul" stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon, href }, idx) => {
              const body = (
                <>
                  <span className="flex size-10 items-center justify-center rounded-code bg-secondary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 type-h3">{t(`features.${key}.title`)}</h3>
                  <p className="mt-1.5 type-body text-muted-foreground">{t(`features.${key}.description`)}</p>
                </>
              )
              return (
                <li key={key} className="min-w-0" style={{ '--i': idx } as React.CSSProperties}>
                  {href ? (
                    <Link href={href} className="lift block h-full rounded-card border bg-card p-6">{body}</Link>
                  ) : (
                    <div className="h-full rounded-card border bg-card p-6">{body}</div>
                  )}
                </li>
              )
            })}
          </Reveal>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/features">{t('nav.allFeatures')}<ArrowRight aria-hidden="true" /></Link>
          </Button>
        </section>

        {/* 활용 사례 */}
        <section id="usecases" aria-labelledby="usecases-title" className="scroll-mt-20 border-y bg-card py-16">
          <div className="page">
            <h2 id="usecases-title" className="type-h1">{t('home.whoUses')}</h2>
            <Reveal as="ul" stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {USE_CASES.map(({ key, icon: Icon }, idx) => (
                <li key={key} className="lift min-w-0 rounded-card border bg-background p-6" style={{ '--i': idx } as React.CSSProperties}>
                  <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                  <h3 className="mt-3 type-h3">{t(`useCases.${key}.title`)}</h3>
                  <p className="mt-1.5 type-body text-muted-foreground">{t(`useCases.${key}.description`)}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section id="faq" aria-labelledby="faq-title" className="page scroll-mt-20 py-16">
          <h2 id="faq-title" className="type-h1">{t('home.faqTitle')}</h2>
          <Reveal as="dl" className="mt-8 max-w-3xl divide-y rounded-card border bg-card">
            {FAQ_KEYS.map((q) => (
              <div key={q} className="p-6">
                <dt className="type-h3">{t(`faq.${q}.question`)}</dt>
                <dd className="mt-2 type-body text-muted-foreground">{t(`faq.${q}.answer`)}</dd>
              </div>
            ))}
          </Reveal>
        </section>

        {/* 마무리 안내 */}
        <section className="page pb-8 pt-4">
          <Reveal className="rounded-card border bg-card px-6 py-12 text-center sm:px-12">
            <h2 className="type-h1">{t('home.ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl type-lead">{t('home.ctaDescription')}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl">
                <a href={APP_STORE_URL}>{t('home.appStore')}</a>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a href={PLAY_STORE_URL}>{t('home.googlePlay')}</a>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
