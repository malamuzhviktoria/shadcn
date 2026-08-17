"use client"

import * as React from "react"
import { X, SlidersHorizontal, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Filters trigger button ───────────────────────────────────────────────────

export function FiltersButton({
  activeCount,
  onClick,
}: {
  activeCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap"
    >
      <SlidersHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
      Filters
      {activeCount > 0 && (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold leading-none text-background">
          {activeCount}
        </span>
      )}
    </button>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────

export function FilterSheetSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

// ── Multi-select checkbox list ───────────────────────────────────────────────

interface CheckboxOption {
  value: string
  label: string
  count?: number
}

export function FilterSheetCheckboxList({
  options,
  value,
  onChange,
  searchable,
  searchPlaceholder,
}: {
  options: CheckboxOption[]
  value: string[]
  onChange: (v: string[]) => void
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const [q, setQ] = React.useState("")
  const filtered =
    searchable && q
      ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
      : options

  return (
    <div className="space-y-2.5">
      {searchable && (
        <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted/50 px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No results</p>
        ) : (
          filtered.map(opt => {
            const checked = value.includes(opt.value)
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-2 text-sm transition-colors hover:bg-accent"
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                  aria-hidden
                >
                  {checked && <Check className="size-2.5" />}
                </div>
                <span className="flex-1">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {opt.count}
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? value.filter(v => v !== opt.value)
                        : [...value, opt.value]
                    )
                  }
                  className="sr-only"
                />
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Single-select radio list ─────────────────────────────────────────────────

interface RadioOption {
  value: string
  label: string
}

export function FilterSheetRadioList({
  options,
  value,
  onChange,
  allLabel,
  searchable,
  searchPlaceholder,
}: {
  options: RadioOption[]
  value: string
  onChange: (v: string) => void
  allLabel?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const [q, setQ] = React.useState("")
  const filtered =
    searchable && q
      ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
      : options

  return (
    <div className="space-y-2.5">
      {searchable && (
        <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted/50 px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {!q && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-2 text-sm transition-colors hover:bg-accent">
            <div
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                !value ? "border-primary bg-primary" : "border-input"
              )}
              aria-hidden
            >
              {!value && <div className="size-2 rounded-full bg-primary-foreground" />}
            </div>
            <span className="flex-1 text-muted-foreground">{allLabel ?? "All"}</span>
            <input
              type="radio"
              checked={!value}
              onChange={() => onChange("")}
              className="sr-only"
            />
          </label>
        )}
        {filtered.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No results</p>
        ) : (
          filtered.map(opt => {
            const checked = value === opt.value
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-2 text-sm transition-colors hover:bg-accent"
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    checked ? "border-primary bg-primary" : "border-input"
                  )}
                  aria-hidden
                >
                  {checked && <div className="size-2 rounded-full bg-primary-foreground" />}
                </div>
                <span className="flex-1">{opt.label}</span>
                <input
                  type="radio"
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                  className="sr-only"
                />
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Date range ────────────────────────────────────────────────────────────────

export function FilterSheetDateRange({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">From</label>
        <input
          type="date"
          value={from}
          onChange={e => onChange(e.target.value, to)}
          className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">To</label>
        <input
          type="date"
          value={to}
          onChange={e => onChange(from, e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  )
}

// ── Main sheet ────────────────────────────────────────────────────────────────

export function MobileFilterSheet({
  open,
  onClose,
  onReset,
  activeCount,
  children,
}: {
  open: boolean
  onClose: () => void
  onReset: () => void
  activeCount: number
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div className="relative flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold leading-none text-background">
                {activeCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close filters"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        {/* Footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
