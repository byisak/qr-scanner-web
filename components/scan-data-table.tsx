"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Trash2, ScanLine, Search, ArrowUp } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useSettings } from '@/contexts/settings-context'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteSelected?: (ids: number[]) => void
  // 방금 들어온 스캔 id: 행을 잠깐 강조한다
  highlightIds?: ReadonlySet<number>
  // 스캔이 하나도 없을 때 보여 줄 안내 (없으면 기본 빈 화면)
  emptyState?: React.ReactNode
}

const DEFAULT_SORTING: SortingState = [{ id: "scan_timestamp", desc: true }]

export function ScanDataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  onDeleteSelected,
  highlightIds,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations()
  const { settings } = useSettings()
  const [sorting, setSorting] = React.useState<SortingState>(DEFAULT_SORTING)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // 새 스캔이 와도 보던 페이지를 유지한다 (대신 "맨 위로" 띠를 띄운다)
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: settings.tableRowsPerPage,
      },
    },
  })

  // 설정이 변경되면 페이지 크기 업데이트
  React.useEffect(() => {
    table.setPageSize(settings.tableRowsPerPage)
  }, [settings.tableRowsPerPage, table])

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleDeleteSelected = () => {
    const ids = selectedRows.map((row) => row.original.id)
    onDeleteSelected?.(ids)
    setRowSelection({})
    setDeleteDialogOpen(false)
  }

  const searchValue = (table.getColumn("code")?.getFilterValue() as string) ?? ""
  const rows = table.getRowModel().rows
  const searchId = React.useId()

  // 새 스캔이 들어왔는데 지금 화면(다른 페이지·정렬·검색)에서 안 보이면 "맨 위로" 띠를 띄운다
  const pageIndex = table.getState().pagination.pageIndex
  const atTop = pageIndex === 0 && !searchValue &&
    sorting.length === 1 && sorting[0].id === "scan_timestamp" && sorting[0].desc
  const [unseen, setUnseen] = React.useState(0)
  const prevLength = React.useRef(data.length)
  React.useEffect(() => {
    const added = data.length - prevLength.current
    prevLength.current = data.length
    if (added > 0 && !atTop) setUnseen((n) => n + added)
  }, [data.length, atTop])
  React.useEffect(() => {
    if (atTop) setUnseen(0)
  }, [atTop])

  // 삭제·검색으로 페이지 수가 줄면 마지막 페이지로 당긴다 (자동 초기화를 껐으므로)
  const pageCount = table.getPageCount()
  React.useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) table.setPageIndex(Math.max(0, pageCount - 1))
  }, [pageIndex, pageCount, table])

  const goToTop = () => {
    table.getColumn("code")?.setFilterValue("")
    setSorting(DEFAULT_SORTING)
    table.setPageIndex(0)
    setUnseen(0)
  }

  // 좁은 화면 카드형 목록에서 쓸 셀 (열 id로 찾는다)
  const cellOf = (row: (typeof rows)[number], id: string) => {
    const cell = row.getVisibleCells().find((c) => c.column.id === id)
    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null
  }

  return (
    <div className="grid min-w-0 gap-4">
      {/* 스캔이 하나도 없으면 검색·합계 줄은 숨기고 안내만 보여 준다 */}
      {data.length > 0 && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <label htmlFor={searchId} className="sr-only">{t('table.searchLabel')}</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              placeholder={t('table.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => {
                table.getColumn("code")?.setFilterValue(event.target.value)
                table.setPageIndex(0)
              }}
              className="w-full pl-10"
            />
          </div>
          {selectedCount > 0 && onDeleteSelected && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="self-start sm:self-auto">
                  <Trash2 aria-hidden="true" />
                  {t('table.deleteSelected')} <span className="tabular">({selectedCount})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('table.deleteSelectedTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('table.deleteSelectedDesc', { count: selectedCount })} {t('table.deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('table.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    {t('table.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="text-13 text-muted-foreground">
          {t('table.totalScans')}: <span className="tabular font-bold text-foreground">{data.length}</span>
        </div>
      </div>
      )}

      {unseen > 0 && (
        <Button variant="default" size="sm" className="justify-self-center rounded-full" onClick={goToTop}>
          <ArrowUp aria-hidden="true" />
          {t('table.newScansJump', { count: unseen })}
        </Button>
      )}

      {rows.length === 0 ? (
        searchValue ? (
          <Empty
            icon={<Search />}
            title={t('table.noResults')}
            description={t('table.noResultsDesc')}
            action={
              <Button variant="outline" onClick={() => table.getColumn("code")?.setFilterValue("")}>
                {t('table.clearSearch')}
              </Button>
            }
          />
        ) : (
          emptyState ?? <Empty icon={<ScanLine />} title={t('table.noData')} description={t('table.noDataDesc')} />
        )
      ) : (
        <>
          {/* 좁은 화면: 표 대신 카드형 목록 (코드 · 시간 · 삭제) */}
          <ul className="grid gap-2 sm:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`flex items-start gap-3 rounded-field border px-3 py-2.5 ${highlightIds?.has(row.original.id) ? "scan-new" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  {cellOf(row, "code")}
                  <div className="mt-1 flex items-center gap-2 text-13 text-muted-foreground">
                    <span className="tabular">#{cellOf(row, "index")}</span>
                    {cellOf(row, "scan_timestamp")}
                  </div>
                </div>
                {cellOf(row, "actions")}
              </li>
            ))}
          </ul>

          {/* 넓은 화면: 표. 그래도 좁으면 표 안에서만 가로로 넘긴다 (Table 컨테이너가 overflow-auto) */}
          <div className="hidden min-w-0 sm:block">
            <Table className="min-w-[520px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted()
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={highlightIds?.has(row.original.id) ? "scan-new" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 text-13 text-muted-foreground sm:order-1">
              {selectedCount > 0 && (
                <span className="tabular mr-4 font-semibold text-foreground">
                  {selectedCount} {t('table.selected')}
                </span>
              )}
              <span className="tabular">
                {t('table.showingOf', {
                  showing: rows.length,
                  total: table.getFilteredRowModel().rows.length
                })}
              </span>
            </div>
            <div className="order-1 flex items-center justify-between gap-2 sm:order-2 sm:justify-end">
              <div className="tabular text-13 text-muted-foreground">
                {t('table.page')} {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {t('table.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {t('table.next')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
