"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

// 토스트: 화면 아래 가운데, 한 문장. 색 배경(richColors) 없이 그래파이트 카드 + 아이콘으로만 구분.
// 오류만 아이콘을 빨강으로 (빨강은 경고·오류에만)
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4 text-destructive" />,
        error: <CircleAlert className="size-4 text-destructive" />,
        loading: <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "14px",
          "--width": "min(360px, calc(100vw - 32px))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast !gap-2.5 !rounded-field !border-border !bg-popover !px-4 !py-3 !text-15 !font-semibold !text-popover-foreground !shadow-soft",
          title: "!font-semibold",
          description: "!text-13 !font-normal !text-muted-foreground",
          actionButton:
            "!h-[34px] !rounded-full !bg-primary !px-3 !text-13 !font-bold !text-primary-foreground",
          cancelButton:
            "!h-[34px] !rounded-full !border !border-border !bg-card !px-3 !text-13 !font-semibold !text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
