"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search, Plus, Pencil, Archive, AlertTriangle, AlertCircle,
  X, Loader2, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw,
  Building2, EllipsisVertical, ChevronDown, CheckCircle2,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

type LegalCompany = "Spectrum Clean" | "Spectrum Facilities Maintenance"

interface Customer {
  id: string
  code: string
  name: string
  legalCompany: LegalCompany
}

// ── Reference Data ─────────────────────────────────────────────────────────────

const LEGAL_COMPANIES: LegalCompany[] = [
  "Spectrum Clean",
  "Spectrum Facilities Maintenance",
]

const PAGE_SIZE = 5

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

// ── Sample Data ────────────────────────────────────────────────────────────────

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", code: "GRH", name: "Greenhart Holdings",        legalCompany: "Spectrum Clean" },
  { id: "c2", code: "MTC", name: "Metroplex Trading Co.",      legalCompany: "Spectrum Facilities Maintenance" },
  { id: "c3", code: "CRP", name: "Crestview Properties",       legalCompany: "Spectrum Clean" },
  { id: "c4", code: "BLU", name: "Bluewater Urban Ltd",        legalCompany: "Spectrum Facilities Maintenance" },
  { id: "c5", code: "AXL", name: "Axler Group",                legalCompany: "Spectrum Clean" },
  { id: "c6", code: "HPT", name: "Highpoint Estates",          legalCompany: "Spectrum Clean" },
  { id: "c7", code: "WRF", name: "Warfield Commercial",        legalCompany: "Spectrum Facilities Maintenance" },
  { id: "c8", code: "STV", name: "Staveley Facilities",        legalCompany: "Spectrum Facilities Maintenance" },
]

// Active site counts per customer id — determines archive eligibility
const INITIAL_SITE_COUNTS: Record<string, number> = {
  c1: 3,  // has active sites — blocked from archive
  c2: 2,  // has active sites — blocked
  c3: 1,  // has active sites — blocked
  c4: 2,  // has active sites — blocked
  c5: 0,  // zero sites — eligible for archive
  c6: 1,  // has active sites — blocked
  c7: 0,  // zero sites — eligible for archive
  c8: 3,  // has active sites — blocked
}

// ── Toast ──────────────────────────────────────────────────────────────────────

