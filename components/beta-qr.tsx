'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'

// 테스터 초대 페이지 주소를 QR과 복사 버튼으로 보여 준다 (PC에서 열었을 때 폰으로 옮기기용)
export function BetaShare({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="rounded-field border bg-white p-3">
        <QRCodeSVG value={url} size={120} aria-label="이 페이지로 가는 QR 코드" />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="type-body text-muted-foreground">휴대폰 카메라로 QR을 찍거나 주소를 보내 주세요</p>
        <p className="mt-1 break-all font-mono text-13">{url}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? '복사했어요' : '주소 복사'}
        </Button>
      </div>
    </div>
  )
}
