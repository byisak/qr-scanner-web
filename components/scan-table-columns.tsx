"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type ScanData = {
  id: number
  sessionId: string
  code: string
  scan_timestamp: number
  createdAt: string
}

// 삭제 버튼 셀 컴포넌트
function DeleteActionCell({
  scanId,
  code,
  onDelete
}: {
  scanId: number
  code: string
  onDelete?: (id: number) => void
}) {
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    onDelete?.(scanId)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>스캔 데이터 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            이 스캔 데이터를 삭제하시겠습니까?
            <br />
            <span className="font-mono font-medium text-foreground">{code}</span>
            <br />
            <br />
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const createColumns = (onDelete?: (id: number) => void): ColumnDef<ScanData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="전체 선택"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="행 선택"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const scanId = row.original.id
      const code = row.original.code
      return (
        <div className="text-right">
          <DeleteActionCell scanId={scanId} code={code} onDelete={onDelete} />
        </div>
      )
    },
  },
]

// 읽기 전용 컬럼 (비회원용 - 선택/삭제 없음)
export const createReadOnlyColumns = (): ColumnDef<ScanData>[] => [
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

// 기존 columns 유지 (하위 호환성)
export const columns = createColumns()
