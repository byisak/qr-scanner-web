import type { Metadata } from 'next'
import { ArrowUpRight, Mail, Smartphone, UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BetaShare } from '@/components/beta-qr'
import { SiteHeader, SiteFooter } from '@/components/site-header'

const PAGE_URL = 'https://scanview.app/beta'
const GROUP_URL = 'https://groups.google.com/g/cubion-qrscanner-testers'
const OPT_IN_URL = 'https://play.google.com/apps/testing/com.cubion.qrscanner'
const STORE_URL = 'https://play.google.com/store/apps/details?id=com.cubion.qrscanner'
const CONTACT = 'qrscanner.app.help@gmail.com'

export const metadata: Metadata = {
  title: '테스터 참여 안내 - QR 스캐너',
  description: 'QR 스캐너 Android 앱 비공개 테스트에 참여하는 방법을 안내해요.',
  robots: { index: false, follow: false },
}

const steps = [
  {
    icon: Users,
    title: '테스터 그룹에 가입해요',
    body: 'Google 계정으로 로그인한 뒤 "그룹 가입"을 눌러 주세요. 가입해야 앱을 받을 수 있어요.',
    action: { label: '그룹 가입하기', href: GROUP_URL },
  },
  {
    icon: UserPlus,
    title: '테스터로 등록해요',
    body: '"테스터 되기"를 눌러 주세요. 그룹에 가입한 계정과 같은 계정이어야 해요.',
    action: { label: '테스터 되기', href: OPT_IN_URL },
  },
  {
    icon: Smartphone,
    title: 'Play 스토어에서 설치해요',
    body: '등록하고 몇 분 뒤부터 설치할 수 있어요. 안 보이면 잠시 뒤 다시 열어 주세요.',
    action: { label: 'Play 스토어 열기', href: STORE_URL },
  },
]

const notes = [
  '안드로이드 휴대폰에서만 설치할 수 있어요. 아이폰용은 준비 중이에요.',
  '세 단계 모두 같은 Google 계정을 써 주세요. 휴대폰 Play 스토어에 로그인된 계정이에요.',
  '설치한 뒤 14일 동안 앱을 지우지 말고 두어 주세요. 정식 출시에 꼭 필요해요.',
  '회원가입 없이 바로 쓸 수 있어요. 스캔 기록은 휴대폰에만 저장돼요.',
]

export default function BetaPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="min-h-screen">
        <section className="page-narrow pb-6 pt-12 sm:pt-16">
          <p className="enter text-13 font-semibold text-muted-foreground" style={{ '--i': 0 } as React.CSSProperties}>
            비공개 테스트
          </p>
          <h1 className="enter mt-2 type-h1" style={{ '--i': 1 } as React.CSSProperties}>
            QR 스캐너 테스터가 되어 주세요
          </h1>
          <p className="enter mt-3 type-lead" style={{ '--i': 2 } as React.CSSProperties}>
            정식 출시 전에 먼저 써 보고 의견을 들려주세요. 세 단계면 끝나요.
          </p>
        </section>

        <section className="page-narrow py-4" aria-label="참여 순서">
          <ol className="swap grid gap-3">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <li key={step.title} className="min-w-0 rounded-card border bg-card p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span
                      className="tabular flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-15 font-bold"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="flex items-center gap-2 type-h3">
                        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                        {step.title}
                      </h2>
                      <p className="mt-1 type-body text-muted-foreground">{step.body}</p>
                      <Button asChild className="mt-4 w-full sm:w-auto" size={i === 0 ? 'xl' : 'default'} variant={i === 0 ? 'default' : 'outline'}>
                        <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                          {step.action.label}
                          <ArrowUpRight aria-hidden="true" />
                          <span className="sr-only">(새 창)</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="page-narrow py-4" aria-labelledby="beta-notes">
          <div className="rounded-card border bg-card p-5 sm:p-6">
            <h2 id="beta-notes" className="type-h3">알아 두세요</h2>
            <ul className="mt-3 grid gap-2">
              {notes.map((note) => (
                <li key={note} className="flex gap-2 type-body text-muted-foreground">
                  <span aria-hidden="true">·</span>
                  <span className="min-w-0">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="page-narrow py-4" aria-labelledby="beta-share">
          <div className="rounded-card border bg-card p-5 sm:p-6">
            <h2 id="beta-share" className="type-h3">이 페이지 공유하기</h2>
            <div className="mt-4">
              <BetaShare url={PAGE_URL} />
            </div>
          </div>
        </section>

        <section className="page-narrow pb-16 pt-4">
          <p className="flex flex-wrap items-center gap-2 type-body text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            의견이나 문제는
            <a href={`mailto:${CONTACT}`} className="break-all font-semibold text-foreground underline underline-offset-4">
              {CONTACT}
            </a>
            로 보내 주세요
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
