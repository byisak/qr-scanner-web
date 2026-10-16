import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// globals.css 에 추가한 꿀앱 토큰(text-13/15, rounded-card/field/code, shadow-soft, type-*)을
// tailwind-merge 가 알게 해서 cn() 이 글자색·크기를 잘못 지우지 않게 한다.
const twMerge = extendTailwindMerge<"type">({
  extend: {
    theme: {
      text: ["13", "15"],
      radius: ["card", "field", "code"],
      shadow: ["soft"],
    },
    classGroups: {
      type: ["type-display", "type-h1", "type-h2", "type-h3", "type-lead", "type-body"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