type ToastItem = { id: number; message: string; variant: "success" | "error" }

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium min-w-72 max-w-sm",
          t.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
          t.variant === "error"   && "border-destructive/20 bg-destructive/5 text-destructive",
        )}>
          {t.variant === "success" && <CheckCircle2 className="size-4 shrink-0" />}
          {t.variant === "error"   && <AlertCircle  className="size-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── CSS helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive hover:border-destructive focus:ring-destructive/30"
const selectCls =
  "h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
const btnPrimary =
  "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
const btnOutline =
  "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
const btnDestructive =
  "inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"

// ── Primitive UI ───────────────────────────────────────────────────────────────

function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Modal({
  open, onClose, title, children, lockClose = false,
}: {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, lockClose, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!lockClose ? onClose : undefined} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-xl border border-border bg-background shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button onClick={onClose} className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-4" /><span className="sr-only">Close</span>
            </button>
          )}
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function CustomerRowActionMenu({
  onEdit,
  onArchive,
}: {
  onEdit: () => void
  onArchive: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
        items[next]?.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    setTimeout(() => {
      const first = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null
      first?.focus()
    }, 10)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  return (
    <div ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${open ? "bg-accent text-accent-foreground" : ""}`}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
          className="w-44 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); onEdit() }}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <Pencil className="size-3.5 shrink-0" />
            Edit Customer
          </button>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            role="menuitem"
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); onArchive() }}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
          >
            <Archive className="size-3.5 shrink-0" />
            Archive Customer
          </button>
        </div>
      )}
    </div>
  )
}

// ── Customer Form (shared: Create + Edit) ─────────────────────────────────────

function CustomerForm({
  existingCodes,
  editingId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  existingCodes: string[]
  editingId?: string
  initial?: { code: string; name: string; legalCompany: LegalCompany | "" }
  submitLabel: string
  onSubmit: (code: string, name: string, legalCompany: LegalCompany) => void
  onCancel: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? "")
  const [name, setName] = useState(initial?.name ?? "")
  const [legalCompany, setLegalCompany] = useState<LegalCompany | "">(initial?.legalCompany ?? "")
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const originalCode = initial?.code ?? ""
  const codeChanged = !!editingId && code.trim().toUpperCase() !== originalCode.toUpperCase()

  const codeVal = code.trim()
  const codeError = !codeVal
    ? "Customer Code is required."
    : codeVal.length !== 3
    ? "Customer code must be exactly 3 characters."
    : existingCodes.includes(codeVal.toLowerCase())
    ? "This customer code is already in use."
    : null
  const nameError = !name.trim() ? "Customer name is required." : null
  const legalError = !legalCompany ? "Select a legal company." : null
  const isValid = !codeError && !nameError && !legalError

  async function handleSubmit() {
    setSubmitted(true)
    if (!isValid || !legalCompany) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    onSubmit(codeVal.toUpperCase(), name.trim(), legalCompany)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 px-5 py-5">
        {/* Customer Code */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Customer Code <span className="text-destructive">*</span>
          </label>
          <input
            className={`${inputCls} font-mono uppercase tracking-widest ${submitted && codeError ? inputErrCls : ""}`}
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. GRH"
            maxLength={5}
            disabled={saving}
          />
          {submitted && codeError ? (
            <p className="text-xs text-destructive">{codeError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Enter a unique 3-character code.</p>
          )}
          {codeChanged && !codeError && (
            <WarningNote>
              Changing the customer code will update all associated Site records automatically.
            </WarningNote>
          )}
        </div>

        {/* Customer Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Customer Name <span className="text-destructive">*</span>
          </label>
          <input
            className={`${inputCls} ${submitted && nameError ? inputErrCls : ""}`}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Greenhart Holdings"
            disabled={saving}
          />
          {submitted && nameError && (
            <p className="text-xs text-destructive">{nameError}</p>
          )}
        </div>

        {/* Legal Company */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Legal Company <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              className={`${selectCls} ${submitted && legalError ? "border-destructive" : ""}`}
              value={legalCompany}
              onChange={e => setLegalCompany(e.target.value as LegalCompany | "")}
              disabled={saving}
            >
              <option value="">Select legal company…</option>
              {LEGAL_COMPANIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
          </div>
          {submitted && legalError && (
            <p className="text-xs text-destructive">{legalError}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button onClick={onCancel} disabled={saving} className={btnOutline}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  )
}

// ── Archive Modal ──────────────────────────────────────────────────────────────

function ArchiveModal({
  customer,
  siteCount,
  onConfirm,
  onCancel,
}: {
  customer: Customer
  siteCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const [archiving, setArchiving] = useState(false)
  const hasActiveSites = siteCount > 0

  async function handleArchive() {
    setArchiving(true)
    await new Promise(r => setTimeout(r, 800))
    setArchiving(false)
    onConfirm()
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      {hasActiveSites ? (
        <>
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive">Cannot archive this Customer</p>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>{customer.name}</strong> has {siteCount} active{" "}
              {siteCount === 1 ? "Site" : "Sites"}. All Sites must be archived before this Customer can be archived.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Go to the Sites list to archive or reassign the remaining Sites.
          </p>
          <div className="flex justify-end border-t border-border pt-4">
            <button onClick={onCancel} className={btnOutline}>
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Archiving <strong>{customer.name}</strong> will make it inactive. It will no
            longer appear in the Customers list.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={onCancel} disabled={archiving} className={btnOutline}>
              Cancel
            </button>
            <button onClick={handleArchive} disabled={archiving} className={btnDestructive}>
              {archiving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Archiving…
                </>
              ) : (
                "Archive Customer"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { role } = useRole()
  const canManage = role === "super-admin" || role === "head-office"

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [siteCounts, setSiteCounts] = useState<Record<string, number>>(INITIAL_SITE_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [archiveCustomer, setArchiveCustomer] = useState<Customer | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastId = useRef(0)

  function addToast(message: string, variant: ToastItem["variant"] = "success") {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  useEffect(() => {
    setLoading(true)
    setError(false)
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  function handleRetry() {
    setLoading(true)
    setError(false)
    setTimeout(() => setLoading(false), 700)
  }

  useEffect(() => { setPage(1) }, [search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  function handleCreate(code: string, name: string, legalCompany: LegalCompany) {
    const id = `c-${Date.now()}`
    setCustomers(prev => [...prev, { id, code, name, legalCompany }])
    setSiteCounts(prev => ({ ...prev, [id]: 0 }))
    setCreateOpen(false)
    addToast(`${name} created successfully.`)
  }

  function handleEdit(customerId: string, code: string, name: string, legalCompany: LegalCompany) {
    setCustomers(prev =>
      prev.map(c => c.id === customerId ? { ...c, code, name, legalCompany } : c)
    )
    setEditCustomer(null)
    addToast(`${name} updated successfully.`)
  }

  function handleArchive(customerId: string) {
    setCustomers(prev => prev.filter(c => c.id !== customerId))
    setSiteCounts(prev => {
      const next = { ...prev }
      delete next[customerId]
      return next
    })
    setArchiveCustomer(null)
  }

  const existingCodes = customers.map(c => c.code.toLowerCase())

  // ── HoA / AM — no access ────────────────────────────────────────────────────

  if (role === "head-of-area" || role === "area-manager") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {role === "head-of-area" ? "Heads of Area" : "Area Managers"} do not have access to Customer Management.
          </p>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-48 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer Code</th>
                <th className="pl-10 pr-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer Name</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sites</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><div className="h-3.5 w-10 animate-pulse rounded bg-muted" /></td>
                  <td className="pl-10 pr-4 py-3"><div className="h-3.5 w-48 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-3.5 w-6 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="ml-auto h-7 w-7 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer accounts and their associated Sites.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">Unable to load Customers</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Something went wrong. Please try again.</p>
          </div>
          <button onClick={handleRetry} className={btnOutline}>
            <RotateCcw className="size-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Populated render ────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer accounts and their associated Sites.
            </p>
          </div>
          {canManage && (
            <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
              <Plus className="size-4" />
              Create Customer
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by customer name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Empty state (no customers at all) */}
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No Customers yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Create your first Customer to get started.
              </p>
            </div>
            {canManage && (
              <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
                <Plus className="size-4" />
                Create Customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-48 px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Customer Code
                  </th>
                  <th className="pl-10 pr-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Customer Name
                  </th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Sites
                  </th>
                  {canManage && <th className="w-16 px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 4 : 3}
                      className="px-4 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="size-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No customers found for{" "}
                          <span className="font-medium">"{search}"</span>
                        </p>
                        <button
                          onClick={() => setSearch("")}
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map(customer => (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                          {customer.code}
                        </span>
                      </td>
                      <td className="pl-10 pr-4 py-3 font-medium">{customer.name}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {siteCounts[customer.id] ?? 0}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <CustomerRowActionMenu
                              onEdit={() => setEditCustomer(customer)}
                              onArchive={() => setArchiveCustomer(customer)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination footer */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {start}–{end} of {filtered.length}{" "}
                  {filtered.length === 1 ? "customer" : "customers"}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={currentPage <= 1}
                    className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronsLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
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
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronsRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Customer */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Customer">
        <CustomerForm
          existingCodes={existingCodes}
          submitLabel="Create Customer"
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit Customer */}
      <Modal open={!!editCustomer} onClose={() => setEditCustomer(null)} title="Edit Customer">
        {editCustomer && (
          <CustomerForm
            existingCodes={existingCodes.filter(c => c !== editCustomer.code.toLowerCase())}
            editingId={editCustomer.id}
            initial={{
              code: editCustomer.code,
              name: editCustomer.name,
              legalCompany: editCustomer.legalCompany,
            }}
            submitLabel="Save changes"
            onSubmit={(code, name, legalCompany) =>
              handleEdit(editCustomer.id, code, name, legalCompany)
            }
            onCancel={() => setEditCustomer(null)}
          />
        )}
      </Modal>

      {/* Archive Customer */}
      <Modal
        open={!!archiveCustomer}
        onClose={() => setArchiveCustomer(null)}
        title="Archive Customer"
      >
        {archiveCustomer && (
          <ArchiveModal
            customer={archiveCustomer}
            siteCount={siteCounts[archiveCustomer.id] ?? 0}
            onConfirm={() => handleArchive(archiveCustomer.id)}
            onCancel={() => setArchiveCustomer(null)}
          />
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </>
  )
}
