"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search, ScanLine } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"
import { formatDateTime, type DateTimeFormatOptions } from "@/components/scan-table-columns"

export interface CodeSummaryRow {
  code: string
  count: number
  first: number
  last: number
  // 같은 코드가 2초 안에 다시 찍힌 횟수 (실수로 두 번 찍었을 가능성)
  rapid: number
}

// 2초 안에 다시 찍히면 "빠른 재스캔"
export const RAPID_RESCAN_MS = 2000

/** 스캔 목록을 코드별로 묶는다 (횟수, 처음·마지막 시각, 빠른 재스캔 수) */
export function summarizeByCode(scans: { code: string; scan_timestamp: number }[]): CodeSummaryRow[] {
  const map = new Map<string, number[]>()
  for (const s of scans) {
    const list = map.get(s.code)
    if (list) list.push(s.scan_timestamp)
    else map.set(s.code, [s.scan_timestamp])
  }
  const rows: CodeSummaryRow[] = []
  for (const [code, times] of map) {
    times.sort((a, b) => a - b)
    let rapid = 0
    for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] < RAPID_RESCAN_MS) rapid++
    rows.push({ code, count: times.length, first: times[0], last: times[times.length - 1], rapid })
  }
  return rows
}

type SortKey = "count" | "recent"
const PAGE_SIZE = 25

export function CodeSummaryTable({
  rows,
  search,
  onSearchChange,
  formatOptions,
}: {
  rows: CodeSummaryRow[]
  search: string
  onSearchChange: (value: string) => void
  formatOptions?: DateTimeFormatOptions
}) {
  const t = useTranslations()
  const [sort, setSort] = React.useState<SortKey>("count")
  const [page, setPage] = React.useState(0)
  const searchId = React.useId()

  const visible = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? rows.filter((r) => r.code.toLowerCase().includes(q)) : [...rows]
    list.sort((a, b) => (sort === "count" ? b.count - a.count || b.last - a.last : b.last - a.last))
    return list
  }, [rows, search, sort])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageRows = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  React.useEffect(() => setPage(0), [search, sort])

  const fmt = (ts: number) =>
    formatOptions ? formatDateTime(new Date(ts), formatOptions.dateFormat, formatOptions.timeFormat) : new Date(ts).toLocaleString()

  const status = (r: CodeSummaryRow) => (
    <div className="flex flex-wrap gap-1.5">
      {r.count > 1 && <Badge variant="secondary">{t("summary.duplicate")}</Badge>}
      {r.rapid > 0 && <Badge variant="destructive">{t("summary.rapid", { count: r.rapid })}</Badge>}
    </div>
  )

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <label htmlFor={searchId} className="sr-only">{t("table.searchLabel")}</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={searchId}
            placeholder={t("table.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <Segmented<SortKey>
          aria-label={t("summary.sort")}
          value={sort}
          onValueChange={setSort}
          options={[
            { value: "count", label: t("summary.sortCount") },
            { value: "recent", label: t("summary.sortRecent") },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        search ? (
          <Empty
            icon={<Search />}
            title={t("table.noResults")}
            description={t("table.noResultsDesc")}
            action={<Button variant="outline" onClick={() => onSearchChange("")}>{t("table.clearSearch")}</Button>}
          />
        ) : (
          <Empty icon={<ScanLine />} title={t("table.noData")} description={t("table.noDataDesc")} />
        )
      ) : (
        <>
          {/* 좁은 화면: 카드형 */}
          <ul className="grid gap-2 sm:hidden">
            {pageRows.map((r) => (
              <li key={r.code} className="flex items-start gap-3 rounded-field border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="break-all font-mono">{r.code}</div>
                  <div className="mt-1 text-13 text-muted-foreground tabular">{t("summary.lastAt", { time: fmt(r.last) })}</div>
                  <div className="mt-1.5">{status(r)}</div>
                </div>
                <span className="type-h3 tabular">×{r.count}</span>
              </li>
            ))}
          </ul>

          <div className="hidden min-w-0 sm:block">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.code")}</TableHead>
                  <TableHead className="text-right">{t("summary.count")}</TableHead>
                  <TableHead>{t("summary.first")}</TableHead>
                  <TableHead>{t("summary.last")}</TableHead>
                  <TableHead>{t("summary.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell><div className="max-w-[28rem] break-all font-mono">{r.code}</div></TableCell>
                    <TableCell className="text-right font-semibold tabular">{r.count}</TableCell>
                    <TableCell className="whitespace-nowrap tabular">{fmt(r.first)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular">{fmt(r.last)}</TableCell>
                    <TableCell>{status(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-13 text-muted-foreground tabular">
              {t("summary.codesOf", { codes: visible.length, scans: visible.reduce((n, r) => n + r.count, 0) })}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center justify-end gap-2">
                <span className="tabular text-13 text-muted-foreground">{t("table.page")} {current + 1} / {pageCount}</span>
                <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>{t("table.previous")}</Button>
                <Button variant="outline" size="sm" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>{t("table.next")}</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
