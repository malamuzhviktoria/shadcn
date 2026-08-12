"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, Check, CirclePlus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type FilterOption = {
  value: string
  label: string
  sublabel?: string
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  align = "left",
  searchable,
  searchPlaceholder = "Search…",
  searchEmptyMessage = "No results found",
}: {
  label: string
  options: FilterOption[]
  value: string
  onChange: (v: string) => void
  align?: "left" | "right"
  searchable?: boolean
  searchPlaceholder?: string
  searchEmptyMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchQuery("")
      }
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  const selected = options.find(o => o.value === value)
  const q = searchQuery.trim().toLowerCase()
  const visibleOptions = searchable && q
    ? options.filter(o =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
    : options

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          value
            ? "border-border bg-background text-foreground hover:bg-accent"
            : "border-dashed border-input bg-background text-foreground hover:bg-accent"
        )}
      >
        <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
        {label}
        {selected && (
          <>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground max-w-[120px] truncate">{selected.label}</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={`Filter by ${label}`}
          className={cn(
            "absolute top-full z-20 mt-1.5 min-w-[220px] rounded-xl border border-border bg-background shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {searchable && (
            <div className="p-2 pb-1">
              <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted/50 px-2.5">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          )}
          <div className={cn("overflow-y-auto", searchable ? "max-h-[240px]" : "max-h-[280px]")}>
            <div className="p-1">
              {visibleOptions.length === 0 ? (
                <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                  {searchEmptyMessage}
                </div>
              ) : (
                visibleOptions.map(opt => {
                  const isSelected = value === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { onChange(isSelected ? "" : opt.value); setOpen(false); setSearchQuery("") }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent"
                    >
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        )}
                        aria-hidden
                      >
                        {isSelected && <Check className="size-2.5" />}
                      </div>
                      <span className="flex-1 whitespace-nowrap">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{opt.sublabel}</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          {value && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); setSearchQuery("") }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Clear filter
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function MultiFilterDropdown({
  label,
  options,
  value,
  onChange,
  align = "left",
  searchable,
  searchPlaceholder = "Search…",
  searchEmptyMessage = "No results found",
}: {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (v: string[]) => void
  align?: "left" | "right"
  searchable?: boolean
  searchPlaceholder?: string
  searchEmptyMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchQuery("")
      }
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const q = searchQuery.trim().toLowerCase()
  const visibleOptions = searchable && q
    ? options.filter(o =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
    : options

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex h-9 max-w-[220px] items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          value.length > 0
            ? "border-border bg-background text-foreground hover:bg-accent"
            : "border-dashed border-input bg-background text-foreground hover:bg-accent"
        )}
      >
        <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="shrink-0 whitespace-nowrap">{label}</span>
        {value.length > 0 && (
          <>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {options.filter(o => value.includes(o.value)).map(o => (
                <span
                  key={o.value}
                  className="shrink-0 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground whitespace-nowrap"
                >
                  {o.label}
                </span>
              ))}
            </div>
          </>
        )}
      </button>

      {open && (
        <div
          role="group"
          aria-label={`Filter by ${label}`}
          className={cn(
            "absolute top-full z-20 mt-1.5 min-w-[220px] rounded-xl border border-border bg-background shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {searchable && (
            <div className="p-2 pb-1">
              <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted/50 px-2.5">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          )}
          <div className={cn("overflow-y-auto", searchable ? "max-h-[240px]" : "max-h-[280px]")}>
            <div className="p-1">
              {visibleOptions.length === 0 ? (
                <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                  {searchEmptyMessage}
                </div>
              ) : (
                visibleOptions.map(opt => {
                  const checked = value.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        )}
                        aria-hidden
                      >
                        {checked && <Check className="size-2.5" />}
                      </div>
                      <span className="flex-1 whitespace-nowrap">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{opt.sublabel}</span>
                      )}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.value)}
                        aria-label={`Filter by ${opt.label}`}
                        className="sr-only"
                      />
                    </label>
                  )
                })
              )}
            </div>
          </div>
          {value.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange([]); setOpen(false); setSearchQuery("") }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Clear filter
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string): string {
  if (!d) return ""
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${parseInt(d.slice(8))} ${months[parseInt(d.slice(5, 7)) - 1]}`
}

function DateInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <div className={cn(
        "flex h-9 items-center justify-between rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover",
        value ? "text-foreground" : "text-muted-foreground",
      )}>
        <span className="truncate">{value ? fmtDate(value) : (placeholder ?? "Select date")}</span>
        <Calendar className="ml-2 size-4 shrink-0 text-foreground/50" />
      </div>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}

export function DateRangeFilter({ from, to, onChange }: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [])

  const hasValue = !!(from || to)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          hasValue
            ? "border-border bg-background text-foreground hover:bg-accent"
            : "border-dashed border-input bg-background text-foreground hover:bg-accent",
        )}
      >
        <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
        Date range
        {hasValue && (
          <>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            <span className="max-w-[160px] truncate text-sm">
              {from ? fmtDate(from) : "…"} – {to ? fmtDate(to) : "…"}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-80 rounded-xl border border-border bg-background shadow-lg">
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">From</span>
              <DateInput value={from} onChange={v => onChange(v, to)} placeholder="Select date" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">To</span>
              <DateInput value={to} onChange={v => onChange(from, v)} placeholder="Select date" />
            </div>
          </div>
          {hasValue && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange("", ""); setOpen(false) }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Clear filter
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
