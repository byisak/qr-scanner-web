import * as React from "react"

import { cn } from "@/lib/utils"

// 여러 줄 입력칸: 입력칸과 같은 반경 14·포커스 링
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-faint border-input bg-card flex field-sizing-content min-h-24 w-full rounded-field border px-3.5 py-2.5 text-15 leading-relaxed transition-[color,border-color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
