"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ScanData = {
  id: number
  sessionId: string
  code: string
  scan_timestamp: number
  createdAt: string
}

export const columns: ColumnDef<ScanData>[] = [
  {
    id: "index",
    header: "번호",
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
          QR 코드
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
          스캔 시간
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("scan_timestamp") as number
      return (
        <div>
          {new Date(timestamp).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
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
          저장 시간
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string
      return (
        <div className="text-right">
          {new Date(createdAt).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          })}
        </div>
      )
    },
  },
]
