import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, Check, Minus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SiteHeader, SiteFooter } from '@/components/site-header'

// 비교표 칸: 아이콘 + 읽어 주는 글자 (색으로만 구분하지 않음)
function Yes() {
  return (
    <>
      <Check className="mx-auto size-5" aria-hidden="true" />
      <span className="sr-only">지원</span>
    </>
  )
}
function No() {
  return (
    <>
      <Minus className="mx-auto size-5 text-faint" aria-hidden="true" />
      <span className="sr-only">미지원</span>
    </>
  )
}

export const metadata: Metadata = {
  title: '2024년 최고의 QR코드 스캐너 앱 비교 - 재고관리용 추천',
  description: '재고관리, 물류, 창고 업무에 적합한 QR코드 스캐너 앱 5개를 비교합니다. QR Scanner Pro, Scandit, Orca Scan 등의 기능, 가격, 장단점을 분석했습니다.',
  keywords: 'QR스캐너 비교, 바코드 앱 추천, 재고관리 앱, QR Scanner Pro, Scandit, Orca Scan',
  openGraph: {
    title: '2024년 최고의 QR코드 스캐너 앱 비교',
    description: '재고관리용 QR/바코드 스캐너 앱 5개 비교 분석',
    url: 'https://scanview.app/blog/best-qr-scanner-apps-2024',
    type: 'article',
    publishedTime: '2024-01-15T00:00:00Z',
    authors: ['ScanView'],
  },
}

