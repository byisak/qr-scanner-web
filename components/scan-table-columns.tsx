"use client"

import { useState } from "react"
import { Column, ColumnDef, Row, Table } from "@tanstack/react-table"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button, buttonVariants } from "@/components/ui/button"
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

// 날짜/시간 형식에 따른 포맷팅 함수
export function formatDateTime(
  date: Date,
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" = "YYYY-MM-DD",
  timeFormat: "24h" | "12h" = "24h"
): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  let dateStr: string
  switch (dateFormat) {
    case "DD/MM/YYYY":
      dateStr = `${day}/${month}/${year}`
      break
    case "MM/DD/YYYY":
      dateStr = `${month}/${day}/${year}`
      break
    default:
      dateStr = `${year}-${month}-${day}`
  }

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  let timeStr: string
  if (timeFormat === "12h") {
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    timeStr = `${hours}:${minutes}:${seconds} ${ampm}`
  } else {
    timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
  }

  return `${dateStr} ${timeStr}`
}

export interface DateTimeFormatOptions {
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY"
  timeFormat: "24h" | "12h"
}

// 표 머리글·체크박스 이름은 next-intl 로 (컬럼 정의 함수는 훅을 쓸 수 없어 작은 컴포넌트로 감싼다)
type TableKey = "number" | "code" | "scanTime"

function HeaderLabel({ k }: { k: TableKey }) {
  const t = useTranslations("table")
  return <>{t(k)}</>
}

function SortHeader({ column, k }: { column: Column<ScanData, unknown>; k: TableKey }) {
  const t = useTranslations("table")
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2.5"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {t(k)}
      <ArrowUpDown aria-hidden="true" />
    </Button>
  )
}

function SelectAllCheckbox({ table }: { table: Table<ScanData> }) {
  const t = useTranslations("table")
  return (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label={t("selectAll")}
    />
  )
}

function SelectRowCheckbox({ row }: { row: Row<ScanData> }) {
  const t = useTranslations("table")
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={`${t("selectRow")} ${row.index + 1}`}
    />
  )
}

function DateCell({ value, formatOptions, className }: { value: number | string; formatOptions?: DateTimeFormatOptions; className?: string }) {
  return (
    <div className={`tabular whitespace-nowrap ${className ?? ""}`}>
      {formatOptions
        ? formatDateTime(new Date(value), formatOptions.dateFormat, formatOptions.timeFormat)
        : new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      }
    </div>
  )
}

// 삭제 버튼 셀 컴포넌트 (스캔 1건 삭제 = 일반 확인)
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
  const t = useTranslations("table")

  const handleDelete = () => {
    onDelete?.(scanId)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          aria-label={t("deleteScanLabel")}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteScanTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteScanDesc")} {t("deleteWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="break-all rounded-code bg-secondary px-3 py-2 font-mono text-13 text-foreground">{code}</p>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className={buttonVariants({ variant: "destructive" })}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const indexColumn: ColumnDef<ScanData> = {
  id: "index",
  header: () => <HeaderLabel k="number" />,
  cell: ({ row }) => {
    // 들어온 순서 (첫 스캔이 1). 페이지가 data를 들어온 순서로 넘겨 준다
    return <span className="tabular font-medium">{row.index + 1}</span>
  },
}

const codeColumn: ColumnDef<ScanData> = {
  accessorKey: "code",
  header: ({ column }) => <SortHeader column={column} k="code" />,
  cell: ({ row }) => {
    return <div className="max-w-[32rem] break-all font-mono sm:min-w-[13rem]">{row.getValue("code")}</div>
  },
}

const scanTimeColumn = (formatOptions?: DateTimeFormatOptions): ColumnDef<ScanData> => ({
  accessorKey: "scan_timestamp",
  header: ({ column }) => <SortHeader column={column} k="scanTime" />,
  cell: ({ row }) => <DateCell value={row.getValue("scan_timestamp") as number} formatOptions={formatOptions} />,
})

export const createColumns = (
  onDelete?: (id: number) => void,
  formatOptions?: DateTimeFormatOptions
): ColumnDef<ScanData>[] => [
  {
    id: "select",
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  indexColumn,
  codeColumn,
  scanTimeColumn(formatOptions),
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
export const createReadOnlyColumns = (formatOptions?: DateTimeFormatOptions): ColumnDef<ScanData>[] => [
  indexColumn,
  codeColumn,
  scanTimeColumn(formatOptions),
]

// 기존 columns 유지 (하위 호환성)
export const columns = createColumns()
