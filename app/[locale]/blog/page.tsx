import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SiteHeader, SiteFooter } from '@/components/site-header'

export const metadata: Metadata = {
  title: '블로그 - QR코드 바코드 스캐너 활용 가이드',
  description: 'QR코드, 바코드 스캐너 활용법, 재고관리 팁, 물류 효율화 방법 등 실무에 도움되는 글을 모았어요.',
  openGraph: {
    title: '블로그 | QR Scanner Pro',
    description: 'QR코드, 바코드 스캐너 활용법과 재고관리 팁',
    url: 'https://scanview.app/blog',
  },
}

// 실제로 글 페이지가 있는 slug (없는 글은 링크 대신 "준비 중"으로 보여 준다)
const PUBLISHED = new Set(['best-qr-scanner-apps-2024'])

// 블로그 포스트 데이터 (나중에 MDX나 CMS로 대체 가능)
const blogPosts = [
  {
    slug: 'best-qr-scanner-apps-2024',
    title: '2024년 최고의 QR코드 스캐너 앱 비교 - 재고관리용 추천',
    excerpt: '재고관리, 물류, 창고 업무에 맞는 QR코드 스캐너 앱을 비교했어요. 대량 스캔, PC 연동, 오프라인 모드 같은 핵심 기능을 기준으로 살펴봐요.',
    date: '2024-01-15',
    category: '앱 비교',
    readTime: '8분',
  },
  {
    slug: 'inventory-management-barcode-guide',
    title: '바코드를 활용한 재고관리 완벽 가이드',
    excerpt: '작은 창고부터 큰 물류센터까지, 바코드로 재고관리를 효율적으로 하는 방법을 단계별로 설명해요.',
    date: '2024-01-10',
    category: '가이드',
    readTime: '12분',
  },
  {
    slug: 'qr-code-vs-barcode-difference',
    title: 'QR코드 vs 바코드 - 차이점과 각각의 활용법',
    excerpt: 'QR코드와 1D 바코드의 기술적 차이, 장단점, 업종별로 무엇을 고르면 좋은지 알아봐요.',
    date: '2024-01-05',
    category: '기술',
    readTime: '6분',
  },
  {
    slug: 'warehouse-efficiency-mobile-scanning',
    title: '모바일 스캐닝으로 창고 효율 높이기',
    excerpt: '전용 스캐너 장비 대신 스마트폰 앱으로 창고 운영 비용을 줄이고 효율을 높인 사례를 소개해요.',
    date: '2024-01-01',
    category: '사례',
    readTime: '10분',
  },
  {
    slug: 'barcode-types-explained',
    title: 'EAN-13, Code128, QR코드 — 바코드 종류별 특징 총정리',
    excerpt: '업무에서 자주 쓰는 바코드 형식의 특징과 용도를 정리했어요. 어떤 바코드를 골라야 할지 고민될 때 참고해 주세요.',
    date: '2023-12-28',
    category: '기술',
    readTime: '7분',
  },
  {
    slug: 'real-time-inventory-tracking',
    title: '실시간 재고 추적 시스템 구축하기 - 중소기업 가이드',
    excerpt: '비싼 ERP 없이 QR Scanner Pro와 스프레드시트만으로 실시간 재고 추적 시스템을 만드는 방법을 안내해요.',
    date: '2023-12-20',
    category: '가이드',
    readTime: '15분',
  },
]

export default function BlogPage() {
  return (
    <>
      <SiteHeader active="blog" />

      <main id="main" className="min-h-screen">
        <section className="page pb-8 pt-12 sm:pt-16">
          <h1 className="enter type-h1" style={{ '--i': 0 } as React.CSSProperties}>블로그</h1>
          <p className="enter mt-3 max-w-2xl type-lead" style={{ '--i': 1 } as React.CSSProperties}>
            QR코드, 바코드 스캐너 활용법과 재고관리 팁을 나눠요
          </p>
        </section>

        {/* 글 목록 */}
        <section className="page py-8" aria-label="글 목록">
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => {
              const published = PUBLISHED.has(post.slug)
              return (
                <li key={post.slug} className="min-w-0">
                  <article className={`flex h-full flex-col rounded-card border bg-card p-6 ${published ? 'lift' : ''}`}>
                    <div className="tabular flex flex-wrap items-center gap-x-3 gap-y-1.5 text-13 text-muted-foreground">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        <time dateTime={post.date}>{post.date}</time>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {post.readTime} 읽기
                      </span>
                    </div>
                    <h2 className="mt-3 type-h3">
                      {published ? (
                        <Link href={`/blog/${post.slug}`} className="hover:underline hover:underline-offset-4">
                          {post.title}
                        </Link>
                      ) : (
                        post.title
                      )}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 type-body text-muted-foreground">
                      {post.excerpt}
                    </p>
                    {published ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-4 inline-flex items-center gap-1 text-15 font-semibold"
                        aria-label={`${post.title} 읽기`}
                      >
                        글 읽기
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <p className="mt-4 text-15 font-semibold text-faint">준비 중</p>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        </section>

        {/* 안내 */}
        <section className="page py-8">
          <div className="rounded-card border bg-card px-6 py-10 text-center">
            <h2 className="type-h2">QR Scanner Pro를 써 보세요</h2>
            <p className="mx-auto mt-2 max-w-xl type-body text-muted-foreground">
              블로그에서 읽은 내용을 직접 해 보세요. 무료로 시작할 수 있어요
            </p>
            <Button asChild className="mt-6">
              <Link href="/">
                앱 내려받기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
