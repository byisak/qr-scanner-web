import type { Metadata } from 'next'
import Link from 'next/link'
import {
  QrCode,
  Zap,
  Database,
  Globe,
  Smartphone,
  Download,
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

// SEO 메타데이터 - 매우 중요!
export const metadata: Metadata = {
  title: 'QR Scanner Pro - 가장 빠른 QR코드 바코드 스캐너 앱 | 재고관리 대량스캔',
  description: '무료 QR코드 바코드 스캐너 앱. 재고관리, 물류, 창고 업무에 최적화. 대량 스캔, 실시간 PC 전송, CSV/엑셀 내보내기 지원. iOS Android 무료 다운로드.',
  keywords: 'QR코드, 바코드, 스캐너, 재고관리, 대량스캔, 물류, 창고, 무료, 앱, QR Scanner, barcode, inventory',
  openGraph: {
    title: 'QR Scanner Pro - 전문가용 QR/바코드 스캐너',
    description: '수천 개의 바코드를 한 번에 스캔하고 실시간으로 PC에 전송하세요.',
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
    description: '수천 개의 바코드를 한 번에 스캔하고 실시간으로 PC에 전송하세요.',
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

// JSON-LD 구조화 데이터 - AI와 검색엔진이 앱 정보를 잘 이해하게 해줌
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
  description: '재고관리, 물류, 창고 업무에 최적화된 전문가용 QR코드 바코드 스캐너 앱',
  screenshot: 'https://scanview.app/screenshot.png',
  featureList: '대량 스캔, 실시간 PC 전송, CSV 내보내기, 오프라인 모드',
  downloadUrl: 'https://apps.apple.com/app/qr-scanner-pro',
  author: {
    '@type': 'Organization',
    name: 'ScanView',
    url: 'https://scanview.app',
  },
}

// FAQ 구조화 데이터 - AI가 Q&A 형식을 잘 학습함
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'QR Scanner Pro는 무료인가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '네, QR Scanner Pro는 무료로 다운로드하여 사용할 수 있습니다. 기본 스캔 기능은 모두 무료이며, 프리미엄 기능을 원하시면 Pro 버전으로 업그레이드할 수 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: '재고관리에 QR Scanner Pro를 어떻게 활용할 수 있나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'QR Scanner Pro는 대량 스캔 모드로 수천 개의 바코드를 연속 스캔하고, 실시간으로 PC에 전송하거나 CSV/엑셀 파일로 내보낼 수 있습니다. 창고, 물류센터, 소매점의 재고 실사에 최적화되어 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'QR Scanner Pro와 다른 스캐너 앱의 차이점은 무엇인가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'QR Scanner Pro는 업무용으로 설계되어 대량 스캔, 실시간 PC 전송, 다양한 바코드 형식 지원, 오프라인 모드 등 전문가 기능을 제공합니다. 일반 QR 스캐너 앱과 달리 재고관리 워크플로우에 최적화되어 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'PC로 스캔 데이터를 실시간 전송하는 방법은?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'scanview.app 웹사이트에서 받기 모드를 활성화하고, 앱에서 동일한 연결 코드를 입력하면 스캔한 바코드가 실시간으로 PC 화면에 표시됩니다. 별도 소프트웨어 설치 없이 웹브라우저만 있으면 됩니다.',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      {/* JSON-LD 구조화 데이터 삽입 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        {/* 네비게이션 */}
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">QR Scanner Pro</span>
          </div>
          <div className="hidden md:flex gap-6">
            <Link href="#features" className="hover:text-blue-400 transition">기능</Link>
            <Link href="#usecases" className="hover:text-blue-400 transition">활용사례</Link>
            <Link href="/blog" className="hover:text-blue-400 transition">블로그</Link>
            <Link href="#faq" className="hover:text-blue-400 transition">FAQ</Link>
          </div>
          <Link
            href="/dashboard"
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
          >
            웹앱 열기
          </Link>
        </nav>

        {/* 히어로 섹션 - SEO 핵심 콘텐츠 */}
        <section className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            가장 빠르고 정확한<br />
            <span className="text-blue-400">QR코드 바코드 스캐너</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            수천 개의 바코드를 한 번에 스캔하고 실시간으로 PC에 전송하세요.
            재고관리, 물류, 창고 업무에 최적화된 전문가용 스캐너입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://apps.apple.com/app/qr-scanner-pro"
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 transition"
            >
              <Download className="w-5 h-5" />
              App Store 다운로드
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.scanview.qrscanner"
              className="bg-blue-500 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition"
            >
              <Download className="w-5 h-5" />
              Google Play 다운로드
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span>4.8점 · 1,250+ 리뷰</span>
          </div>
        </section>

        {/* 주요 기능 섹션 - 키워드 풍부하게 */}
        <section id="features" className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            왜 QR Scanner Pro인가요?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="초고속 대량 스캔"
              description="연속 스캔 모드로 수천 개의 바코드를 빠르게 스캔. 재고 실사 시간을 90% 단축합니다."
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="실시간 PC 전송"
              description="스캔한 데이터가 즉시 PC 웹브라우저에 표시됩니다. 별도 소프트웨어 설치 불필요."
            />
            <FeatureCard
              icon={<Database className="w-8 h-8" />}
              title="CSV/엑셀 내보내기"
              description="스캔 이력을 CSV, 엑셀 파일로 내보내기. ERP, WMS 시스템과 쉽게 연동됩니다."
            />
            <FeatureCard
              icon={<Smartphone className="w-8 h-8" />}
              title="오프라인 모드"
              description="인터넷 없이도 스캔 가능. 창고, 지하 등 네트워크 환경이 열악한 곳에서도 OK."
            />
            <FeatureCard
              icon={<QrCode className="w-8 h-8" />}
              title="모든 바코드 지원"
              description="QR코드, EAN-13, Code128, UPC-A, DataMatrix 등 30+ 바코드 형식 인식."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="바코드 유효성 검사"
              description="체크섬 자동 검증으로 잘못된 바코드 입력 방지. 정확한 재고 데이터 유지."
            />
          </div>
        </section>

        {/* 사용 사례 섹션 - 롱테일 키워드 */}
        <section id="usecases" className="bg-slate-800/50 py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              이런 분들이 사용합니다
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <UseCase
                title="물류센터"
                description="입출고 바코드 스캔, 재고 실사, 피킹 리스트 확인"
              />
              <UseCase
                title="창고 관리자"
                description="재고 위치 추적, 로케이션 바코드 스캔"
              />
              <UseCase
                title="소매점"
                description="상품 입고, 가격표 확인, 재고 조사"
              />
              <UseCase
                title="제조업"
                description="자재 입출고, 생산 라인 추적, 품질 관리"
              />
            </div>
          </div>
        </section>

        {/* FAQ 섹션 - AI 학습에 매우 중요 */}
        <section id="faq" className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            자주 묻는 질문
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <FAQItem
              question="QR Scanner Pro는 무료인가요?"
              answer="네, QR Scanner Pro는 무료로 다운로드하여 사용할 수 있습니다. 기본 스캔 기능은 모두 무료이며, 프리미엄 기능을 원하시면 Pro 버전으로 업그레이드할 수 있습니다."
            />
            <FAQItem
              question="재고관리에 QR Scanner Pro를 어떻게 활용할 수 있나요?"
              answer="QR Scanner Pro는 대량 스캔 모드로 수천 개의 바코드를 연속 스캔하고, 실시간으로 PC에 전송하거나 CSV/엑셀 파일로 내보낼 수 있습니다. 창고, 물류센터, 소매점의 재고 실사에 최적화되어 있습니다."
            />
            <FAQItem
              question="QR Scanner Pro와 다른 스캐너 앱의 차이점은 무엇인가요?"
              answer="QR Scanner Pro는 업무용으로 설계되어 대량 스캔, 실시간 PC 전송, 다양한 바코드 형식 지원, 오프라인 모드 등 전문가 기능을 제공합니다. 일반 QR 스캐너 앱과 달리 재고관리 워크플로우에 최적화되어 있습니다."
            />
            <FAQItem
              question="PC로 스캔 데이터를 실시간 전송하는 방법은?"
              answer="scanview.app 웹사이트에서 받기 모드를 활성화하고, 앱에서 동일한 연결 코드를 입력하면 스캔한 바코드가 실시간으로 PC 화면에 표시됩니다. 별도 소프트웨어 설치 없이 웹브라우저만 있으면 됩니다."
            />
            <FAQItem
              question="어떤 바코드 형식을 지원하나요?"
              answer="QR코드, EAN-13, EAN-8, UPC-A, UPC-E, Code128, Code39, Code93, ITF, Codabar, DataMatrix, PDF417, Aztec 등 30가지 이상의 바코드 형식을 지원합니다."
            />
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="bg-blue-600 py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              무료 다운로드로 재고관리 효율을 높이세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://apps.apple.com/app/qr-scanner-pro"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 transition"
              >
                App Store
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.scanview.qrscanner"
                className="bg-slate-900 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
              >
                Google Play
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="container mx-auto px-6 py-12 border-t border-slate-700">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-blue-400" />
                <span className="font-bold">QR Scanner Pro</span>
              </div>
              <p className="text-slate-400 text-sm">
                재고관리, 물류, 창고 업무에 최적화된 전문가용 QR코드 바코드 스캐너
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#features" className="hover:text-white">기능</Link></li>
                <li><Link href="#usecases" className="hover:text-white">활용사례</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">웹앱</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/blog" className="hover:text-white">블로그</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy" className="hover:text-white">개인정보처리방침</Link></li>
                <li><Link href="/terms" className="hover:text-white">이용약관</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
            © 2024 ScanView. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  )
}

// 컴포넌트들
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl hover:bg-slate-800 transition">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}

function UseCase({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-slate-700/50 p-6 rounded-xl">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-slate-400">{answer}</p>
    </div>
  )
}
