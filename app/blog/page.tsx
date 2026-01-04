import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: '블로그 - QR코드 바코드 스캐너 활용 가이드',
  description: 'QR코드, 바코드 스캐너 활용법, 재고관리 팁, 물류 효율화 방법 등 실무에 도움되는 정보를 제공합니다.',
  openGraph: {
    title: '블로그 | QR Scanner Pro',
    description: 'QR코드, 바코드 스캐너 활용법과 재고관리 팁',
    url: 'https://scanview.app/blog',
  },
}

// 블로그 포스트 데이터 (나중에 MDX나 CMS로 대체 가능)
const blogPosts = [
  {
    slug: 'best-qr-scanner-apps-2024',
    title: '2024년 최고의 QR코드 스캐너 앱 비교 - 재고관리용 추천',
    excerpt: '재고관리, 물류, 창고 업무에 적합한 QR코드 스캐너 앱을 비교 분석합니다. 대량 스캔, PC 연동, 오프라인 모드 등 핵심 기능을 기준으로 평가했습니다.',
    date: '2024-01-15',
    category: '앱 비교',
    readTime: '8분',
  },
  {
    slug: 'inventory-management-barcode-guide',
    title: '바코드를 활용한 재고관리 완벽 가이드',
    excerpt: '소규모 창고부터 대형 물류센터까지, 바코드 시스템으로 재고관리를 효율화하는 방법을 단계별로 설명합니다.',
    date: '2024-01-10',
    category: '가이드',
    readTime: '12분',
  },
  {
    slug: 'qr-code-vs-barcode-difference',
    title: 'QR코드 vs 바코드 - 차이점과 각각의 활용법',
    excerpt: 'QR코드와 1D 바코드의 기술적 차이점, 장단점, 그리고 업종별 최적의 선택 방법을 알아봅니다.',
    date: '2024-01-05',
    category: '기술',
    readTime: '6분',
  },
  {
    slug: 'warehouse-efficiency-mobile-scanning',
    title: '모바일 스캐닝으로 창고 효율성 300% 높이기',
    excerpt: '전용 스캐너 장비 대신 스마트폰 앱을 활용해 창고 운영 비용을 절감하고 효율성을 높이는 실제 사례를 소개합니다.',
    date: '2024-01-01',
    category: '사례',
    readTime: '10분',
  },
  {
    slug: 'barcode-types-explained',
    title: 'EAN-13, Code128, QR코드... 바코드 종류별 특징 총정리',
    excerpt: '업무에서 자주 사용하는 바코드 형식들의 특징과 용도를 정리했습니다. 어떤 바코드를 선택해야 할지 고민될 때 참고하세요.',
    date: '2023-12-28',
    category: '기술',
    readTime: '7분',
  },
  {
    slug: 'real-time-inventory-tracking',
    title: '실시간 재고 추적 시스템 구축하기 - 중소기업 가이드',
    excerpt: '고가의 ERP 없이도 QR Scanner Pro와 스프레드시트만으로 실시간 재고 추적 시스템을 구축하는 방법을 안내합니다.',
    date: '2023-12-20',
    category: '가이드',
    readTime: '15분',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 헤더 */}
      <header className="container mx-auto px-6 py-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
          ← 홈으로
        </Link>
      </header>

      {/* 블로그 헤더 */}
      <section className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">블로그</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          QR코드, 바코드 스캐너 활용법과 재고관리 팁을 공유합니다
        </p>
      </section>

      {/* 블로그 포스트 목록 */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-slate-800/50 rounded-2xl overflow-hidden hover:bg-slate-800 transition group"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <span>{post.readTime} 읽기</span>
                </div>
                <h2 className="text-xl font-semibold mb-3 group-hover:text-blue-400 transition">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-slate-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-400 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  자세히 보기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-12">
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            QR Scanner Pro를 사용해보세요
          </h2>
          <p className="text-slate-300 mb-6">
            블로그에서 읽은 내용을 직접 실습해보세요. 무료로 시작할 수 있습니다.
          </p>
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg inline-flex items-center gap-2 transition"
          >
            앱 다운로드
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  )
}
