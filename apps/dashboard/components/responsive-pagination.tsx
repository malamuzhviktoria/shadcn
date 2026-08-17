"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function getPageWindow(page: number, totalPages: number, size = 3): number[] {
  const half = Math.floor(size / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + size - 1)
  start = Math.max(1, end - size + 1)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

interface ResponsivePaginationProps {
  page: number
  totalPages: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  rowsLabel?: string
  className?: string
}

export function ResponsivePagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onPageChange,
  onPageSizeChange,
  rowsLabel = "Rows per page",
  className,
}: ResponsivePaginationProps) {
  const btn = "flex size-7 items-center justify-center rounded-md border border-input text-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
  const active = "bg-primary text-primary-foreground border-primary hover:bg-primary/90"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3",
        className,
      )}
    >
      {/* Left: rows-per-page */}
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          className="h-7 rounded-md border border-input bg-muted/50 px-2 text-xs"
        >
          {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{rowsLabel}</span>
      </div>

      {/* Right: navigation */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* First — hidden below @[460px] */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className={cn(btn, "hidden @[460px]:flex")}
          aria-label="First page"
        >
          <ChevronsLeft className="size-3.5" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={btn}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {/* Compact indicator — only visible below @[460px] */}
        <span className="inline-flex @[460px]:hidden whitespace-nowrap px-2 text-xs text-muted-foreground">
          {page} / {totalPages || 1}
        </span>

        {/* Numbered pages — hidden below @[460px] */}
        {getPageWindow(page, totalPages).map(n => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={cn(btn, "hidden @[460px]:flex", n === page ? active : "")}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={btn}
          aria-label="Next page"
        >
          <ChevronRight className="size-3.5" />
        </button>

        {/* Last — hidden below @[460px] */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className={cn(btn, "hidden @[460px]:flex")}
          aria-label="Last page"
        >
          <ChevronsRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
