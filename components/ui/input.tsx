import * as React from "react"

import { cn } from "@/lib/utils"

// 입력칸: 높이 40, 반경 14, 포커스 링이 분명히 보이게. 오류는 aria-invalid 로 빨간 테두리
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-faint selection:bg-foreground selection:text-background border-input bg-card h-10 w-full min-w-0 rounded-field border px-3.5 py-1 text-15 transition-[color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-13 file:font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
