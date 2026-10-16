"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { eul } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  /**
   * 되돌릴 수 없는 작업용 "이름 입력 확인". 주면 입력칸이 펼쳐지고,
   * 입력한 글자가 이 값과 정확히 같을 때만 확인 버튼이 눌린다. (안 주면 예전과 똑같이 동작)
   * (확인 버튼 글자는 기존 confirmText 그대로)
   */
  typeToConfirm?: string
  /** 입력칸 라벨을 바꾸고 싶을 때. 기본: "확인을 위해 X을(를) 입력해 주세요" (로케일별) */
  typeToConfirmLabel?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
  variant = "default",
  typeToConfirm,
  typeToConfirmLabel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/* 내용은 열릴 때마다 새로 그려지므로 입력 칸도 매번 비어서 시작한다 */}
        <ConfirmDialogBody
          title={title}
          description={description}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
          confirmText={confirmText}
          cancelText={cancelText}
          variant={variant}
          typeToConfirm={typeToConfirm}
          typeToConfirmLabel={typeToConfirmLabel}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ConfirmDialogBody({
  title,
  description,
  onConfirm,
  onOpenChange,
  confirmText,
  cancelText,
  variant,
  typeToConfirm,
  typeToConfirmLabel,
}: Omit<ConfirmDialogProps, "open">) {
  const t = useTranslations()
  const locale = useLocale()
  const inputId = React.useId()
  const [typed, setTyped] = React.useState("")
  const needsTyping = typeof typeToConfirm === "string" && typeToConfirm.length > 0
  const matched = !needsTyping || typed === typeToConfirm

  const confirmNow = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleConfirm = (e: React.MouseEvent) => {
    if (!matched) {
      e.preventDefault()
      return
    }
    confirmNow()
  }

  const label =
    typeToConfirmLabel ??
    (needsTyping
      ? t("common.typeToConfirm", { value: locale === "ko" ? eul(typeToConfirm) : typeToConfirm })
      : "")

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {needsTyping ? (
        <div className="grid gap-2">
          <label htmlFor={inputId} className="text-15 font-bold">
            {label}
          </label>
          <Input
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matched) {
                e.preventDefault()
                confirmNow()
              }
            }}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={typeToConfirm}
          />
        </div>
      ) : null}
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelText || t('common.cancel')}</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleConfirm}
          disabled={!matched}
          className={cn(variant === "destructive" && buttonVariants({ variant: "destructive" }))}
        >
          {confirmText || t('common.confirm')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}

// Hook for easier usage with async operations
interface UseConfirmDialogOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  typeToConfirm?: string
  typeToConfirmLabel?: string
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [options, setOptions] = React.useState<UseConfirmDialogOptions | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((opts: UseConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open && resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
    setIsOpen(false)
  }, [])

  const ConfirmDialogComponent = React.useMemo(() => {
    if (!options) return null
    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        typeToConfirm={options.typeToConfirm}
        typeToConfirmLabel={options.typeToConfirmLabel}
        onConfirm={handleConfirm}
      />
    )
  }, [isOpen, options, handleOpenChange, handleConfirm])

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
