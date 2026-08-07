"use client"

import { useState, useMemo, useEffect, type ReactNode } from "react"
import {
  Calendar, ChevronDown, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye,
  Info, RefreshCw, AlertCircle,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { cn } from "@/lib/utils"

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

const PAGE_SIZE = 8

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}
const HOA_AREA_ID = "a1"

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; cls: string }> = {
  "hour-adjustment": {
    label: "Hour adjustment",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "pay-rate-added": {
    label: "Pay rate added",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  "pay-rate-updated": {
    label: "Pay rate updated",
    cls: "bg-muted text-muted-foreground",
  },
  "pay-rate-deleted": {
    label: "Pay rate deleted",
    cls: "bg-muted text-muted-foreground",
  },
  "holiday-hours-updated": {
    label: "Holiday hours updated",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  "holiday-hours-deleted": {
    label: "Holiday hours deleted",
    cls: "bg-muted text-muted-foreground",
  },
  "minimum-wage-updated": {
    label: "Minimum wage updated",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
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
    reason: "Employee badge malfunction caused incorrect clock-in time",
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
    reason: null,
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
    reason: "Employee requested date change",
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
    reason: "Duplicate entry removed",
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
const selectCls =
  "h-9 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
const btnOutline =
  "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"

function fmtFilterDate(d: string): string {
  if (!d) return ""
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const sd = parseInt(d.slice(8))
  const sm = parseInt(d.slice(5, 7)) - 1
  return `${sd} ${months[sm]}`
}

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
  const cfg = CHANGE_TYPE_CONFIG[type]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md max-h-[90vh] flex-col rounded-xl border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── AuditDetailContent ────────────────────────────────────────────────────────

function AuditDetailContent({ record }: { record: AuditRecord }) {
  return (
    <div className="divide-y divide-border">
      {/* Badge + timestamp */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <ChangeTypeBadge type={record.changeType} />
        <div className="text-right">
          <div className="text-sm font-medium">{formatDate(record.timestamp)}</div>
          <div className="text-xs text-muted-foreground">{formatTime(record.timestamp)}</div>
        </div>
      </div>

      {/* Changed by */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm text-muted-foreground">Changed by</span>
        <div className="text-right">
          <div className="text-sm font-medium">{record.changedBy}</div>
          <div className="text-xs text-muted-foreground">{record.changedByRole}</div>
        </div>
      </div>

      {/* Employee */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm text-muted-foreground">Employee</span>
        <span className="text-sm font-medium">{record.employeeName ?? "—"}</span>
      </div>

      {/* Site */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm text-muted-foreground">Site</span>
        <span className="text-sm font-medium">{record.siteName ?? "—"}</span>
      </div>

      {/* Values */}
      <div className="flex flex-col gap-3 px-5 py-4">
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Original value</div>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
            {record.originalValue}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">New value</div>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
            {record.newValue}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="px-5 py-4">
        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Reason</div>
        {record.reason ? (
          <p className="text-sm">{record.reason}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No reason recorded.</p>
        )}
      </div>

      {/* Record ID */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-xs text-muted-foreground">Record ID</span>
        <span className="font-mono text-xs text-muted-foreground">{record.id.toUpperCase()}</span>
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
  const [changeType, setChangeType] = useState<ChangeType | "all">("all")
  const [employeeId, setEmployeeId] = useState("all")
  const [siteId, setSiteId] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<AuditRecord | null>(null)
  const [demoState, setDemoState] = useState<DemoState>("populated")

  useEffect(() => {
    if (role === "area-manager") router.push("/employees")
  }, [role, router])

  useEffect(() => { setPage(1) }, [search, changeType, employeeId, siteId, dateFrom, dateTo])

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
    if (changeType !== "all") list = list.filter(r => r.changeType === changeType)
    if (employeeId !== "all") list = list.filter(r => r.employeeId === employeeId)
    if (siteId !== "all") list = list.filter(r => r.siteId === siteId)
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasActiveFilters =
    !!search || changeType !== "all" || employeeId !== "all" ||
    siteId !== "all" || !!dateFrom || !!dateTo

  function clearFilters() {
    setSearch(""); setChangeType("all"); setEmployeeId("all")
    setSiteId("all"); setDateFrom(""); setDateTo(""); setPage(1)
  }

  if (role === "area-manager") return null

  return (
    <PageShell
      title="Audit Trail"
      description="A full log of admin actions taken across employees, pay rates, and settings."
    >
      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-2">
        {/* Search */}
        <div className="relative flex h-9 min-w-52 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by manager, employee, or site…"
            className="h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">From</label>
          <div className="relative w-[130px]">
            <div className={cn(
              "flex h-9 items-center justify-between rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover",
              dateFrom ? "text-foreground" : "text-muted-foreground"
            )}>
              <span className="truncate">{dateFrom ? fmtFilterDate(dateFrom) : "Select date"}</span>
              <Calendar className="ml-2 size-4 shrink-0 text-foreground/50" />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="From date"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">To</label>
          <div className="relative w-[130px]">
            <div className={cn(
              "flex h-9 items-center justify-between rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover",
              dateTo ? "text-foreground" : "text-muted-foreground"
            )}>
              <span className="truncate">{dateTo ? fmtFilterDate(dateTo) : "Select date"}</span>
              <Calendar className="ml-2 size-4 shrink-0 text-foreground/50" />
            </div>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="To date"
            />
          </div>
        </div>

        {/* Change Type */}
        <div className="relative flex items-center">
          <select
            value={changeType}
            onChange={e => setChangeType(e.target.value as ChangeType | "all")}
            className={selectCls}
          >
            <option value="all">All change types</option>
            {(Object.keys(CHANGE_TYPE_CONFIG) as ChangeType[]).map(ct => (
              <option key={ct} value={ct}>{CHANGE_TYPE_CONFIG[ct].label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
        </div>

        {/* Employee */}
        <div className="relative flex items-center">
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className={selectCls}>
            <option value="all">All employees</option>
            {employeeOptions.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
        </div>

        {/* Site */}
        <div className="relative flex items-center">
          <select value={siteId} onChange={e => setSiteId(e.target.value)} className={selectCls}>
            <option value="all">All sites</option>
            {siteOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className={btnOutline}>
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── HoA scope banner ─────────────────────────────────────────────────── */}
      {role === "head-of-area" && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Showing audit records for sites in your assigned area (North Area) only.
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Date & Time", "Changed By", "Employee", "Site",
                  "Change Type", "Original Value", "New Value", "Reason", "",
                ].map(col => (
                  <th key={col} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {demoState === "loading" && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} index={i} />
              ))}

              {/* Error */}
              {demoState === "error" && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
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
                  </td>
                </tr>
              )}

              {/* Empty — no records at all */}
              {demoState === "empty" && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium text-muted-foreground">No audit records</p>
                      <p className="text-xs text-muted-foreground">
                        Records will appear here once admin actions are performed.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* No results from filters */}
              {demoState === "populated" && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
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
                  </td>
                </tr>
              )}

              {/* Populated rows */}
              {demoState === "populated" && pageRecords.map(record => (
                <tr
                  key={record.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-3">
                    <div className="whitespace-nowrap text-sm">{formatDate(record.timestamp)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(record.timestamp)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium">{record.changedBy}</div>
                    <div className="text-xs text-muted-foreground">{record.changedByRole}</div>
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
                    <span className="font-mono text-xs text-muted-foreground" title={record.originalValue}>
                      {truncate(record.originalValue)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs" title={record.newValue}>
                      {truncate(record.newValue)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {record.reason ? (
                      <span className="text-xs text-muted-foreground" title={record.reason}>
                        {truncate(record.reason, 28)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setDetail(record)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted"
                      aria-label="View record details"
                      title="View details"
                    >
                      <Eye className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {demoState === "populated" && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {start}–{end} of {filtered.length}{" "}
              {filtered.length === 1 ? "record" : "records"}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={currentPage === 1}
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-1 text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
              {getPageWindow(currentPage, totalPages).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex size-7 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                    p === currentPage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Audit Record"
      >
        {detail && <AuditDetailContent record={detail} />}
      </Modal>

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
