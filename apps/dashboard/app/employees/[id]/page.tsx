"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  Archive,
  Calendar,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  EllipsisVertical,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { type EmployeeStatus, EmployeeStatusBadge } from "@/components/employee-status-badge"
import { Badge } from "@/components/ui/badge"
import { EditEmployeeDialog } from "@/components/edit-employee-dialog"
import { TabSwitcher } from "@/components/tab-switcher"
import {
  MobileFilterSheet,
  FiltersButton,
  FilterSheetSection,
  FilterSheetDateRange,
  FilterSheetRadioList,
} from "@/components/mobile-filter-sheet"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "work-history" | "pay-rates" | "holiday-hours"

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  taid: string
  status: EmployeeStatus
  jobRole: string
  payrollSC: string
  payrollSFM: string
}

type ShiftEntry = {
  id: string
  date: string
  dateISO: string
  site: string
  siteNumber?: string
  jobRole?: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  payRate: number
  isAdjusted: boolean
  isAutoClockOut: boolean
}

type PayRateEntry = {
  id: string
  site: string
  jobRole: string
  rate: number
  isOverride: boolean
}

type HolidayEntry = {
  id: string
  dateFrom: string
  dateTo: string
  hours: number
  loggedBy: string
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const EMPLOYEES_DATA: Employee[] = [
  { id: "1",  firstName: "James",   lastName: "Mitchell",  email: "james.mitchell@spectrumclean.co.uk",   taid: "TAA-0001", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-001",  payrollSFM: "SFM-001" },
  { id: "2",  firstName: "Sarah",   lastName: "Okonkwo",   email: "sarah.okonkwo@spectrumclean.co.uk",    taid: "TAA-0002", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-002",  payrollSFM: "" },
  { id: "3",  firstName: "Daniel",  lastName: "Foster",    email: "daniel.foster@spectrumclean.co.uk",    taid: "TAA-0003", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: "" },
  { id: "4",  firstName: "Aisha",   lastName: "Patel",     email: "aisha.patel@spectrumclean.co.uk",      taid: "TAA-0004", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-004",  payrollSFM: "" },
  { id: "5",  firstName: "Tom",     lastName: "Wright",    email: "tom.wright@spectrumclean.co.uk",       taid: "TAA-0005", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: "" },
  { id: "6",  firstName: "Maria",   lastName: "Santos",    email: "maria.santos@spectrumclean.co.uk",     taid: "TAA-0006", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-006",  payrollSFM: "SFM-006" },
  { id: "7",  firstName: "Kevin",   lastName: "Huang",     email: "kevin.huang@spectrumclean.co.uk",      taid: "TAA-0007", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-007",  payrollSFM: "" },
  { id: "8",  firstName: "Priya",   lastName: "Singh",     email: "priya.singh@spectrumclean.co.uk",      taid: "TAA-0008", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-008",  payrollSFM: "" },
  { id: "9",  firstName: "Luke",    lastName: "Adams",     email: "luke.adams@spectrumclean.co.uk",       taid: "TAA-0009", status: "invited",  jobRole: "Supervisor",     payrollSC: "",        payrollSFM: "" },
  { id: "10", firstName: "Emma",    lastName: "Clarke",    email: "emma.clarke@spectrumclean.co.uk",      taid: "TAA-0010", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-010",  payrollSFM: "" },
  { id: "11", firstName: "Robert",  lastName: "Taylor",    email: "robert.taylor@spectrumclean.co.uk",    taid: "TAA-0011", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-011",  payrollSFM: "" },
  { id: "12", firstName: "Fatima",  lastName: "Ahmed",     email: "fatima.ahmed@spectrumclean.co.uk",     taid: "TAA-0012", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-012",  payrollSFM: "SFM-012" },
  { id: "13", firstName: "Callum",  lastName: "Robertson", email: "callum.robertson@spectrumclean.co.uk", taid: "TAA-0013", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-013",  payrollSFM: "" },
  { id: "14", firstName: "Yuki",    lastName: "Tanaka",    email: "yuki.tanaka@spectrumclean.co.uk",      taid: "TAA-0014", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: "" },
  { id: "15", firstName: "Grace",   lastName: "Mensah",    email: "grace.mensah@spectrumclean.co.uk",     taid: "TAA-0015", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-015",  payrollSFM: "SFM-015" },
]

const MOCK_SHIFTS: ShiftEntry[] = [
  { id: "s0",  date: "Today",              dateISO: "2026-08-07", site: "Citygate House",  siteNumber: "SN-001", clockIn: "07:00", clockOut: null,    totalHours: null, payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s1",  date: "Thu, 6 Aug 2026",    dateISO: "2026-08-06", site: "Citygate House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s2",  date: "Wed, 5 Aug 2026",    dateISO: "2026-08-05", site: "Parkside Office", clockIn: "08:00", clockOut: "16:00", totalHours: 8,    payRate: 12.00, isAdjusted: true,  isAutoClockOut: false },
  { id: "s3",  date: "Mon, 3 Aug 2026",    dateISO: "2026-08-03", site: "Citygate House",  clockIn: "07:00", clockOut: "23:59", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: true  },
  { id: "s4",  date: "Fri, 31 Jul 2026",   dateISO: "2026-07-31", site: "Riverside Plaza", clockIn: "09:00", clockOut: "17:00", totalHours: 8,    payRate: 11.50, isAdjusted: false, isAutoClockOut: false, jobRole: "Cleaner" },
  { id: "s5",  date: "Wed, 30 Jul 2026",   dateISO: "2026-07-30", site: "Citygate House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s6",  date: "Tue, 29 Jul 2026",   dateISO: "2026-07-29", site: "Parkside Office", clockIn: "08:00", clockOut: "14:30", totalHours: 6.5,  payRate: 12.00, isAdjusted: true,  isAutoClockOut: false },
  { id: "s7",  date: "Mon, 21 Jul 2026",   dateISO: "2026-07-21", site: "Citygate House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s8",  date: "Fri, 17 Jul 2026",   dateISO: "2026-07-17", site: "Riverside Plaza", clockIn: "09:00", clockOut: "13:00", totalHours: 4,    payRate: 11.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s9",  date: "Thu, 16 Jul 2026",   dateISO: "2026-07-16", site: "Parkside Office", clockIn: "08:00", clockOut: "16:00", totalHours: 8,    payRate: 12.00, isAdjusted: false, isAutoClockOut: false },
  { id: "s10", date: "Tue, 14 Jul 2026",   dateISO: "2026-07-14", site: "Citygate House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s11", date: "Mon, 6 Jul 2026",    dateISO: "2026-07-06", site: "Highfield Tower", clockIn: "06:30", clockOut: "14:30", totalHours: 8,    payRate: 12.00, isAdjusted: true,  isAutoClockOut: false },
  { id: "s12", date: "Fri, 3 Jul 2026",    dateISO: "2026-07-03", site: "Citygate House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s13", date: "Thu, 25 Jun 2026",   dateISO: "2026-06-25", site: "Parkside Office", clockIn: "08:00", clockOut: "16:30", totalHours: 8.5,  payRate: 12.00, isAdjusted: false, isAutoClockOut: false },
  { id: "s14", date: "Mon, 22 Jun 2026",   dateISO: "2026-06-22", site: "Riverside Plaza", clockIn: "09:00", clockOut: "17:00", totalHours: 8,    payRate: 11.50, isAdjusted: false, isAutoClockOut: false },
  { id: "s15", date: "Fri, 19 Jun 2026",   dateISO: "2026-06-19", site: "Citygate House",  clockIn: "07:00", clockOut: "23:59", totalHours: 8,    payRate: 12.50, isAdjusted: false, isAutoClockOut: true  },
  { id: "s16", date: "Wed, 22 Jul 2026",   dateISO: "2026-07-22", site: "Citygate House",  clockIn: "08:00", clockOut: "12:00", totalHours: 4,    payRate: 11.44, isAdjusted: false, isAutoClockOut: false, jobRole: "Cleaner" },
  { id: "s17", date: "Fri, 3 Apr 2026",    dateISO: "2026-04-03", site: "Victoria House",  clockIn: "07:00", clockOut: "15:00", totalHours: 8,    payRate: 12.25, isAdjusted: false, isAutoClockOut: false },
]

const MOCK_PAY_RATES: PayRateEntry[] = [
  { id: "pr1", site: "Citygate House",  jobRole: "Supervisor", rate: 12.50, isOverride: true },
  { id: "pr2", site: "Parkside Office", jobRole: "Supervisor", rate: 12.00, isOverride: true },
  { id: "pr3", site: "Riverside Plaza", jobRole: "Cleaner",    rate: 11.50, isOverride: true },
  { id: "pr4", site: "Highfield Tower", jobRole: "Supervisor", rate: 12.00, isOverride: true },
  { id: "pr5", site: "Victoria House",  jobRole: "Supervisor", rate: 12.25, isOverride: true },
]

const MOCK_HOLIDAY_ENTRIES: HolidayEntry[] = [
  { id: "h1", dateFrom: "2025-07-14", dateTo: "2025-07-18", hours: 40, loggedBy: "Admin" },
  { id: "h2", dateFrom: "2025-06-02", dateTo: "2025-06-02", hours: 8,  loggedBy: "Admin" },
  { id: "h3", dateFrom: "2025-05-19", dateTo: "2025-05-23", hours: 40, loggedBy: "Admin" },
]

const JOB_ROLES = ["Cleaner", "Supervisor", "Team Leader", "Window Cleaner", "Operative"]
const SITES = ["Citygate House", "Parkside Office", "Riverside Plaza", "Highfield Tower", "Victoria House"]
const MINIMUM_WAGE = 11.44
const SITE_INFO: Record<string, { number: string }> = {
  "Citygate House":  { number: "SN-001" },
  "Parkside Office": { number: "SN-002" },
  "Riverside Plaza": { number: "SN-003" },
  "Highfield Tower": { number: "SN-004" },
  "Victoria House":  { number: "SN-005" },
}

// ─── Primitives ─────────────────────────────────────────────────────────────────

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3 shrink-0" />{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function inputCls(hasError?: boolean) {
  return cn(
    "flex h-9 w-full rounded-md border bg-muted/50 px-3 text-sm transition-colors",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    hasError ? "border-destructive hover:border-destructive focus:ring-destructive/30" : "border-input hover:border-input-hover"
  )
}

function CheckIcon() {
  return (
    <svg className="size-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Duration utils ──────────────────────────────────────────────────────────────

function computeElapsed(clockInTime: string): string {
  const [h, m] = clockInTime.split(":").map(Number)
  const now = new Date()
  const clockInMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime()
  const diffMs = now.getTime() - clockInMs
  if (diffMs <= 0) return "0m"
  const totalMin = Math.floor(diffMs / 60_000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function useElapsed(clockInTime: string): string {
  const [elapsed, setElapsed] = useState(() => computeElapsed(clockInTime))
  useEffect(() => {
    const id = setInterval(() => setElapsed(computeElapsed(clockInTime)), 60_000)
    return () => clearInterval(id)
  }, [clockInTime])
  return elapsed
}

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

function formatHours(h: number): string {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins === 0) return `${hrs}h`
  if (hrs === 0) return `${mins}m`
  return `${hrs}h ${mins}m`
}

function formatISODate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const DAY  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const MON  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${DAY[date.getDay()]}, ${d} ${MON[m - 1]} ${y}`
}

function formatHolidayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${d} ${MON[m - 1]} ${y}`
}

// ─── Dialog ─────────────────────────────────────────────────────────────────────

function Dialog({
  open, onClose, title, children, footer, maxWidth = "max-w-lg", lockClose = false,
}: {
  open: boolean; onClose: () => void; title: React.ReactNode
  children: React.ReactNode; footer?: React.ReactNode
  maxWidth?: string; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, onClose, lockClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={lockClose ? undefined : onClose} />
      <div className={cn("relative z-10 flex w-full flex-col rounded-xl bg-background shadow-xl max-h-[90vh]", maxWidth)}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button type="button" onClick={onClose}
              className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-4" /><span className="sr-only">Close</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Archive Dialog ──────────────────────────────────────────────────────────────

function ArchiveDialog({
  open, onClose, employee, onConfirm,
}: {
  open: boolean; onClose: () => void; employee: Employee; onConfirm: () => void
}) {
  const [loading, setLoading] = useState(false)
  function handle() { setLoading(true); setTimeout(() => { setLoading(false); onConfirm() }, 1000) }

  return (
    <Dialog open={open} onClose={onClose} title="Archive employee"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
          <button type="button" onClick={handle} disabled={loading}
            className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50">
            {loading ? "Archiving…" : "Archive employee"}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">
          Archiving <span className="font-medium text-foreground">{employee.firstName} {employee.lastName}</span> will
          immediately remove their access to the Spectrum Clean PWA. Their work history and pay rate data will be retained.
        </p>
        <div className="flex gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">PWA access will be removed immediately.</p>
            <p className="mt-0.5 text-destructive/80">
              Historical shift and pay data for {employee.firstName} will be preserved.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

// ─── Active Shift Block Dialog ───────────────────────────────────────────────────

function ActiveShiftBlockDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Employee cannot be archived"
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Close
          </button>
        </div>
      }>
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          This employee currently has an active shift. Close the shift before archiving their account.
        </p>
      </div>
    </Dialog>
  )
}

// ─── Reinstate Dialog ────────────────────────────────────────────────────────────

function ReinstateDialog({
  open, onClose, employee, onConfirm,
}: {
  open: boolean; onClose: () => void; employee: Employee; onConfirm: () => void
}) {
  const [loading, setLoading] = useState(false)
  function handle() { setLoading(true); setTimeout(() => { setLoading(false); onConfirm() }, 1000) }

  return (
    <Dialog open={open} onClose={onClose} title="Reinstate employee"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
          <button type="button" onClick={handle} disabled={loading}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {loading ? "Reinstating…" : "Reinstate employee"}
          </button>
        </div>
      }>
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Reinstating <span className="font-medium text-foreground">{employee.firstName} {employee.lastName}</span> will
          restore their status to Active and re-enable their PWA access using their existing credentials.
        </p>
      </div>
    </Dialog>
  )
}

// ─── Manual Adjust Dialog ────────────────────────────────────────────────────────

function ManualAdjustDialog({
  open, onClose, shift,
}: {
  open: boolean; onClose: () => void; shift: ShiftEntry | null
}) {
  const [clockIn, setClockIn]   = useState("")
  const [clockOut, setClockOut] = useState("")
  const [reason, setReason]     = useState("")
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (open && shift) {
      setClockIn(shift.clockIn); setClockOut(shift.clockOut ?? "")
      setReason(""); setErrors({}); setSubmitting(false); setDone(false)
    }
  }, [open, shift])

  function validate() {
    const e: Record<string, string> = {}
    if (!clockIn) e.clockIn = "Clock-in time is required."
    if (!clockOut) e.clockOut = "Clock-out time is required."
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setDone(true) }, 1000)
  }

  if (!shift) return null

  return (
    <Dialog open={open} onClose={onClose} title="Adjust hours"
      footer={
        done ? (
          <div className="flex justify-end">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Done
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
              {submitting ? "Saving…" : "Save adjustment"}
            </button>
          </div>
        )
      }>
      {done ? (
        <div className="flex flex-col items-center gap-3 p-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <CheckIcon />
          </div>
          <div>
            <p className="font-medium">Hours adjusted</p>
            <p className="mt-1 text-sm text-muted-foreground">An audit record has been created.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-6">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium">{shift.date} · {shift.site}</p>
            <p className="text-muted-foreground">Original: {shift.clockIn} – {shift.clockOut ?? "Active"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Clock in" required error={errors.clockIn}>
              <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} className={inputCls(!!errors.clockIn)} />
            </Field>
            <Field label="Clock out" required error={errors.clockOut}>
              <input type="time" value={clockOut} onChange={e => setClockOut(e.target.value)} className={inputCls(!!errors.clockOut)} />
            </Field>
          </div>
          <Field label="Reason" hint="Optional. Recorded in the audit log.">
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Reason for adjustment…" rows={3}
              className={cn(inputCls(), "h-auto resize-none py-2")} />
          </Field>
        </div>
      )}
    </Dialog>
  )
}

// ─── Current Shift Card ──────────────────────────────────────────────────────────

function CurrentShiftCard({ shift, employee }: { shift: ShiftEntry; employee: Employee }) {
  const elapsed = useElapsed(shift.clockIn)
  const shiftJobRole = shift.jobRole ?? employee.jobRole

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted px-5 py-4">
        <h3 className="text-sm font-semibold">Current shift</h3>
      </div>
      <div className="divide-y divide-border">
        <div className="flex items-center gap-4 bg-emerald-50/60 px-5 py-3.5 dark:bg-emerald-500/5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
            Clocked in · {elapsed}
          </span>
        </div>
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Site</span>
          <Link href="/sites" className="text-sm text-primary hover:underline">{shift.site}</Link>
        </div>
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Site number</span>
          <span className="text-sm text-foreground">{shift.siteNumber ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Clock-in date</span>
          <span className="text-sm text-foreground">{shift.date}</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Clock-in time</span>
          <span className="font-mono text-sm text-foreground">{shift.clockIn}</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="w-32 shrink-0 text-sm text-muted-foreground">Job role</span>
          <span className="text-sm text-foreground">{shiftJobRole}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────────

function OverviewTab({ employee, activeShift }: { employee: Employee; activeShift: ShiftEntry | null }) {
  const detailRows = [
    { label: "Full name",        value: `${employee.firstName} ${employee.lastName}`, mono: false },
    { label: "T&A ID",           value: employee.taid,             mono: true  },
    { label: "Email address",    value: employee.email,             mono: false },
    { label: "Job role",         value: employee.jobRole,           mono: false },
    { label: "Payroll ID (SC)",  value: employee.payrollSC || "—",  mono: false },
    { label: "Payroll ID (SFM)", value: employee.payrollSFM || "—", mono: false },
  ]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
      {/* Employee details */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted px-5 py-4">
          <h3 className="text-sm font-semibold">Employee details</h3>
        </div>
        <div className="divide-y divide-border">
          {detailRows.map(({ label, value, mono }) => (
            <div key={label} className="flex flex-col gap-0.5 px-5 py-3 @[480px]:flex-row @[480px]:items-center @[480px]:gap-4 @[480px]:py-3.5">
              <span className="shrink-0 text-xs text-muted-foreground @[480px]:w-40 @[480px]:text-sm">{label}</span>
              <span className={cn("break-words text-sm text-foreground", mono && "font-mono")}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current shift */}
      {activeShift && <CurrentShiftCard shift={activeShift} employee={employee} />}
    </div>
  )
}

// ─── Work History Primitives ─────────────────────────────────────────────────────

function DateButton({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string
}) {
  return (
    <div className={cn("relative w-[160px]", className)}>
      <div className={cn(
        "flex h-9 items-center justify-between rounded-md border px-3 text-sm transition-colors",
        "border-input bg-muted/50 hover:border-input-hover",
        value ? "text-foreground" : "text-muted-foreground"
      )}>
        <span className="truncate">{value ? formatISODate(value) : placeholder}</span>
        <Calendar className="ml-2 size-4 shrink-0 text-foreground/50" />
      </div>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </div>
  )
}

type ShiftFlagVariant = "adjusted" | "auto-clock-out" | "active"

const FLAG_CONFIG: Record<"adjusted" | "auto-clock-out", { label: string; variant: "info" | "warning" }> = {
  adjusted:         { label: "Adjusted",      variant: "info"    },
  "auto-clock-out": { label: "Auto clock-out", variant: "warning" },
}

function ShiftFlagBadge({ variant }: { variant: ShiftFlagVariant }) {
  if (variant === "active") {
    return (
      <Badge variant="success">
        <CircleCheck className="size-3.5 shrink-0" />
        Active shift
      </Badge>
    )
  }
  const { label, variant: badgeVariant } = FLAG_CONFIG[variant]
  return <Badge variant={badgeVariant}>{label}</Badge>
}

function ActiveShiftRow({ shift, employee }: { shift: ShiftEntry; employee: Employee }) {
  const elapsed = useElapsed(shift.clockIn)
  const showJobRole = !!(shift.jobRole && shift.jobRole !== employee.jobRole)
  const dateLabel = shift.date === "Today"
    ? `Today, ${formatISODate(shift.dateISO)}`
    : shift.date
  return (
    <tr className="border-b border-border bg-emerald-50/60 last:border-0 dark:bg-emerald-500/5">
      <td className="px-4 py-3.5 text-sm">{dateLabel}</td>
      <td className="px-4 py-3.5">
        <Link href="/sites" className="text-sm text-primary hover:underline">
          {shift.site}
        </Link>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">{showJobRole ? shift.jobRole : <span className="text-muted-foreground/50">—</span>}</td>
      <td className="px-4 py-3.5 font-mono text-sm">{shift.clockIn}</td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground/50">—</td>
      <td className="px-4 py-3.5 tabular-nums text-sm">{elapsed}</td>
      <td className="px-4 py-3.5 tabular-nums text-sm">£{shift.payRate.toFixed(2)}/hr</td>
      <td className="px-4 py-3.5"><ShiftFlagBadge variant="active" /></td>
    </tr>
  )
}

function ShiftRow({ shift, employee }: { shift: ShiftEntry; employee: Employee }) {
  const showJobRole = !!(shift.jobRole && shift.jobRole !== employee.jobRole)
  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3.5 text-sm">{shift.date}</td>
      <td className="px-4 py-3.5">
        <Link href="/sites" className="text-sm hover:text-primary hover:underline">
          {shift.site}
        </Link>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">{showJobRole ? shift.jobRole : <span className="text-muted-foreground/50">—</span>}</td>
      <td className="px-4 py-3.5 font-mono text-sm">{shift.clockIn}</td>
      <td className="px-4 py-3.5 font-mono text-sm">{shift.clockOut ?? <span className="font-sans text-muted-foreground/50">—</span>}</td>
      <td className="px-4 py-3.5 tabular-nums text-sm">{shift.totalHours !== null ? formatHours(shift.totalHours) : "—"}</td>
      <td className="px-4 py-3.5 tabular-nums text-sm">£{shift.payRate.toFixed(2)}/hr</td>
      <td className="px-4 py-3.5">
        {(shift.isAdjusted || shift.isAutoClockOut) && (
          <div className="flex flex-wrap gap-1">
            {shift.isAdjusted && <ShiftFlagBadge variant="adjusted" />}
            {shift.isAutoClockOut && <ShiftFlagBadge variant="auto-clock-out" />}
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Work History Tab ────────────────────────────────────────────────────────────

function WorkHistoryTab({ employee }: { employee: Employee }) {
  const [dateFrom,       setDateFrom]       = useState("")
  const [dateTo,         setDateTo]         = useState("")
  const [siteFilter,     setSiteFilter]     = useState("all")
  const [perPage,        setPerPage]        = useState(10)
  const [page,           setPage]           = useState(1)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const activeShift = (employee.id === "1" && employee.status === "active")
    ? MOCK_SHIFTS.find(s => s.clockOut === null) ?? null
    : null

  const completedShifts = MOCK_SHIFTS.filter(s => s.clockOut !== null)

  const filtered = completedShifts.filter(s => {
    if (dateFrom && s.dateISO < dateFrom) return false
    if (dateTo   && s.dateISO > dateTo)   return false
    if (siteFilter !== "all" && s.site !== siteFilter) return false
    return true
  })

  const showActiveRow = !!(activeShift && (siteFilter === "all" || activeShift.site === siteFilter))
  const totalPages    = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged         = filtered.slice((page - 1) * perPage, page * perPage)
  const hasFilters        = dateFrom !== "" || dateTo !== "" || siteFilter !== "all"
  const mobileFilterCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (siteFilter !== "all" ? 1 : 0)
  const totalCount        = filtered.length + (showActiveRow ? 1 : 0)

  const uniqueSites = Array.from(new Set(MOCK_SHIFTS.map(s => s.site))).sort()

  function resetFilters() { setDateFrom(""); setDateTo(""); setSiteFilter("all"); setPage(1) }
  function changePage(n: number) { setPage(n) }

  const hasRows = showActiveRow || paged.length > 0

  if (employee.status === "invited") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
        <Search className="mb-3 size-8 text-muted-foreground/40" />
        <p className="font-medium">No work history yet</p>
        <p className="mt-1 text-sm text-muted-foreground">This employee has been invited but has not started working yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mobile: Filters button (hidden at @[500px]+) */}
        <div className="flex items-center gap-2 @[500px]:hidden">
          <FiltersButton activeCount={mobileFilterCount} onClick={() => setFilterSheetOpen(true)} />
          {hasFilters && (
            <button type="button" onClick={resetFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Reset <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
        {/* Desktop: Inline filter controls (hidden below @[500px]) */}
        <div className="hidden @[500px]:flex @[500px]:flex-wrap @[500px]:items-end @[500px]:gap-2">
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">From</span>
              <DateButton value={dateFrom} onChange={v => { setDateFrom(v); setPage(1) }} placeholder="Start date" className="w-[160px]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">To</span>
              <DateButton value={dateTo} onChange={v => { setDateTo(v); setPage(1) }} placeholder="End date" className="w-[160px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={siteFilter}
                onChange={e => { setSiteFilter(e.target.value); setPage(1) }}
                className={cn(inputCls(), "w-[180px] appearance-none pr-8")}
              >
                <option value="all">All sites</option>
                {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Reset filters <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        <span className="ml-auto whitespace-nowrap text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetFilters}
        activeCount={mobileFilterCount}
      >
        <FilterSheetSection title="Date range">
          <FilterSheetDateRange
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1) }}
          />
        </FilterSheetSection>
        <FilterSheetSection title="Site">
          <FilterSheetRadioList
            options={uniqueSites.map(s => ({ value: s, label: s }))}
            value={siteFilter === "all" ? "" : siteFilter}
            onChange={v => { setSiteFilter(v || "all"); setPage(1) }}
            allLabel="All sites"
          />
        </FilterSheetSection>
      </MobileFilterSheet>

      {/* Table or empty state */}
      {hasRows ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Date", "Site", "Job role", "Clock in", "Clock out", "Total", "Pay rate", "Flags"].map(col => (
                  <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showActiveRow && <ActiveShiftRow shift={activeShift!} employee={employee} />}
              {paged.map(s => <ShiftRow key={s.id} shift={s} employee={employee} />)}
            </tbody>
          </table>
          </div>{/* end overflow-x-auto */}

          {/* No completed shifts — outside overflow-x-auto so it fills the visible card width */}
          {paged.length === 0 && (
            <div className="px-4 py-10 text-center">
              <div className="flex flex-col items-center justify-center">
                <Search className="mb-3 size-7 text-muted-foreground/40" />
                <p className="text-sm font-medium">No completed shifts match your filters</p>
                <p className="mt-1 text-xs text-muted-foreground">Try adjusting the date range or site filter.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
            {/* Rows per page */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input bg-muted/50 pl-2.5 pr-7 text-xs font-medium transition-colors hover:border-input-hover focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
            </div>

            {/* Page nav — ml-auto pushes right; wraps to new row at narrow widths */}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {/* First/Last hidden at narrow container widths */}
              <button type="button" onClick={() => changePage(1)} disabled={page === 1} aria-label="First page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronsLeft className="size-3.5" />
              </button>
              <button type="button" onClick={() => changePage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="size-3.5" />
              </button>
              {/* Compact page indicator at narrow widths */}
              <span className="inline-flex @[460px]:hidden whitespace-nowrap px-2 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              {/* Numbered page buttons at wider widths */}
              {getPageWindow(page, totalPages).map(n => (
                <button key={n} type="button" onClick={() => changePage(n)} aria-label={`Page ${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "hidden @[460px]:flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    n === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                  )}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="size-3.5" />
              </button>
              <button type="button" onClick={() => changePage(totalPages)} disabled={page === totalPages} aria-label="Last page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
          {hasFilters ? (
            <>
              <Search className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">No entries match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting the date range or site filter.</p>
              <button type="button" onClick={resetFilters}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent">
                <RotateCcw className="size-3.5" />Reset filters
              </button>
            </>
          ) : (
            <>
              <Search className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">No work history recorded</p>
              <p className="mt-1 text-sm text-muted-foreground">Shifts will appear here once this employee clocks in.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Pay Rates Tab ───────────────────────────────────────────────────────────────

type DisplayRateRow = {
  id: string
  jobRole: string
  rate: number
  isOverride: boolean
}

type DisplaySiteGroup = {
  site: string
  siteNumber: string
  lastWorkedISO: string | null
  isActive: boolean
  rows: DisplayRateRow[]
}

type EditRateTarget = {
  id: string
  site: string
  jobRole: string
  rate: number
  lockJobRole: boolean
}

type DeleteRateTarget = {
  id: string
  site: string
  jobRole: string
  isOnlyOverride: boolean
}

function PayRatesTab({ employee, canEdit }: { employee: Employee; canEdit: boolean }) {
  const [rates, setRates]           = useState<PayRateEntry[]>(MOCK_PAY_RATES)
  const [showAll, setShowAll]       = useState(false)
  const [editTarget, setEditTarget] = useState<EditRateTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteRateTarget | null>(null)
  const [addSite, setAddSite]       = useState<string | null>(null)

  const threeMonthsAgoISO = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const siteGroups = useMemo((): DisplaySiteGroup[] => {
    const activeKeys = new Set<string>()
    const siteLastISO = new Map<string, string>()

    for (const shift of MOCK_SHIFTS) {
      const role = shift.jobRole ?? employee.jobRole
      if (shift.dateISO >= threeMonthsAgoISO) activeKeys.add(`${shift.site}::${role}`)
      const cur = siteLastISO.get(shift.site)
      if (!cur || shift.dateISO > cur) siteLastISO.set(shift.site, shift.dateISO)
    }

    const activeSiteRoles = new Map<string, string[]>()
    for (const key of activeKeys) {
      const sep = key.indexOf("::")
      const site = key.slice(0, sep)
      const role = key.slice(sep + 2)
      if (!activeSiteRoles.has(site)) activeSiteRoles.set(site, [])
      activeSiteRoles.get(site)!.push(role)
    }

    const groups: DisplaySiteGroup[] = []

    const activeSiteSet = new Set(activeSiteRoles.keys())

    for (const [site, roles] of activeSiteRoles) {
      // Include shift-derived roles plus any explicitly configured overrides at this site
      const roleSet = new Set(roles)
      for (const r of rates) {
        if (r.site === site && r.isOverride) roleSet.add(r.jobRole)
      }
      const rows: DisplayRateRow[] = Array.from(roleSet).map(jobRole => {
        const override = rates.find(r => r.site === site && r.jobRole === jobRole && r.isOverride)
        return { id: override?.id ?? `dflt::${site}::${jobRole}`, jobRole, rate: override?.rate ?? MINIMUM_WAGE, isOverride: !!override }
      })
      rows.sort((a, b) => (b.isOverride ? 1 : 0) - (a.isOverride ? 1 : 0) || a.jobRole.localeCompare(b.jobRole))
      groups.push({
        site,
        siteNumber: SITE_INFO[site]?.number ?? "",
        lastWorkedISO: siteLastISO.get(site) ?? null,
        isActive: true,
        rows,
      })
    }
    groups.sort((a, b) => a.site.localeCompare(b.site))

    if (showAll) {
      // Inactive: overrides at sites that have no recent shifts at all
      const inactiveRows = rates.filter(r => r.isOverride && !activeSiteSet.has(r.site))
      const inactiveSites = new Map<string, DisplayRateRow[]>()
      for (const r of inactiveRows) {
        if (!inactiveSites.has(r.site)) inactiveSites.set(r.site, [])
        inactiveSites.get(r.site)!.push({ id: r.id, jobRole: r.jobRole, rate: r.rate, isOverride: true })
      }
      const inactive: DisplaySiteGroup[] = []
      for (const [site, rows] of inactiveSites) {
        rows.sort((a, b) => a.jobRole.localeCompare(b.jobRole))
        inactive.push({
          site,
          siteNumber: SITE_INFO[site]?.number ?? "",
          lastWorkedISO: siteLastISO.get(site) ?? null,
          isActive: false,
          rows,
        })
      }
      inactive.sort((a, b) => a.site.localeCompare(b.site))
      groups.push(...inactive)
    }

    return groups
  }, [rates, employee, showAll, threeMonthsAgoISO])

  const activeGroupCount = siteGroups.filter(g => g.isActive).length

  const addSiteExistingRoles = useMemo(
    () => addSite ? (siteGroups.find(g => g.site === addSite)?.rows.map(r => r.jobRole) ?? []) : [],
    [addSite, siteGroups]
  )

  const editExistingRoles = useMemo(
    () => editTarget
      ? rates.filter(r => r.site === editTarget.site && r.id !== editTarget.id && r.isOverride).map(r => r.jobRole)
      : [],
    [editTarget, rates]
  )

  function openEdit(group: DisplaySiteGroup, row: DisplayRateRow) {
    setEditTarget({
      id: row.id,
      site: group.site,
      jobRole: row.jobRole,
      rate: row.isOverride ? row.rate : MINIMUM_WAGE,
      lockJobRole: !row.isOverride,
    })
  }

  function openDelete(group: DisplaySiteGroup, row: DisplayRateRow) {
    const overridesAtSite = group.rows.filter(r => r.isOverride)
    setDeleteTarget({ id: row.id, site: group.site, jobRole: row.jobRole, isOnlyOverride: overridesAtSite.length <= 1 })
  }

  function handleSaveEdit(jobRole: string, rate: number) {
    if (!editTarget) return
    if (editTarget.id.startsWith("dflt::")) {
      setRates(prev => [...prev, { id: `pr-${Date.now()}`, site: editTarget.site, jobRole, rate, isOverride: true }])
    } else {
      setRates(prev => prev.map(r => r.id === editTarget.id ? { ...r, jobRole, rate } : r))
    }
    setEditTarget(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setRates(prev => prev.filter(r => r.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  function handleAddRate(jobRole: string, rate: number) {
    if (!addSite) return
    setRates(prev => [...prev, { id: `pr-${Date.now()}`, site: addSite, jobRole, rate, isOverride: true }])
    setAddSite(null)
  }

  if (employee.status === "invited") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
        <Search className="mb-3 size-8 text-muted-foreground/40" />
        <p className="font-medium">No pay rates yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Pay rates will appear here once this employee starts working at assigned sites.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
          <button type="button" role="switch" aria-checked={showAll} onClick={() => setShowAll(v => !v)}
            className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", showAll ? "bg-primary" : "bg-muted")}>
            <span className={cn("pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform", showAll ? "translate-x-4" : "translate-x-0")} />
          </button>
          Show inactive rates
        </label>
        <p className="text-left @[600px]:text-right text-xs text-muted-foreground @[600px]:max-w-[300px]">
          Showing sites worked in the last 3 months, including sites using the default minimum wage.
        </p>
      </div>

      {activeGroupCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 py-16 text-center">
          <p className="font-medium text-muted-foreground">No active pay rates</p>
          <p className="mt-1 text-sm text-muted-foreground">No recorded hours at any site in the last 3 months.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {siteGroups.map(group => (
          <SiteGroupCard key={group.site} group={group} canEdit={canEdit}
            onAddRate={site => setAddSite(site)}
            onEdit={row => openEdit(group, row)}
            onDelete={row => openDelete(group, row)} />
        ))}
      </div>

      <EditRateDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        target={editTarget}
        existingRoles={editExistingRoles}
        onSave={handleSaveEdit}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove pay rate override"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </button>
            <button type="button" onClick={handleDelete}
              className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90">
              Remove override
            </button>
          </div>
        }>
        {deleteTarget && (
          <div className="flex flex-col gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              The custom rate for <span className="font-medium text-foreground">{deleteTarget.jobRole}</span> at <span className="font-medium text-foreground">{deleteTarget.site}</span> will be removed.
            </p>
            <p className="text-sm text-muted-foreground">
              {deleteTarget.isOnlyOverride
                ? `Future clock-ins at this site will use the default minimum wage (£${MINIMUM_WAGE.toFixed(2)}/hr). Historical timesheet entries remain unchanged.`
                : `Other role rates at this site remain active. Historical timesheet entries remain unchanged.`}
            </p>
          </div>
        )}
      </Dialog>

      <AddAdditionalRateDialog
        open={!!addSite}
        site={addSite ?? ""}
        existingRoles={addSiteExistingRoles}
        onClose={() => setAddSite(null)}
        onAdd={handleAddRate}
      />
    </div>
  )
}

// ─── Row Action Menu ─────────────────────────────────────────────────────────────

function RowActionMenu({
  row,
  onEdit,
  onDelete,
}: {
  row: DisplayRateRow
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  const disabled = !row.isOverride

  function handleOpen() {
    if (disabled || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuH = 92
    const right = window.innerWidth - rect.right
    if (window.innerHeight - rect.bottom >= menuH + 8) {
      setPos({ top: rect.bottom + 4, right })
    } else {
      setPos({ bottom: window.innerHeight - rect.top + 4, right })
    }
    setOpen(v => !v)
  }

  return (
    <div ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        title={disabled ? "No actions available for default minimum wage" : undefined}
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors",
          disabled
            ? "cursor-not-allowed text-muted-foreground/30"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          style={{ position: "fixed", zIndex: 50, ...pos }}
          className="w-44 rounded-xl border border-border bg-background shadow-lg"
        >
          <div className="p-1">
            <button type="button"
              onClick={() => { setOpen(false); onEdit() }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent">
              <Edit2 className="size-3.5 shrink-0 text-muted-foreground" />
              Edit entry
            </button>
            <button type="button"
              onClick={() => { setOpen(false); onDelete() }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left text-destructive transition-colors hover:bg-destructive/10">
              <Trash2 className="size-3.5 shrink-0" />
              Delete entry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Site Group Card ──────────────────────────────────────────────────────────────

function SiteGroupCard({
  group, canEdit, onAddRate, onEdit, onDelete,
}: {
  group: DisplaySiteGroup
  canEdit: boolean
  onAddRate: (site: string) => void
  onEdit: (row: DisplayRateRow) => void
  onDelete: (row: DisplayRateRow) => void
}) {
  return (
    <div className={cn(
      "overflow-hidden rounded-xl border border-border",
      group.isActive ? "bg-card" : "bg-muted/40"
    )}>
      {/* Site header */}
      <div className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        group.isActive ? "bg-muted/70" : ""
      )}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-base font-semibold", !group.isActive && "text-muted-foreground")}>{group.site}</span>
            {!group.isActive && (
              <Badge variant="neutral">Inactive</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {group.siteNumber && <span className="shrink-0">{group.siteNumber}</span>}
            {group.siteNumber && group.lastWorkedISO && (
              <span className="size-1 shrink-0 rounded-full bg-muted-foreground/40" />
            )}
            {group.lastWorkedISO && <span>Last worked: {formatISODate(group.lastWorkedISO)}</span>}
          </div>
        </div>
        {canEdit && group.isActive && (
          <button type="button" onClick={() => onAddRate(group.site)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <Plus className="size-3.5" />Add additional rate
          </button>
        )}
      </div>

      {/* Rate rows */}
      <div className="divide-y divide-border">
        {group.rows.map((row) => (
          <div key={row.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5">
            <div className="min-w-0">
              <p className={cn("text-xs", group.isActive ? "text-muted-foreground" : "text-muted-foreground/70")}>Job role</p>
              <p className={cn("text-sm font-medium", !group.isActive && "text-muted-foreground")}>{row.jobRole}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <p className={cn("text-sm font-medium tabular-nums", !group.isActive && "text-muted-foreground")}>£{row.rate.toFixed(2)}/hr</p>
                <p className="text-xs text-muted-foreground">
                  {row.isOverride ? "Custom rate" : "Default minimum wage"}
                </p>
              </div>
              {canEdit && (
                <RowActionMenu
                  row={row}
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edit Rate Dialog ─────────────────────────────────────────────────────────────

function EditRateDialog({
  open, onClose, target, existingRoles, onSave,
}: {
  open: boolean
  onClose: () => void
  target: EditRateTarget | null
  existingRoles: string[]
  onSave: (jobRole: string, rate: number) => void
}) {
  const [jobRole, setJobRole] = useState("")
  const [rate, setRate]       = useState("")
  const [errors, setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && target) {
      setJobRole(target.jobRole)
      setRate(target.rate.toFixed(2))
      setErrors({})
    }
  }, [open, target])

  function validate() {
    const e: Record<string, string> = {}
    if (!jobRole) e.jobRole = "Job role is required."
    else if (existingRoles.includes(jobRole)) e.jobRole = "This role already has a rate at this site."
    const n = parseFloat(rate)
    if (!rate || isNaN(n) || n <= 0) e.rate = "Enter a valid pay rate."
    else if (n < MINIMUM_WAGE) e.rate = `Must be at least £${MINIMUM_WAGE.toFixed(2)}/hr (minimum wage).`
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(jobRole, parseFloat(rate))
  }

  if (!target) return null
  const isSettingOverride = target.id.startsWith("dflt::")

  return (
    <Dialog open={open} onClose={onClose} title={isSettingOverride ? "Set custom rate" : "Edit pay rate"}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
          <button type="button" onClick={handleSave}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            {isSettingOverride ? "Set rate" : "Save changes"}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Site</span>
          <div className="inline-flex items-center gap-1.5 self-start rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium text-foreground">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            {target.site}
          </div>
        </div>
        {target.lockJobRole ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Job role</label>
            <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
              {target.jobRole}
            </div>
          </div>
        ) : (
          <Field label="Job role" required error={errors.jobRole}>
            <div className="relative">
              <select value={jobRole} onChange={e => { setJobRole(e.target.value); setErrors(p => ({ ...p, jobRole: "" })) }}
                className={cn(inputCls(!!errors.jobRole), "appearance-none pr-8")}>
                <option value="">Select a role…</option>
                {JOB_ROLES.map(r => (
                  <option key={r} value={r} disabled={existingRoles.includes(r)}>{r}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
            </div>
          </Field>
        )}
        <Field label="Pay rate (£/hr)" required error={errors.rate} hint={`Minimum wage: £${MINIMUM_WAGE.toFixed(2)}/hr`}>
          <input type="number" step="0.01" min={MINIMUM_WAGE} value={rate}
            onChange={e => { setRate(e.target.value); setErrors(p => ({ ...p, rate: "" })) }}
            placeholder={MINIMUM_WAGE.toFixed(2)} className={inputCls(!!errors.rate)} />
        </Field>
      </div>
    </Dialog>
  )
}

// ─── Add Additional Rate Dialog ────────────────────────────────────────────────────

function AddAdditionalRateDialog({
  open, site, existingRoles, onClose, onAdd,
}: {
  open: boolean
  site: string
  existingRoles: string[]
  onClose: () => void
  onAdd: (jobRole: string, rate: number) => void
}) {
  const [jobRole, setJobRole] = useState("")
  const [rate, setRate]       = useState("")
  const [errors, setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) { setJobRole(""); setRate(""); setErrors({}) }
  }, [open])

  const availableRoles = JOB_ROLES.filter(r => !existingRoles.includes(r))

  function validate() {
    const e: Record<string, string> = {}
    if (!jobRole) e.jobRole = "Job role is required."
    else if (existingRoles.includes(jobRole)) e.jobRole = "This role already has a rate at this site."
    const n = parseFloat(rate)
    if (!rate || isNaN(n) || n <= 0) e.rate = "Enter a valid pay rate."
    else if (n < MINIMUM_WAGE) e.rate = `Must be at least £${MINIMUM_WAGE.toFixed(2)}/hr (minimum wage).`
    return e
  }

  function handle() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onAdd(jobRole, parseFloat(rate))
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add additional rate"
      footer={
        availableRoles.length > 0 ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </button>
            <button type="button" onClick={handle}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Add rate
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Close
            </button>
          </div>
        )
      }>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Adding rate for</span>
          <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{site}</p>
              {SITE_INFO[site]?.number && (
                <p className="text-xs text-muted-foreground">{SITE_INFO[site].number}</p>
              )}
            </div>
          </div>
        </div>
        {availableRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">All job roles already have a rate configured at this site.</p>
        ) : (
          <>
            <Field label="Job role" required error={errors.jobRole}>
              <div className="relative">
                <select value={jobRole} onChange={e => { setJobRole(e.target.value); setErrors(p => ({ ...p, jobRole: "" })) }}
                  className={cn(inputCls(!!errors.jobRole), "appearance-none pr-8")}>
                  <option value="">Select a role…</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
              </div>
            </Field>
            <Field label="Pay rate (£/hr)" required error={errors.rate} hint={`Minimum wage: £${MINIMUM_WAGE.toFixed(2)}/hr`}>
              <input type="number" step="0.01" min={MINIMUM_WAGE} value={rate}
                onChange={e => { setRate(e.target.value); setErrors(p => ({ ...p, rate: "" })) }}
                placeholder={MINIMUM_WAGE.toFixed(2)} className={inputCls(!!errors.rate)} />
            </Field>
          </>
        )}
      </div>
    </Dialog>
  )
}

// ─── Holiday Hours Tab ───────────────────────────────────────────────────────────

function HolidayRowActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
        items[next]?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    setTimeout(() => { (menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus() }, 10)
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey) }
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  function pick(action: () => void) {
    return (e: React.MouseEvent) => { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); action() }
  }

  return (
    <div ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-accent text-accent-foreground",
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
          className="w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button role="menuitem" type="button" onClick={pick(onEdit)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
            Edit entry
          </button>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button role="menuitem" type="button" onClick={pick(onDelete)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10">
            <Trash2 className="size-3.5 shrink-0" />
            Delete entry
          </button>
        </div>
      )}
    </div>
  )
}

function HolidayHoursTab({ canEdit, employee }: { canEdit: boolean; employee: Employee }) {
  const [entries, setEntries]           = useState<HolidayEntry[]>(MOCK_HOLIDAY_ENTRIES)
  const [showAdd, setShowAdd]           = useState(false)
  const [editingEntry, setEditingEntry] = useState<HolidayEntry | null>(null)
  const [deleteId, setDeleteId]         = useState<string | null>(null)

  const OPENING_BALANCE = 28
  const ACCRUED_THIS_YEAR = 144.84
  const totalAccrued = OPENING_BALANCE + ACCRUED_THIS_YEAR
  const totalTaken   = entries.reduce((s, e) => s + e.hours, 0)
  const remaining    = totalAccrued - totalTaken

  if (employee.status === "invited") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
        <Calendar className="mb-3 size-8 text-muted-foreground/40" />
        <p className="font-medium">No holiday hours yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Holiday hours will become available once this employee starts working.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-1.5 self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          Holiday year: 1 Nov 2025 – 31 Oct 2026
        </div>
        <div className="grid grid-cols-1 @[480px]:grid-cols-3 gap-3">
          <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-muted/40 px-4 py-4 @[480px]:px-5 @[480px]:py-5">
            <p className="text-xs text-muted-foreground">Total accrued</p>
            <p className="text-2xl font-semibold tabular-nums">{totalAccrued.toFixed(2)}h</p>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-muted/40 px-4 py-4 @[480px]:px-5 @[480px]:py-5">
            <p className="text-xs text-muted-foreground">Hours taken</p>
            <p className="text-2xl font-semibold tabular-nums">{totalTaken.toFixed(2)}h</p>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-muted/40 px-4 py-4 @[480px]:px-5 @[480px]:py-5">
            <p className="text-xs text-muted-foreground">Remaining balance</p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{remaining.toFixed(2)}h</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Holiday entries</h3>
        {canEdit && (
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <Plus className="size-3.5" />Add holiday hours
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        {entries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Logged by</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{formatHolidayDate(entry.dateFrom)} – {formatHolidayDate(entry.dateTo)}</td>
                  <td className="px-4 py-3 tabular-nums">{entry.hours}h</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.loggedBy}</td>
                  <td className="px-2 py-3">
                    {canEdit && (
                      <div className="flex justify-end">
                        <HolidayRowActionMenu
                          onEdit={() => setEditingEntry(entry)}
                          onDelete={() => setDeleteId(entry.id)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No holiday entries recorded.
          </div>
        )}
      </div>

      <HolidayDialog open={showAdd} onClose={() => setShowAdd(false)} remainingBalance={remaining}
        onSave={data => setEntries(prev => [{ ...data, id: `h-${Date.now()}`, loggedBy: "Admin" }, ...prev])} />

      <HolidayDialog open={!!editingEntry} onClose={() => setEditingEntry(null)} entry={editingEntry ?? undefined}
        remainingBalance={remaining + (editingEntry?.hours ?? 0)}
        onSave={data => {
          setEntries(prev => prev.map(e => e.id === editingEntry?.id ? { ...e, ...data } : e))
          setEditingEntry(null)
        }} />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete holiday entry"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteId(null)}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={() => { setEntries(prev => prev.filter(e => e.id !== deleteId)); setDeleteId(null) }}
              className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50">
              Delete entry
            </button>
          </div>
        }>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">This holiday entry will be permanently removed. This action cannot be undone.</p>
        </div>
      </Dialog>
    </div>
  )
}

// ─── Holiday Add/Edit Dialog ─────────────────────────────────────────────────────

function HolidayDialog({
  open, onClose, entry, remainingBalance, onSave,
}: {
  open: boolean; onClose: () => void
  entry?: HolidayEntry
  remainingBalance: number
  onSave: (data: Pick<HolidayEntry, "dateFrom" | "dateTo" | "hours">) => void
}) {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [hours, setHours]       = useState("")
  const [errors, setErrors]     = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setDateFrom(entry?.dateFrom ?? ""); setDateTo(entry?.dateTo ?? "")
      setHours(entry ? String(entry.hours) : ""); setErrors({})
    }
  }, [open, entry])

  function handle() {
    const e: Record<string, string> = {}
    if (!dateFrom) e.dateFrom = "Start date is required."
    if (!dateTo) e.dateTo = "End date is required."
    if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) e.hours = "Enter a valid number of hours."
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ dateFrom, dateTo, hours: Number(hours) })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={entry ? "Edit holiday entry" : "Add holiday hours"}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handle}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {entry ? "Save changes" : "Add holiday hours"}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" required error={errors.dateFrom}>
            <DateButton value={dateFrom} onChange={setDateFrom} placeholder="Select date" className="w-full" />
          </Field>
          <Field label="To" required error={errors.dateTo}>
            <DateButton value={dateTo} onChange={setDateTo} placeholder="Select date" className="w-full" />
          </Field>
        </div>
        <Field label="Hours" required error={errors.hours}>
          <input type="number" min="0" step="0.5" value={hours} onChange={e => setHours(e.target.value)}
            placeholder="e.g. 40" className={inputCls(!!errors.hours)} />
          <div className="inline-flex items-center gap-1.5 self-start rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            Remaining balance: {remainingBalance.toFixed(2)}h
          </div>
        </Field>
      </div>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function EmployeeProfilePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { role } = useRole()

  const [employee, setEmployee] = useState<Employee | null>(
    () => EMPLOYEES_DATA.find(e => e.id === id) ?? null
  )
  const [activeTab, setActiveTab]           = useState<ProfileTab>("overview")
  const [showEdit, setShowEdit]             = useState(false)
  const [showArchive, setShowArchive]       = useState(false)
  const [showReinstate, setShowReinstate]   = useState(false)
  const [showActiveShiftBlock, setShowActiveShiftBlock] = useState(false)

  const canArchive  = role === "super-admin" || role === "head-office"
  const canAdjust   = role === "super-admin" || role === "head-office" || role === "head-of-area"

  const TABS: { id: ProfileTab; label: string }[] = [
    { id: "overview",      label: "Overview" },
    { id: "work-history",  label: "Work history" },
    { id: "pay-rates",     label: "Pay rates" },
    { id: "holiday-hours", label: "Holiday hours" },
  ]

  if (!employee) {
    return (
      <div className="flex flex-col gap-6">
        <button type="button" onClick={() => router.push("/employees")}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted"
          aria-label="Back to employees">
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 py-16 text-center">
          <p className="font-medium text-muted-foreground">Employee not found</p>
          <p className="mt-1 text-sm text-muted-foreground">No employee with ID {id} exists.</p>
        </div>
      </div>
    )
  }

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`
  const activeShift = (employee.id === "1" && employee.status === "active")
    ? MOCK_SHIFTS.find(s => s.clockOut === null) ?? null
    : null

  function handleArchiveClick() {
    if (activeShift) {
      setShowActiveShiftBlock(true)
    } else {
      setShowArchive(true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div className="@container">
        <div className="flex flex-col gap-3 @[520px]:flex-row @[520px]:items-center @[520px]:justify-between @[520px]:gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.push("/employees")}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted"
              aria-label="Back to employees">
              <ChevronLeft className="size-4" />
            </button>
            <div className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold",
              employee.status === "archived" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            )}>
              {initials}
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="whitespace-nowrap text-xl font-semibold">{employee.firstName} {employee.lastName}</h1>
              <span className="hidden @[355px]:block"><EmployeeStatusBadge status={employee.status} /></span>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 @[520px]:w-auto @[520px]:shrink-0">
            {employee.status !== "archived" && (
              <button type="button" onClick={() => setShowEdit(true)}
                className="inline-flex h-9 flex-1 @[520px]:flex-none items-center justify-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent">
                <Edit2 className="size-4" />Edit
              </button>
            )}
            {canArchive && employee.status === "active" && (
              <button type="button" onClick={handleArchiveClick}
                className="inline-flex h-9 flex-1 @[520px]:flex-none items-center justify-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent">
                Archive
              </button>
            )}
            {canArchive && employee.status === "archived" && (
              <button type="button" onClick={() => setShowReinstate(true)}
                className="inline-flex h-9 flex-1 @[520px]:flex-none items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Reinstate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabSwitcher tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "overview"      && <OverviewTab employee={employee} activeShift={activeShift} />}
      {activeTab === "work-history"  && <WorkHistoryTab employee={employee} />}
      {activeTab === "pay-rates"     && <PayRatesTab employee={employee} canEdit />}
      {activeTab === "holiday-hours" && <HolidayHoursTab canEdit employee={employee} />}

      {/* Overlays */}
      <EditEmployeeDialog open={showEdit} onClose={() => setShowEdit(false)} employee={employee}
        onSave={updated => setEmployee(prev => prev ? { ...prev, ...updated } : prev)} />

      <ArchiveDialog open={showArchive} onClose={() => setShowArchive(false)} employee={employee}
        onConfirm={() => { setEmployee(prev => prev ? { ...prev, status: "archived" } : prev); setShowArchive(false) }} />

      <ActiveShiftBlockDialog open={showActiveShiftBlock} onClose={() => setShowActiveShiftBlock(false)} />

      <ReinstateDialog open={showReinstate} onClose={() => setShowReinstate(false)} employee={employee}
        onConfirm={() => { setEmployee(prev => prev ? { ...prev, status: "active" } : prev); setShowReinstate(false) }} />
    </div>
  )
}
