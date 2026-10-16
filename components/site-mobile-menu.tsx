"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const noop = () => () => {}

type MenuLink = { href: string; label: string; current?: boolean }

// 좁은 화면(<768) 메뉴: 오른쪽 시트
export function SiteMobileMenu({
  links,
  title,
  openLabel,
  closeLabel,
}: {
  links: MenuLink[]
  title: string
  openLabel: string
  closeLabel: string
}) {
  const [open, setOpen] = useState(false)
  // Radix 의 자동 id(aria-controls)가 서버/브라우저에서 달라지는 경고를 피하려고, 시트는 브라우저에서만 붙인다
  const mounted = useSyncExternalStore(noop, () => true, () => false)

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="md:hidden" aria-label={openLabel}>
        <Menu aria-hidden="true" />
      </Button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={openLabel}>
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-6" closeLabel={closeLabel} aria-describedby={undefined}>
        <SheetTitle className="type-h3">{title}</SheetTitle>
        <nav aria-label={title} className="-mx-3 mt-2 grid gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              onClick={() => setOpen(false)}
              className="rounded-field px-3 py-3 text-15 font-semibold outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
