"use client"

import { useState, useRef, useEffect } from "react"
import { Check, CirclePlus } from "lucide-react"
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
}: {
  label: string
  options: FilterOption[]
  value: string
  onChange: (v: string) => void
  align?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  const selected = options.find(o => o.value === value)

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
            <span className="max-w-[120px] truncate">{selected.label}</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={`Filter by ${label}`}
          className={cn(
            "absolute top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-border bg-background shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="max-h-[280px] overflow-y-auto">
            <div className="p-1">
              {options.map(opt => {
                const isSelected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { onChange(isSelected ? "" : opt.value); setOpen(false) }}
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
              })}
            </div>
          </div>
          {value && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false) }}
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
}: {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (v: string[]) => void
  align?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          value.length > 0
            ? "border-border bg-background text-foreground hover:bg-accent"
            : "border-dashed border-input bg-background text-foreground hover:bg-accent"
        )}
      >
        <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
        {label}
        {value.length > 0 && (
          <>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            {options.filter(o => value.includes(o.value)).map(o => (
              <span key={o.value}
                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                {o.label}
              </span>
            ))}
          </>
        )}
      </button>

      {open && (
        <div
          role="group"
          aria-label={`Filter by ${label}`}
          className={cn(
            "absolute top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-border bg-background shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="max-h-[280px] overflow-y-auto">
            <div className="p-1">
              {options.map(opt => {
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
              })}
            </div>
          </div>
          {value.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange([]); setOpen(false) }}
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
