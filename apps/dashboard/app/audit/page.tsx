"use client"

import { useState, useMemo, useEffect } from "react"
import {
  ChevronDown, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw, AlertCircle,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FilterDropdown, DateRangeFilter } from "@/components/filter-dropdown"
import { FiltersButton, FilterSheetSection, FilterSheetCheckboxList, FilterSheetRadioList, FilterSheetDateRange, MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { AlertBox } from "@/components/modal-alert"

// ── Types ─────────────────────────────────────────────────────────────────────

type ChangeType =
  | "hour-adjustment"
  | "pay-rate-added"
  | "pay-rate-updated"
  | "pay-rate-deleted"
  | "holiday-hours-updated"
  | "holiday-hours-deleted"
  | "minimum-wage-updated"

type DemoState = "populated" | "loading" | "empty" | "error"

interface AuditRecord {
  id: string
  timestamp: string
  changedBy: string
  changedByRole: string
  employeeName: string | null
  employeeId: string | null
  siteName: string | null
  siteId: string | null
  siteAreaId: string | null
  changeType: ChangeType
  originalValue: string
  newValue: string
  reason: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────


function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}
const HOA_AREA_ID = "a1"
const HOA_AREA_NAME = "North Area"

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; variant: "info" | "success" | "danger" | "purple" }> = {
  "hour-adjustment":       { label: "Hour adjustment",       variant: "info"    },
  "pay-rate-added":        { label: "Pay rate added",        variant: "success" },
  "pay-rate-updated":      { label: "Pay rate updated",      variant: "purple"  },
  "pay-rate-deleted":      { label: "Pay rate deleted",      variant: "danger"  },
  "holiday-hours-updated": { label: "Holiday hours updated", variant: "purple"  },
  "holiday-hours-deleted": { label: "Holiday hours deleted", variant: "danger"  },
  "minimum-wage-updated":  { label: "Minimum wage updated",  variant: "purple"  },
}

// ── Sample Data ───────────────────────────────────────────────────────────────

