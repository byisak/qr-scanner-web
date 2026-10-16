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
import { Trash2, ScanLine, Search } from "lucide-react"
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
}

export function ScanDataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  onDeleteSelected,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations()
  const { settings } = useSettings()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "scan_timestamp", desc: true }
  ])
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

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <label htmlFor={searchId} className="sr-only">{t('table.searchLabel')}</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              placeholder={t('table.searchPlaceholder')}
              value={searchValue}
              onChange={(event) =>
                table.getColumn("code")?.setFilterValue(event.target.value)
              }
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
          <Empty icon={<ScanLine />} title={t('table.noData')} description={t('table.noDataDesc')} />
        )
      ) : (
        <>
          {/* 좁은 화면에서는 표 안에서만 가로로 넘긴다 (Table 컨테이너가 overflow-auto) */}
          <div className="min-w-0">
            <Table className="min-w-[600px]">
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
