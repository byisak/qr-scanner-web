"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { useLocale } from "next-intl"

import { cn } from "@/lib/utils"

const OPTIONAL: Record<string, string> = { ko: "선택", en: "Optional", ja: "任意", zh: "可选", es: "Opcional" }

type ControlProps = {
  id: string
  "aria-invalid"?: true
  "aria-describedby"?: string
}

type FieldProps = {
  /** 보이는 이름 (label). 입력과 htmlFor 로 연결된다 */
  label: React.ReactNode
  /** 입력의 id. 주지 않으면 자동으로 만든다 */
  id?: string
  /** 입력 아래 빨간 오류 문구 (있으면 aria-invalid + aria-describedby 자동) */
  error?: React.ReactNode | false | null
  /** 입력 아래 회색 도움말 (오류가 있으면 오류가 대신 보임) */
  help?: React.ReactNode
  /** 라벨 옆 "선택"(로케일별) 표시. 문자열을 주면 그 글자로 */
  optional?: boolean | string
  /** 라벨 오른쪽 끝 글자 수 등 (예: "12/40") */
  counter?: React.ReactNode
  /** 칩 묶음처럼 입력이 여러 개면 group 으로: role="group" + aria-labelledby */
  group?: boolean
  className?: string
  /**
   * 입력 하나. 하나의 요소면 id·aria-invalid·aria-describedby 를 자동으로 넣는다.
   * 직접 넣고 싶으면 함수로: {(p) => <Input {...p} />}
   */
  children: React.ReactNode | ((control: ControlProps) => React.ReactNode)
}

/**
 * 입력칸 한 묶음: 라벨 → 입력 → (오류 | 도움말)
 *
 *   <Field label="이메일" error={errors.email} help="로그인할 때 써요">
 *     <Input type="email" value={email} onChange={...} />
 *   </Field>
 */
export function Field({ label, id, error, help, optional, counter, group = false, className, children }: FieldProps) {
  const locale = useLocale()
  const auto = React.useId()
  const controlId = id ?? `f${auto}`
  const labelId = `${controlId}-label`
  const msgId = `${controlId}-msg`
  const hasError = Boolean(error)
  const hasMsg = hasError || Boolean(help)

  const control: ControlProps = {
    id: controlId,
    ...(hasError ? { "aria-invalid": true as const } : {}),
    ...(hasMsg ? { "aria-describedby": msgId } : {}),
  }

  let content: React.ReactNode
  if (typeof children === "function") {
    content = children(control)
  } else if (!group && React.isValidElement<Record<string, unknown>>(children)) {
    const own = children.props
    content = React.cloneElement(children, {
      id: (own.id as string | undefined) ?? control.id,
      "aria-invalid": own["aria-invalid"] ?? control["aria-invalid"],
      "aria-describedby":
        [own["aria-describedby"] as string | undefined, control["aria-describedby"]].filter(Boolean).join(" ") || undefined,
    })
  } else {
    content = children
  }

  const head = (
    <>
      {label}
      {optional ? (
        <span className="ml-1.5 text-13 font-medium text-muted-foreground">
          {optional === true ? (OPTIONAL[locale] ?? OPTIONAL.en) : optional}
        </span>
      ) : null}
    </>
  )

  return (
    <div
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...(group ? { role: "group", "aria-labelledby": labelId } : {})}
    >
      <div className="flex items-baseline justify-between gap-3 text-15 font-bold">
        {group ? (
          <span id={labelId}>{head}</span>
        ) : (
          <label id={labelId} htmlFor={controlId}>
            {head}
          </label>
        )}
        {counter ? <small className="tabular text-13 font-medium text-muted-foreground">{counter}</small> : null}
      </div>
      {content}
      {hasError ? (
        <p id={msgId} role="alert" className="flex items-start gap-1.5 text-13 font-semibold text-destructive">
          <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : help ? (
        <p id={msgId} className="text-13 text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  )
}

/**
 * 제출했는데 오류가 있으면 첫 번째 잘못된 입력으로 포커스 이동.
 * 오류 상태를 그린 다음에 불러야 하므로 보통 requestAnimationFrame/useEffect 안에서 쓴다.
 *
 *   if (!valid) requestAnimationFrame(() => focusFirstInvalid(formRef.current))
 */
export function focusFirstInvalid(root?: ParentNode | null): boolean {
  const scope: ParentNode = root ?? (typeof document !== "undefined" ? document : (null as unknown as ParentNode))
  if (!scope) return false
  const el = scope.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (!el) return false
  el.focus()
  el.scrollIntoView?.({ block: "center", behavior: "smooth" })
  return true
}