const ALL_RECORDS: AuditRecord[] = [
  {
    id: "at-001",
    timestamp: "2026-08-05T14:32:00",
    changedBy: "Sarah Whitmore",
    changedByRole: "Head of Area",
    employeeName: "James Mitchell",
    employeeId: "e1",
    siteName: "Northgate Office Park",
    siteId: "s1",
    siteAreaId: "a1",
    changeType: "hour-adjustment",
    originalValue: "Clock-in 06:10 · Clock-out 13:45 (7h 35m)",
    newValue: "Clock-in 06:00 · Clock-out 14:00 (8h 00m)",
    reason: "Employee reported that their badge failed to register the correct clock-in time at the start of the shift.",
  },
  {
    id: "at-002",
    timestamp: "2026-08-04T09:15:00",
    changedBy: "Marcus Reid",
    changedByRole: "Head of Area",
    employeeName: "Sarah Okonkwo",
    employeeId: "e2",
    siteName: "Riverside Business Hub",
    siteId: "s3",
    siteAreaId: "a2",
    changeType: "hour-adjustment",
    originalValue: "Clock-in 07:00 · Clock-out 15:30 (8h 30m)",
    newValue: "Clock-in 07:00 · Clock-out 15:00 (8h 00m)",
    reason: "Clock-out time was corrected after the site manager confirmed the employee remained on site beyond the originally recorded time.",
  },
  {
    id: "at-003",
    timestamp: "2026-08-03T10:00:00",
    changedBy: "Oliver Pemberton",
    changedByRole: "Head Office",
    employeeName: "Luke Adams",
    employeeId: "e7",
    siteName: "South Park Complex",
    siteId: "s4",
    siteAreaId: "a2",
    changeType: "pay-rate-updated",
    originalValue: "Supervisor · £13.00/hr",
    newValue: "Supervisor · £13.50/hr",
    reason: null,
  },
  {
    id: "at-004",
    timestamp: "2026-08-02T08:30:00",
    changedBy: "Sarah Whitmore",
    changedByRole: "Head of Area",
    employeeName: "Emma Clarke",
    employeeId: "e8",
    siteName: "City Centre Tower",
    siteId: "s2",
    siteAreaId: "a1",
    changeType: "hour-adjustment",
    originalValue: "Clock-in 08:00 · Clock-out 16:15 (8h 15m)",
    newValue: "Clock-in 08:00 · Clock-out 16:00 (8h 00m)",
    reason: "Rounding to contracted hours",
  },
  {
    id: "at-005",
    timestamp: "2026-08-01T11:20:00",
    changedBy: "Christine Lawson",
    changedByRole: "Head Office",
    employeeName: "James Mitchell",
    employeeId: "e1",
    siteName: "Northgate Office Park",
    siteId: "s1",
    siteAreaId: "a1",
    changeType: "pay-rate-updated",
    originalValue: "Supervisor · £13.50/hr",
    newValue: "Supervisor · £14.00/hr",
    reason: null,
  },
  {
    id: "at-006",
    timestamp: "2026-07-31T15:20:00",
    changedBy: "Christine Lawson",
    changedByRole: "Head Office",
    employeeName: "Aisha Patel",
    employeeId: "e4",
    siteName: "Northgate Office Park",
    siteId: "s1",
    siteAreaId: "a1",
    changeType: "holiday-hours-updated",
    originalValue: "8h · 21–22 Aug 2026",
    newValue: "8h · 28–29 Aug 2026",
    reason: "Holiday dates were amended following a change requested by the employee and approved by their manager.",
  },
  {
    id: "at-007",
    timestamp: "2026-07-28T16:45:00",
    changedBy: "Christine Lawson",
    changedByRole: "Head Office",
    employeeName: "Tom Wright",
    employeeId: "e5",
    siteName: "City Centre Tower",
    siteId: "s2",
    siteAreaId: "a1",
    changeType: "pay-rate-added",
    originalValue: "—",
    newValue: "Window Cleaner · £12.50/hr",
    reason: null,
  },
  {
    id: "at-008",
    timestamp: "2026-07-27T14:15:00",
    changedBy: "Oliver Pemberton",
    changedByRole: "Head Office",
    employeeName: "Tom Wright",
    employeeId: "e5",
    siteName: "City Centre Tower",
    siteId: "s2",
    siteAreaId: "a1",
    changeType: "hour-adjustment",
    originalValue: "Clock-in 06:30 · Clock-out 14:30 (8h 00m)",
    newValue: "Clock-in 06:25 · Clock-out 15:00 (8h 35m)",
    reason: "Overtime approved — employee required to stay to complete security lock-up",
  },
  {
    id: "at-009",
    timestamp: "2026-07-25T10:30:00",
    changedBy: "Oliver Pemberton",
    changedByRole: "Head Office",
    employeeName: "Maria Santos",
    employeeId: "e6",
    siteName: "Riverside Business Hub",
    siteId: "s3",
    siteAreaId: "a2",
    changeType: "pay-rate-deleted",
    originalValue: "Team Leader · £13.00/hr",
    newValue: "Deleted",
    reason: null,
  },
  {
    id: "at-010",
    timestamp: "2026-07-22T10:00:00",
    changedBy: "Christine Lawson",
    changedByRole: "Head Office",
    employeeName: "James Mitchell",
    employeeId: "e1",
    siteName: "Northgate Office Park",
    siteId: "s1",
    siteAreaId: "a1",
    changeType: "holiday-hours-deleted",
    originalValue: "8h · 15–16 Jul 2026",
    newValue: "Deleted",
    reason: "Duplicate holiday entry was removed after payroll reconciliation identified the same absence recorded twice.",
  },
  {
    id: "at-011",
    timestamp: "2026-07-20T14:00:00",
    changedBy: "Sarah Whitmore",
    changedByRole: "Head of Area",
    employeeName: "Daniel Foster",
    employeeId: "e3",
    siteName: "Northgate Office Park",
    siteId: "s1",
    siteAreaId: "a1",
    changeType: "holiday-hours-updated",
    originalValue: "8h · 12–13 Aug 2026",
    newValue: "4h · 12 Aug 2026",
    reason: "Partial day confirmed after discussion with employee",
  },
  {
    id: "at-012",
    timestamp: "2026-07-18T09:45:00",
    changedBy: "Marcus Reid",
    changedByRole: "Head of Area",
    employeeName: "Priya Singh",
    employeeId: "e9",
    siteName: "Riverside Business Hub",
    siteId: "s3",
    siteAreaId: "a2",
    changeType: "holiday-hours-deleted",
    originalValue: "16h · 4–5 Sep 2026",
    newValue: "Deleted",
    reason: null,
  },
  {
    id: "at-013",
    timestamp: "2026-07-10T09:30:00",
    changedBy: "Oliver Pemberton",
    changedByRole: "Head Office",
    employeeName: "Luke Adams",
    employeeId: "e7",
    siteName: "South Park Complex",
    siteId: "s4",
    siteAreaId: "a2",
    changeType: "pay-rate-updated",
    originalValue: "Supervisor · £12.50/hr",
    newValue: "Supervisor · £13.00/hr",
    reason: null,
  },
  {
    id: "at-014",
    timestamp: "2026-07-01T11:00:00",
    changedBy: "Marcus Reid",
    changedByRole: "Head of Area",
    employeeName: "Fatima Ahmed",
    employeeId: "e10",
    siteName: "Riverside Business Hub",
    siteId: "s3",
    siteAreaId: "a2",
    changeType: "pay-rate-added",
    originalValue: "—",
    newValue: "Team Leader · £13.00/hr",
    reason: null,
  },
  {
    id: "at-015",
    timestamp: "2026-04-01T00:01:00",
    changedBy: "Christine Lawson",
    changedByRole: "Head Office",
    employeeName: null,
    employeeId: null,
    siteName: null,
    siteId: null,
    siteAreaId: null,
    changeType: "minimum-wage-updated",
    originalValue: "£11.44/hr",
    newValue: "£12.21/hr",
    reason: null,
  },
]

