import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ScanLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteMobileMenu } from "@/components/site-mobile-menu"

/**
 * 공개 페이지(랜딩·블로그) 머리글 — 꿀앱 site-header 모양.
 * 넓은 화면: 로고 + 메뉴 + 웹앱 열기 / 좁은 화면(<768): 로고 + 메뉴 버튼(오른쪽 시트)
 */
export async function SiteHeader({ active }: { active?: "home" | "blog" }) {
  const t = await getTranslations("nav")

  const links = [
    { href: "/#features", label: t("features") },
    { href: "/#usecases", label: t("useCases") },
    { href: "/blog", label: t("blog"), current: active === "blog" },
    { href: "/#faq", label: t("faq") },
  ]

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="page flex h-[68px] items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-15 font-extrabold tracking-tight">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-code bg-primary text-primary-foreground">
            <ScanLine className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate">QR Scanner Pro</span>
        </Link>

        <nav className="ml-3 hidden gap-1 md:flex" aria-label={t("menu")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className="rounded-full px-3 py-2 text-15 font-semibold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild className="max-md:hidden">
            <Link href="/dashboard">{t("openWebApp")}</Link>
          </Button>
          <SiteMobileMenu
            links={[...links, { href: "/dashboard", label: t("openWebApp") }]}
            title={t("menu")}
            openLabel={t("openMenu")}
            closeLabel={t("closeMenu")}
          />
        </div>
      </div>
    </header>
  )
}

/** 공개 페이지 바닥글 (약관 링크는 실제 경로 /legal/*) */
export async function SiteFooter() {
  const t = await getTranslations()
  const col = (title: string, items: { href: string; label: string }[]) => (
    <div>
      <h2 className="text-15 font-bold">{title}</h2>
      <ul className="mt-3 space-y-2 text-15 text-muted-foreground">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="hover:text-foreground">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <footer className="mt-16 border-t">
      <div className="page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-15 font-extrabold">
            <ScanLine className="size-4" aria-hidden="true" />
            QR Scanner Pro
          </p>
          <p className="mt-3 text-15 text-muted-foreground">{t("footer.description")}</p>
        </div>
        {col(t("footer.product"), [
          { href: "/#features", label: t("nav.features") },
          { href: "/#usecases", label: t("nav.useCases") },
          { href: "/dashboard", label: t("footer.webApp") },
        ])}
        {col(t("footer.support"), [
          { href: "/#faq", label: t("nav.faq") },
          { href: "/blog", label: t("nav.blog") },
        ])}
        {col(t("footer.legal"), [
          { href: "/legal/privacy", label: t("footer.privacy") },
          { href: "/legal/terms", label: t("footer.terms") },
        ])}
      </div>
      <p className="page border-t py-6 text-13 text-muted-foreground">{t("footer.copyright")}</p>
    </footer>
  )
}