// 비교 포스트용 JSON-LD
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '2024년 최고의 QR코드 스캐너 앱 비교 - 재고관리용 추천',
  datePublished: '2024-01-15T00:00:00Z',
  dateModified: '2024-01-15T00:00:00Z',
  author: {
    '@type': 'Organization',
    name: 'ScanView',
    url: 'https://scanview.app',
  },
  publisher: {
    '@type': 'Organization',
    name: 'ScanView',
    logo: {
      '@type': 'ImageObject',
      url: 'https://scanview.app/logo.png',
    },
  },
  description: '재고관리, 물류, 창고 업무에 적합한 QR코드 스캐너 앱을 비교 분석합니다.',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://scanview.app/blog/best-qr-scanner-apps-2024',
  },
}

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <SiteHeader active="blog" />

      <main id="main" className="min-h-screen">
        <article className="page-narrow pt-8">
          <Button asChild variant="ghost" size="sm" className="-ml-2.5">
            <Link href="/blog">
              <ArrowLeft aria-hidden="true" />
              블로그로 돌아가기
            </Link>
          </Button>

          {/* 글 머리 */}
          <header className="pb-6 pt-6">
            <div className="tabular flex flex-wrap items-center gap-x-3 gap-y-1.5 text-13 text-muted-foreground">
              <Badge variant="secondary">앱 비교</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" aria-hidden="true" />
                <time dateTime="2024-01-15">2024년 1월 15일</time>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                8분 읽기
              </span>
            </div>
            <h1 className="mt-4 type-h1">
              2024년 최고의 QR코드 스캐너 앱 비교 - 재고관리용 추천
            </h1>
            <p className="mt-4 type-lead">
              재고관리, 물류, 창고 업무에 적합한 QR코드 스캐너 앱 5개를 비교합니다.
              대량 스캔, PC 연동, 오프라인 모드 등 핵심 기능을 기준으로 평가했습니다.
            </p>
          </header>

          {/* 본문 */}
          <div className="prose max-w-none py-6 type-body sm:prose-lg">

            <h2>재고관리용 스캐너 앱, 어떻게 선택해야 할까?</h2>
            <p>
              창고나 물류센터에서 재고 실사를 할 때, 전용 바코드 스캐너 장비를 사용하는 것이 일반적이었습니다.
              하지만 최근에는 스마트폰 앱의 인식 성능이 크게 향상되면서,
              고가의 장비 없이도 효율적인 재고관리가 가능해졌습니다.
            </p>
            <p>
              이 글에서는 업무용으로 사용하기 좋은 QR코드/바코드 스캐너 앱 5개를 비교 분석합니다.
              특히 <strong>대량 스캔, PC 연동, 오프라인 모드, 데이터 내보내기</strong> 등
              실무에서 중요한 기능을 중심으로 평가했습니다.
            </p>

            <h2>비교 대상 앱 목록</h2>
            <ol>
              <li><strong>QR Scanner Pro</strong> - scanview.app</li>
              <li><strong>Orca Scan</strong></li>
              <li><strong>Scandit</strong></li>
              <li><strong>Stock & Inventory Simple</strong></li>
              <li><strong>QR & Barcode Scanner</strong> (Gamma Play)</li>
            </ol>

            <h2>기능별 비교표</h2>
            <div className="not-prose relative overflow-x-auto rounded-field border bg-card">
              <table className="w-full min-w-[640px] text-15">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left py-3 px-4">기능</th>
                    <th className="text-center py-3 px-4">QR Scanner Pro</th>
                    <th className="text-center py-3 px-4">Orca Scan</th>
                    <th className="text-center py-3 px-4">Scandit</th>
                    <th className="text-center py-3 px-4">Stock Simple</th>
                    <th className="text-center py-3 px-4">Gamma Play</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b last:border-0">
                    <td className="py-3 px-4">대량 연속 스캔</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="py-3 px-4">실시간 PC 전송</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="py-3 px-4">오프라인 모드</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="py-3 px-4">CSV/엑셀 내보내기</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><No /></td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="py-3 px-4">무료 사용</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4">제한적</td>
                    <td className="text-center py-3 px-4">엔터프라이즈</td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                    <td className="text-center py-3 px-4"><Yes /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>1. QR Scanner Pro (추천)</h2>
            <p>
              <strong>QR Scanner Pro</strong>는 재고관리와 물류 업무에 특화된 스캐너 앱입니다.
              가장 큰 장점은 <strong>scanview.app 웹사이트를 통한 실시간 PC 연동</strong>입니다.
              별도 소프트웨어 설치 없이 웹브라우저만 있으면 스캔 데이터를 즉시 PC에서 확인할 수 있습니다.
            </p>
            <h3>장점</h3>
            <ul>
              <li>대량 연속 스캔 모드로 빠른 재고 실사</li>
              <li>실시간 PC 전송 (웹브라우저 기반, 소프트웨어 설치 불필요)</li>
              <li>완전한 오프라인 모드 지원</li>
              <li>주요 바코드 13종 인식</li>
              <li>바코드 유효성 자동 검증</li>
              <li>무료로 모든 핵심 기능 사용 가능</li>
            </ul>
            <h3>단점</h3>
            <ul>
              <li>ERP 직접 연동은 API로 별도 구현 필요</li>
              <li>여러 사람이 한 세션을 함께 관리하는 팀 기능은 아직 없음</li>
            </ul>
            <p>
              <strong>추천 대상:</strong> 중소규모 창고, 소매점, 물류 스타트업,
              고가의 스캐너 장비 없이 효율적인 재고관리를 원하는 곳
            </p>

            <h2>2. Orca Scan</h2>
            <p>
              Orca Scan은 클라우드 기반의 재고관리 솔루션입니다.
              스캔 데이터가 클라우드에 자동 동기화되어 팀 협업에 유리합니다.
            </p>
            <h3>장점</h3>
            <ul>
              <li>클라우드 자동 동기화</li>
              <li>팀 협업 기능 내장</li>
              <li>Google Sheets 연동</li>
            </ul>
            <h3>단점</h3>
            <ul>
              <li>무료 버전 기능 제한 (월 100회 스캔)</li>
              <li>오프라인 모드 제한적</li>
              <li>유료 플랜 비용이 높음</li>
            </ul>

            <h2>3. Scandit</h2>
            <p>
              Scandit은 엔터프라이즈급 바코드 스캐닝 솔루션입니다.
              SDK를 제공하여 자체 앱에 스캐닝 기능을 통합할 수 있습니다.
            </p>
            <h3>장점</h3>
            <ul>
              <li>최고 수준의 인식 정확도</li>
              <li>AR 기반 멀티 스캔</li>
              <li>엔터프라이즈 보안</li>
            </ul>
            <h3>단점</h3>
            <ul>
              <li>개인/소규모 사업자는 사용 어려움</li>
              <li>높은 비용 (연간 계약)</li>
              <li>도입 복잡성</li>
            </ul>

            <h2>결론: 어떤 앱을 선택해야 할까?</h2>
            <div className="my-6 rounded-card border bg-card p-6">
              <h3 className="mt-0">상황별 추천</h3>
              <ul className="mb-0">
                <li><strong>중소규모 창고/소매점:</strong> QR Scanner Pro - 무료로 핵심 기능 모두 사용 가능</li>
                <li><strong>팀 협업이 중요한 곳:</strong> Orca Scan - 클라우드 동기화 편리</li>
                <li><strong>대기업/엔터프라이즈:</strong> Scandit - 최고의 성능과 보안</li>
                <li><strong>단순 개인 용도:</strong> Gamma Play 앱 - 무료, 간단</li>
              </ul>
            </div>
            <p>
              재고관리 업무 효율화를 위해 스캐너 앱을 도입하려면,
              먼저 <strong>대량 스캔 빈도, PC 연동 필요성, 팀 규모</strong>를 고려해보세요.
              대부분의 중소규모 사업장에서는 QR Scanner Pro로 충분한 효과를 볼 수 있습니다.
            </p>
          </div>

          {/* 안내 */}
          <div className="my-12 rounded-card border bg-card p-6 sm:p-8">
            <h2 className="type-h2">QR Scanner Pro 무료로 써 보기</h2>
            <p className="mt-2 type-body text-muted-foreground">
              앱을 내려받고 재고관리를 더 쉽게 해 보세요
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <a href="https://apps.apple.com/app/id6757360768">App Store 다운로드</a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://play.google.com/store/apps/details?id=com.cubion.qrscanner">Google Play 다운로드</a>
              </Button>
            </div>
          </div>

          {/* 관련 글 */}
          <section className="border-t py-12" aria-labelledby="related-title">
            <h2 id="related-title" className="type-h3">관련 글</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              <li>
                <Link href="/blog" className="lift block h-full rounded-card border bg-card p-6">
                  <span className="block text-15 font-bold">바코드를 활용한 재고관리 완벽 가이드</span>
                  <span className="mt-1 block text-15 text-muted-foreground">바코드 시스템으로 재고관리를 효율화하는 방법</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="lift block h-full rounded-card border bg-card p-6">
                  <span className="block text-15 font-bold">모바일 스캐닝으로 창고 효율 높이기</span>
                  <span className="mt-1 block text-15 text-muted-foreground">스마트폰 앱을 활용한 창고 운영 사례</span>
                </Link>
              </li>
            </ul>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  )
}
