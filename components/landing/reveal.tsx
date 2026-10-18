"use client"

import * as React from "react"

/**
 * 화면에 들어오면 떠오르는 상자. stagger 면 자식들이 style --i 순서대로 차례로.
 * 한 번 보이면 다시 숨기지 않는다. 움직임 줄이기·JS 없음이면 CSS 가 처음부터 보이게 둔다 (globals.css .reveal)
 */
export function Reveal({
  as: Tag = "div",
  stagger = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "ul" | "section" | "dl"; stagger?: boolean }) {
  const ref = React.useRef<HTMLElement>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView])

  const cls = [stagger ? "reveal-stagger" : "reveal", inView ? "is-in" : "", className].filter(Boolean).join(" ")
  const Comp = Tag as React.ElementType
  return (
    <Comp ref={ref} className={cls} {...props}>
      {children}
    </Comp>
  )
}
