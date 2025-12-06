"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations, useLocale } from "next-intl"

export type ScanData = {
  id: number
  sessionId: string
  code: string
  scan_timestamp: number
  createdAt: string
}

export const useColumns = (): ColumnDef<ScanData>[] => {
  const t = useTranslations('table')
  const locale = useLocale()

  return [
    {
      id: "index",
      header: t('number'),
      cell: ({ row }) => {
        return <div className="font-medium">{row.index + 1}</div>
      },
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('qrCode')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="font-mono">{row.getValue("code")}</div>
      },
    },
    {
      accessorKey: "scan_timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('scanTime')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("scan_timestamp") as number
        return (
          <div>
            {new Date(timestamp).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
              timeZone: locale === 'ko' ? 'Asia/Seoul' : 'UTC',
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('saveTime')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string
        return (
          <div className="text-right">
            {new Date(createdAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
              timeZone: locale === 'ko' ? 'Asia/Seoul' : 'UTC',
            })}
          </div>
        )
      },
    },
  ]
}

// Keep the old columns export for backward compatibility
export const columns: ColumnDef<ScanData>[] = []