// ── CSS helpers ───────────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function truncate(text: string, max = 32): string {
  return text.length > max ? text.slice(0, max) + "…" : text
}

// ── ChangeTypeBadge ───────────────────────────────────────────────────────────

function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const { label, variant } = CHANGE_TYPE_CONFIG[type]
  return <Badge variant={variant}>{label}</Badge>
}

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 px-6 py-3">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

// ── AuditDetailPanel ──────────────────────────────────────────────────────────

function AuditDetailPanel({ record, onClose }: { record: AuditRecord | null; onClose: () => void }) {
  useEffect(() => {
    if (!record) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [record, onClose])

  if (!record) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-[520px] flex-col border-l border-border bg-background shadow-2xl">
        <div className="relative flex shrink-0 items-center border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Audit Record</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 divide-y divide-border overflow-y-auto">
          <DetailRow
            label="Date & time"
            value={`${formatDate(record.timestamp)}, ${formatTime(record.timestamp)}`}
          />
          <DetailRow label="Changed by" value={record.changedBy} />
          <DetailRow
            label="Employee"
            value={record.employeeName ?? <span className="font-normal text-muted-foreground">—</span>}
          />
          <DetailRow
            label="Site"
            value={record.siteName ?? <span className="font-normal text-muted-foreground">—</span>}
          />
          <DetailRow label="Change type" value={<ChangeTypeBadge type={record.changeType} />} />
          <DetailRow label="Original value" value={record.originalValue} />
          <DetailRow label="New value" value={record.newValue} />
          <DetailRow
            label="Reason"
            value={
              record.reason
                ? record.reason
                : <span className="font-normal italic text-muted-foreground">No reason recorded.</span>
            }
          />
          <DetailRow label="Record ID" value={record.id.toUpperCase()} />
        </div>
      </div>
    </div>
  )
}

