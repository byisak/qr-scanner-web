import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * 꿀앱 버튼 규칙
 * - 모양: 전부 pill(rounded-full)
 * - 높이는 네 가지만: xl 50 / default 40 / chip 36 / sm 34. 아이콘 버튼은 정사각형 icon 40 / icon-sm 34
 * - default(주 버튼) = 먹색 배경 + 굵게, outline·secondary(보조) = 테두리만,
 *   destructive(위험) = 빨간 글자 + 테두리 (최종 확인 버튼도 같은 모양), ghost = 아이콘 버튼용
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-15 font-semibold transition-[color,background-color,border-color,box-shadow,transform,opacity] active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default: "bg-primary font-bold text-primary-foreground hover:bg-primary/90",
        destructive:
          "border border-destructive/40 bg-card text-destructive hover:border-destructive/70 hover:bg-destructive-soft focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-card text-foreground hover:bg-secondary",
        secondary:
          "border border-border bg-card text-foreground hover:bg-secondary",
        ghost:
          "text-foreground hover:bg-secondary",
        link: "h-auto! rounded-sm px-0! text-foreground underline underline-offset-4 decoration-1 hover:decoration-2",
      },
      size: {
        xl: "h-[50px] px-6",
        default: "h-10 px-4 has-[>svg]:px-3.5",
        chip: "h-9 px-4 has-[>svg]:px-3.5",
        sm: "h-[34px] gap-1.5 px-3 text-13 has-[>svg]:px-2.5",
        icon: "size-10",
        "icon-sm": "size-[34px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
