import { cn } from "@/lib/utils"

// 불러오는 동안 자리 표시 (스피너·"로딩 중..." 글자 대신). 모양은 실제 내용과 같은 크기·반경으로
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("bg-secondary animate-pulse rounded-field motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