// ── SkeletonRow ───────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  const widths = [112, 96, 88, 96, 110, 120, 100, 80, 28]
  const variance = [0.7, 0.75, 0.8, 0.85, 0.9, 0.6, 0.7, 0.5, 1]
  return (
    <tr className="border-b border-border">
      {widths.map((w, i) => (
        <td key={i} className="px-3 py-3.5">
          <div
            className="animate-pulse rounded bg-muted"
            style={{ height: 12, width: Math.round(w * variance[(i + index) % variance.length]) }}
          />
        </td>
      ))}
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { role } = useRole()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [changeType, setChangeType] = useState<ChangeType | "">("")
  const [employeeId, setEmployeeId] = useState("")
  const [siteId, setSiteId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [detail, setDetail] = useState<AuditRecord | null>(null)
  const [demoState, setDemoState] = useState<DemoState>("populated")
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (role === "area-manager") router.push("/employees")
  }, [role, router])

  useEffect(() => { setPage(1) }, [search, changeType, employeeId, siteId, dateFrom, dateTo, perPage])

  const scopedRecords = useMemo(() => {
    if (role === "head-of-area") {
      return ALL_RECORDS.filter(r => r.siteAreaId === HOA_AREA_ID || r.siteAreaId === null)
    }
    return ALL_RECORDS
  }, [role])

  const siteOptions = useMemo(() => {
    const map = new Map<string, string>()
    scopedRecords.forEach(r => { if (r.siteId && r.siteName) map.set(r.siteId, r.siteName) })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [scopedRecords])

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>()
    scopedRecords.forEach(r => { if (r.employeeId && r.employeeName) map.set(r.employeeId, r.employeeName) })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [scopedRecords])

  const filtered = useMemo(() => {
    if (demoState !== "populated") return []
    let list = scopedRecords
    if (changeType) list = list.filter(r => r.changeType === changeType)
    if (employeeId) list = list.filter(r => r.employeeId === employeeId)
    if (siteId) list = list.filter(r => r.siteId === siteId)
    if (dateFrom) {
      const from = new Date(dateFrom)
      list = list.filter(r => new Date(r.timestamp) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59")
      list = list.filter(r => new Date(r.timestamp) <= to)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r =>
        r.changedBy.toLowerCase().includes(q) ||
        (r.employeeName?.toLowerCase().includes(q) ?? false) ||
        (r.siteName?.toLowerCase().includes(q) ?? false),
      )
    }
    return list
  }, [scopedRecords, changeType, employeeId, siteId, dateFrom, dateTo, search, demoState])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageRecords = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const hasActiveFilters =
    !!search || !!changeType || !!employeeId || !!siteId || !!dateFrom || !!dateTo
  const mobileFilterCount =
    (dateFrom || dateTo ? 1 : 0) + (changeType ? 1 : 0) + (employeeId ? 1 : 0) + (siteId ? 1 : 0)

  function clearFilters() {
    setSearch(""); setChangeType(""); setEmployeeId("")
    setSiteId(""); setDateFrom(""); setDateTo(""); setPage(1)
  }

  if (role === "area-manager") return null

  return (
    <PageShell
      title="Audit Trail"
      description="A full log of admin actions taken across employees, pay rates, and settings."
    >
      {/* ── Filters ─────────────────────────────────────────────────────────── */}

      {/* Mobile toolbar: Search + Filters button */}
      <div className="flex items-center gap-2 @[640px]:hidden">
        <div className="flex h-9 flex-1 min-w-0 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by manager, employee, or site…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FiltersButton activeCount={mobileFilterCount} onClick={() => setFiltersOpen(true)} />
      </div>

      {/* Desktop toolbar: inline filters */}
      <div className="hidden @[640px]:flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by manager, employee, or site…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1) }}
        />

        <FilterDropdown
          label="Change type"
          options={(Object.entries(CHANGE_TYPE_CONFIG) as [ChangeType, { label: string }][]).map(([value, { label }]) => ({ value, label }))}
          value={changeType}
          onChange={v => { setChangeType(v as ChangeType | ""); setPage(1) }}
        />

        <FilterDropdown
          label="Employee"
          options={employeeOptions.map(e => ({ value: e.id, label: e.name }))}
          value={employeeId}
          onChange={v => { setEmployeeId(v); setPage(1) }}
          searchable
          searchPlaceholder="Search employees…"
          searchEmptyMessage="No employees found"
        />

        <FilterDropdown
          label="Site"
          options={siteOptions.map(s => ({ value: s.id, label: s.name }))}
          value={siteId}
          onChange={v => { setSiteId(v); setPage(1) }}
          searchable
          searchPlaceholder="Search sites…"
          searchEmptyMessage="No sites found"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset filters
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={() => { setChangeType(""); setEmployeeId(""); setSiteId(""); setDateFrom(""); setDateTo(""); setPage(1) }}
        activeCount={mobileFilterCount}
      >
        <FilterSheetSection title="Date range">
          <FilterSheetDateRange
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1) }}
          />
        </FilterSheetSection>
        <FilterSheetSection title="Change type">
          <FilterSheetRadioList
            options={(Object.entries(CHANGE_TYPE_CONFIG) as [ChangeType, { label: string }][]).map(([value, { label }]) => ({ value, label }))}
            value={changeType}
            onChange={v => { setChangeType(v as ChangeType | ""); setPage(1) }}
          />
        </FilterSheetSection>
        <FilterSheetSection title="Employee">
          <FilterSheetRadioList
            options={employeeOptions.map(e => ({ value: e.id, label: e.name }))}
            value={employeeId}
            onChange={v => { setEmployeeId(v); setPage(1) }}
            searchable
            searchPlaceholder="Search employees…"
          />
        </FilterSheetSection>
        <FilterSheetSection title="Site">
          <FilterSheetRadioList
            options={siteOptions.map(s => ({ value: s.id, label: s.name }))}
            value={siteId}
            onChange={v => { setSiteId(v); setPage(1) }}
            searchable
            searchPlaceholder="Search sites…"
          />
        </FilterSheetSection>
      </MobileFilterSheet>

      {/* ── HoA scope banner ─────────────────────────────────────────────────── */}
      {role === "head-of-area" && (
        <div className="w-fit">
          <AlertBox variant="info">
            Showing audit records for sites in your assigned area ({HOA_AREA_NAME}) only.
          </AlertBox>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card">
        {/* Table — only rendered when loading (skeletons) or when there are rows to display */}
        {(demoState === "loading" || (demoState === "populated" && pageRecords.length > 0)) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Date & Time", "Changed By", "Employee", "Site",
                  "Change Type", "Original Value", "New Value", "Reason",
                ].map(col => (
                  <th key={col} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons — stay inside the table for correct column layout */}
              {demoState === "loading" && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} index={i} />
              ))}

              {/* Populated rows */}
              {demoState === "populated" && pageRecords.map(record => (
                <tr
                  key={record.id}
                  onClick={() => setDetail(record)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-3">
                    <div className="whitespace-nowrap text-sm">{formatDate(record.timestamp)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(record.timestamp)}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {record.changedBy}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {record.employeeName ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {record.siteName ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <ChangeTypeBadge type={record.changeType} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-[150px] truncate font-mono text-xs text-muted-foreground" title={record.originalValue}>
                      {record.originalValue}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-[150px] truncate font-mono text-xs" title={record.newValue}>
                      {record.newValue}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {record.reason ? (
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={record.reason}>
                        {record.reason}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Error — outside overflow-x-auto so it spans the visible card width */}
        {demoState === "error" && (
          <div className="px-4 py-14 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Failed to load audit records</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
              </div>
              <button
                onClick={() => setDemoState("populated")}
                className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty — no records at all */}
        {demoState === "empty" && (
          <div className="px-4 py-14 text-center">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">No audit records</p>
              <p className="text-xs text-muted-foreground">
                Records will appear here once admin actions are performed.
              </p>
            </div>
          </div>
        )}

        {/* No results from filters */}
        {demoState === "populated" && filtered.length === 0 && (
          <div className="px-4 py-14 text-center">
            <div className="flex flex-col items-center gap-2">
              <Search className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">No records match your filters</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting or clearing your search and filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Pagination footer */}
        {demoState === "populated" && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input bg-muted/50 pl-2.5 pr-7 text-xs font-medium transition-colors hover:border-input-hover focus:outline-none focus:ring-2 focus:ring-ring">
                  {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setPage(1)} disabled={currentPage === 1}
                aria-label="First page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronsLeft className="size-3.5" />
              </button>
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="inline-flex @[460px]:hidden whitespace-nowrap px-2 text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
              {getPageWindow(currentPage, totalPages).map(n => (
                <button key={n} type="button" onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={cn(
                    "hidden @[460px]:flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    n === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                  )}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="size-3.5" />
              </button>
              <button type="button" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}
                aria-label="Last page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────────── */}
      <AuditDetailPanel record={detail} onClose={() => setDetail(null)} />

      {/* ── Demo state control ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Prototype state
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["populated", "loading", "empty", "error"] as DemoState[]).map(s => (
            <button
              key={s}
              onClick={() => { setDemoState(s); if (s !== "populated") setDetail(null) }}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                demoState === s
                  ? "border border-border bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "populated" && "Populated"}
              {s === "loading" && "Loading"}
              {s === "empty" && "Empty"}
              {s === "error" && "Error"}
            </button>
          ))}
        </div>
        {role === "head-of-area" && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Head of Area scope: North Area (a1) only — 9 of 15 records visible.
          </p>
        )}
      </div>
    </PageShell>
  )
}
