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
import { Button } from "@/components/ui/button"
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('table.searchPlaceholder')}
              value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("code")?.setFilterValue(event.target.value)
              }
              className="w-full sm:max-w-sm pl-8"
            />
          </div>
          {selectedCount > 0 && onDeleteSelected && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('table.deleteSelected')} ({selectedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('table.deleteSelectedTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('table.deleteSelectedDesc', { count: selectedCount })}
                    <br />
                    <br />
                    {t('table.deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('table.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('table.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('table.totalScans')}: <span className="font-bold">{data.length}</span>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48"
                >
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <ScanLine className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{t('table.noData')}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {t('table.noDataDesc')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between py-4">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          {selectedCount > 0 && (
            <span className="mr-4 font-medium text-foreground">
              {selectedCount} {t('table.selected')}
            </span>
          )}
          {t('table.showingOf', {
            showing: table.getRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length
          })}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
          <div className="text-sm text-muted-foreground">
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
    </div>
  )
}
