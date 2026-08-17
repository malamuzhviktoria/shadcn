"use client"

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react"
import {
  AlertCircle, AlertTriangle, Archive, Check, CheckCircle, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CircleCheck, CirclePlus, EllipsisVertical,
  Loader2, Mail, Pencil, Plus, RotateCcw, Search, Send,
  UserX, Users, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { AlertBox } from "@/components/modal-alert"
import { usePopoverStyle } from "@/components/filter-dropdown"
import { FiltersButton, FilterSheetSection, FilterSheetCheckboxList, MobileFilterSheet } from "@/components/mobile-filter-sheet"

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminRole = "head-office" | "head-of-area" | "area-manager"
type UserStatus = "active" | "pending" | "deactivated"

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  role: AdminRole
  status: UserStatus
  assignedAreaId: string | null
  assignedAreaName: string | null
  assignedSiteCount: number
}

type UserDialog =
  | { type: "create" }
  | { type: "edit"; user: AdminUser }
  | { type: "deactivate-confirm"; user: AdminUser }
  | { type: "deactivate-blocked-hoa"; user: AdminUser }
  | { type: "deactivate-blocked-am"; user: AdminUser }
  | { type: "resend"; user: AdminUser }
  | null

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_ORDER: AdminRole[] = ["head-office", "head-of-area", "area-manager"]

const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  "head-office":  "Head Office",
  "head-of-area": "Head of Area",
  "area-manager": "Area Manager",
}

const DEFAULT_PER_PAGE = 10

// ── Sample Data ───────────────────────────────────────────────────────────────

const INITIAL_USERS: AdminUser[] = [
  { id: "u1", firstName: "Christine", lastName: "Lawson",    name: "Christine Lawson",   email: "christine.lawson@spectrumclean.co.uk",  role: "head-office",  status: "active",      assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 0 },
  { id: "u2", firstName: "Oliver",    lastName: "Pemberton", name: "Oliver Pemberton",   email: "oliver.pemberton@spectrumclean.co.uk",  role: "head-office",  status: "active",      assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 0 },
  { id: "u3", firstName: "Sarah",     lastName: "Whitmore",  name: "Sarah Whitmore",     email: "sarah.whitmore@spectrumclean.co.uk",    role: "head-of-area", status: "active",      assignedAreaId: "a1", assignedAreaName: "North Area",  assignedSiteCount: 0 },
  { id: "u4", firstName: "Marcus",    lastName: "Reid",      name: "Marcus Reid",        email: "marcus.reid@spectrumclean.co.uk",       role: "head-of-area", status: "active",      assignedAreaId: "a2", assignedAreaName: "South Area",  assignedSiteCount: 0 },
  { id: "u5", firstName: "Fiona",     lastName: "Holt",      name: "Fiona Holt",         email: "fiona.holt@spectrumclean.co.uk",        role: "head-of-area", status: "active",      assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 0 },
  { id: "u6", firstName: "Patricia",  lastName: "Nolan",     name: "Patricia Nolan",     email: "patricia.nolan@spectrumclean.co.uk",    role: "head-of-area", status: "pending",     assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 0 },
  { id: "u7", firstName: "Alex",      lastName: "Thompson",  name: "Alex Thompson",      email: "alex.thompson@spectrumclean.co.uk",     role: "area-manager", status: "active",      assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 4 },
  { id: "u8", firstName: "Rachel",    lastName: "Moore",     name: "Rachel Moore",       email: "rachel.moore@spectrumclean.co.uk",      role: "area-manager", status: "active",      assignedAreaId: null, assignedAreaName: null,          assignedSiteCount: 0 },
  { id: "u9",  firstName: "Daniel",    lastName: "Forsyth",   name: "Daniel Forsyth",     email: "daniel.forsyth@spectrumclean.co.uk",    role: "area-manager", status: "deactivated", assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 0 },
  { id: "u10", firstName: "Joanna",   lastName: "Clarke",    name: "Joanna Clarke",      email: "joanna.clarke@spectrumclean.co.uk",     role: "head-of-area", status: "active",      assignedAreaId: "a3",  assignedAreaName: "East Midlands Area",   assignedSiteCount: 0 },
  { id: "u11", firstName: "Patricia", lastName: "Nolan",     name: "Patricia Nolan",     email: "patricia.nolan2@spectrumclean.co.uk",   role: "head-of-area", status: "active",      assignedAreaId: "a4",  assignedAreaName: "Yorkshire Area",       assignedSiteCount: 0 },
  { id: "u12", firstName: "Daniel",   lastName: "Forsyth",   name: "Daniel Forsyth",     email: "daniel.forsyth2@spectrumclean.co.uk",   role: "head-of-area", status: "active",      assignedAreaId: "a5",  assignedAreaName: "East Anglia Area",     assignedSiteCount: 0 },
  { id: "u13", firstName: "Caroline", lastName: "Bates",     name: "Caroline Bates",     email: "caroline.bates@spectrumclean.co.uk",    role: "head-of-area", status: "active",      assignedAreaId: "a7",  assignedAreaName: "South East Area",      assignedSiteCount: 0 },
  { id: "u14", firstName: "David",    lastName: "Lennox",    name: "David Lennox",        email: "david.lennox@spectrumclean.co.uk",      role: "head-of-area", status: "active",      assignedAreaId: "a8",  assignedAreaName: "South West Area",      assignedSiteCount: 0 },
  { id: "u15", firstName: "Emily",    lastName: "Cross",     name: "Emily Cross",         email: "emily.cross@spectrumclean.co.uk",       role: "head-of-area", status: "pending",     assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 0 },
  { id: "u16", firstName: "Callum",   lastName: "Fraser",    name: "Callum Fraser",       email: "callum.fraser@spectrumclean.co.uk",     role: "head-of-area", status: "active",      assignedAreaId: "a10", assignedAreaName: "Scotland Area",        assignedSiteCount: 0 },
  { id: "u17", firstName: "Owen",     lastName: "Roberts",   name: "Owen Roberts",        email: "owen.roberts@spectrumclean.co.uk",      role: "head-of-area", status: "active",      assignedAreaId: "a11", assignedAreaName: "Wales Area",           assignedSiteCount: 0 },
  { id: "u18", firstName: "Nisha",    lastName: "Patel",     name: "Nisha Patel",         email: "nisha.patel@spectrumclean.co.uk",       role: "head-of-area", status: "active",      assignedAreaId: "a12", assignedAreaName: "Greater Manchester Area", assignedSiteCount: 0 },
  { id: "u19", firstName: "Tom",      lastName: "Whitfield", name: "Tom Whitfield",       email: "tom.whitfield@spectrumclean.co.uk",     role: "head-of-area", status: "active",      assignedAreaId: "a13", assignedAreaName: "Greater London Area",  assignedSiteCount: 0 },
  { id: "u20", firstName: "Grace",    lastName: "Henderson", name: "Grace Henderson",     email: "grace.henderson@spectrumclean.co.uk",   role: "head-of-area", status: "pending",     assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 0 },
  { id: "u21", firstName: "Claire",   lastName: "Baxter",    name: "Claire Baxter",       email: "claire.baxter@spectrumclean.co.uk",     role: "area-manager", status: "active",      assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 4 },
  { id: "u22", firstName: "Sandra",   lastName: "Bates",     name: "Sandra Bates",        email: "sandra.bates@spectrumclean.co.uk",      role: "area-manager", status: "active",      assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 2 },
  { id: "u23", firstName: "James",    lastName: "Harley",    name: "James Harley",        email: "james.harley@spectrumclean.co.uk",      role: "area-manager", status: "active",      assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 3 },
  { id: "u24", firstName: "Nisha",    lastName: "Kapoor",    name: "Nisha Kapoor",        email: "nisha.kapoor@spectrumclean.co.uk",      role: "area-manager", status: "active",      assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 2 },
  { id: "u25", firstName: "Sean",     lastName: "Donnelly",  name: "Sean Donnelly",       email: "sean.donnelly@spectrumclean.co.uk",     role: "area-manager", status: "deactivated", assignedAreaId: null,  assignedAreaName: null,                   assignedSiteCount: 0 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

// ── CSS Helpers ───────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive hover:border-destructive focus:ring-destructive/30"
const btnPrimary = "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
const btnOutline = "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
const btnDestructive = "inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {firstName[0]}{lastName[0]}
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const USER_STATUS_CONFIG: Record<UserStatus, { label: string; icon: typeof CircleCheck; iconCls: string }> = {
  active:      { label: "Active",               icon: CircleCheck, iconCls: "text-emerald-500 dark:text-emerald-400" },
  pending:     { label: "Pending Registration", icon: Mail,        iconCls: "text-blue-500 dark:text-blue-400"       },
  deactivated: { label: "Deactivated",          icon: Archive,     iconCls: "text-muted-foreground"                   },
}

const USER_STATUS_VARIANT: Record<UserStatus, "success" | "info" | "neutral"> = {
  active:      "success",
  pending:     "info",
  deactivated: "neutral",
}

function StatusBadge({ status }: { status: UserStatus }) {
  const { label, icon: Icon } = USER_STATUS_CONFIG[status]
  return (
    <Badge variant={USER_STATUS_VARIANT[status]}>
      <Icon className="size-3.5 shrink-0" />
      {label}
    </Badge>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <Badge variant="outline">
      {ADMIN_ROLE_LABELS[role]}
    </Badge>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  open, onClose, title, children, size = "md", lockClose = false,
}: {
  open: boolean; onClose: () => void; title: string
  children: ReactNode; size?: "md" | "lg"; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, lockClose, onClose])

  if (!open) return null
  const widthCls = size === "lg" ? "max-w-lg" : "max-w-md"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!lockClose ? onClose : undefined} />
      <div className={`relative z-10 flex w-full ${widthCls} flex-col rounded-xl border border-border bg-background shadow-xl max-h-[90vh]`}>
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

// ── OverflowMenu ──────────────────────────────────────────────────────────────

function OverflowMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<React.CSSProperties | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        const right = window.innerWidth - rect.right
        const spaceBelow = window.innerHeight - rect.bottom - 8
        setPos(spaceBelow >= 120
          ? { top: rect.bottom + 4, right }
          : { bottom: window.innerHeight - rect.top + 4, right })
      }
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function fn(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
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
    document.addEventListener("mousedown", fn)
    window.addEventListener("keydown", onKey)
    setTimeout(() => {
      const first = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null
      first?.focus()
    }, 10)
    return () => {
      document.removeEventListener("mousedown", fn)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-accent text-accent-foreground"
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", zIndex: 200, ...pos }}
          className="w-56 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </>
  )
}

// ── Note Components ───────────────────────────────────────────────────────────

function WarningNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// ── UserForm ──────────────────────────────────────────────────────────────────

function UserForm({
  mode,
  initial,
  viewerRole,
  existingEmails,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initial?: AdminUser
  viewerRole: "super-admin" | "head-office"
  existingEmails: string[]
  onSubmit: (data: { firstName: string; lastName: string; email: string; role: AdminRole }) => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "")
  const [lastName, setLastName] = useState(initial?.lastName ?? "")
  const [email, setEmail] = useState(initial?.email ?? "")
  const [role, setRole] = useState<AdminRole | "">(initial?.role ?? "")
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const availableRoles: AdminRole[] = viewerRole === "super-admin"
    ? ["head-office", "head-of-area", "area-manager"]
    : ["head-of-area", "area-manager"]

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const selfEmail = initial?.email.toLowerCase() ?? null

  const errors = {
    firstName: !firstName.trim() ? "First name is required." : null,
    lastName:  !lastName.trim()  ? "Last name is required."  : null,
    email: !email.trim()
      ? "Email address is required."
      : !emailRegex.test(email.trim())
        ? "Enter a valid email address."
        : existingEmails.includes(email.trim().toLowerCase()) && email.trim().toLowerCase() !== selfEmail
          ? "This email address is already in use."
          : null,
    role: !role ? "Please select a role." : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const roleChanged = mode === "edit" && !!role && role !== initial?.role

  function fieldErr(f: keyof typeof errors) { return submitted ? errors[f] : null }

  async function handleSubmit() {
    setSubmitted(true)
    if (hasErrors || !role) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), role: role as AdminRole })
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">First name <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="e.g. Sarah"
            disabled={saving}
            className={`${inputCls} ${fieldErr("firstName") ? inputErrCls : ""}`}
          />
          {fieldErr("firstName") && <p className="text-xs text-destructive">{fieldErr("firstName")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Last name <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="e.g. Whitmore"
            disabled={saving}
            className={`${inputCls} ${fieldErr("lastName") ? inputErrCls : ""}`}
          />
          {fieldErr("lastName") && <p className="text-xs text-destructive">{fieldErr("lastName")}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Email address <span className="text-destructive">*</span></label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="e.g. sarah.whitmore@spectrumclean.co.uk"
          disabled={saving}
          className={`${inputCls} ${fieldErr("email") ? inputErrCls : ""}`}
        />
        {fieldErr("email") && (
          <p className="text-xs text-destructive">{fieldErr("email")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role <span className="text-destructive">*</span></label>
        <div className="relative">
          <select
            value={role}
            onChange={e => setRole(e.target.value as AdminRole | "")}
            disabled={saving}
            className={`${inputCls} appearance-none pr-8 ${fieldErr("role") ? inputErrCls : ""}`}
          >
            <option value="">Select a role…</option>
            {availableRoles.map(r => (
              <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
        </div>
        {fieldErr("role") && <p className="text-xs text-destructive">{fieldErr("role")}</p>}
      </div>

      {roleChanged && (
        <WarningNote>
          Changing this user&apos;s role will update their access permissions immediately upon saving.
          Any area or site assignments linked to their previous role may be affected.
        </WarningNote>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} disabled={saving} className={btnOutline}>Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// ── Dialog Content Components ─────────────────────────────────────────────────

function DeactivateConfirmContent({ user, onConfirm, onCancel }: {
  user: AdminUser; onConfirm: () => void; onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  async function handleConfirm() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    onConfirm()
  }
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to deactivate{" "}
        <span className="font-medium text-foreground">{user.name}</span>?
        They will immediately lose access to Spectrum Clean Manager.
      </p>
      <div className="divide-y divide-border rounded-lg border border-border bg-muted/40 text-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Name</span>
          <span className="font-medium">{user.name}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Role</span>
          <span className="font-medium">{ADMIN_ROLE_LABELS[user.role]}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Email</span>
          <span className="text-muted-foreground">{user.email}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button onClick={onCancel} disabled={saving} className={btnOutline}>Cancel</button>
        <button onClick={handleConfirm} disabled={saving} className={btnDestructive}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Deactivate User
        </button>
      </div>
    </div>
  )
}

function DeactivateBlockedHoAContent({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <ErrorNote>
        <strong>{user.name}</strong> is currently assigned as the Head of Area for{" "}
        <strong>{user.assignedAreaName}</strong>. Reassign or remove this area assignment before
        deactivating this user.
      </ErrorNote>
      <p className="text-sm text-muted-foreground">
        Go to <strong>{user.assignedAreaName}</strong> in{" "}
        <a href="/areas" className="text-primary underline hover:no-underline">Areas</a>{" "}
        to update the Head of Area assignment.
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button onClick={onClose} className={btnOutline}>Close</button>
        <a href="/areas" className={btnPrimary}>Go to Areas</a>
      </div>
    </div>
  )
}

function DeactivateBlockedAMContent({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <ErrorNote>
        <strong>{user.name}</strong> is currently managing{" "}
        <strong>{user.assignedSiteCount} {user.assignedSiteCount === 1 ? "site" : "sites"}</strong>.
        Reassign {user.assignedSiteCount === 1 ? "that site" : "those sites"} to another Area Manager
        before deactivating this user.
      </ErrorNote>
      <p className="text-sm text-muted-foreground">
        Go to{" "}
        <a href="/sites" className="text-primary underline hover:no-underline">Sites</a>{" "}
        to update site assignments.
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button onClick={onClose} className={btnOutline}>Close</button>
        <a href="/sites" className={btnPrimary}>Go to Sites</a>
      </div>
    </div>
  )
}

function ResendLinkContent({ user, onConfirm, onCancel }: {
  user: AdminUser; onConfirm: () => void; onCancel: () => void
}) {
  const [sending, setSending] = useState(false)
  async function handleSend() {
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    onConfirm()
  }
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <p className="text-sm text-muted-foreground">
        A new registration link will be sent to{" "}
        <span className="font-medium text-foreground">{user.email}</span>.
        The previous link will be invalidated immediately.
      </p>
      <AlertBox variant="info" title="Registration links expire after 72 hours">
        The user must complete registration before the link expires.
      </AlertBox>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button onClick={onCancel} disabled={sending} className={btnOutline}>Cancel</button>
        <button onClick={handleSend} disabled={sending} className={btnPrimary}>
          {sending && <Loader2 className="size-4 animate-spin" />}
          Resend Link
        </button>
      </div>
    </div>
  )
}

// ── Admin Users Page ──────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { role } = useRole()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<AdminRole[]>([])
  const [roleOpen, setRoleOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [dialog, setDialog] = useState<UserDialog>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const roleRef = useRef<HTMLDivElement>(null)
  const roleTriggerRef = useRef<HTMLButtonElement>(null)
  const rolePopoverStyle = usePopoverStyle(roleTriggerRef, roleOpen, 220)

  useEffect(() => {
    if (role === "head-of-area" || role === "area-manager") router.push("/employees")
  }, [role, router])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(t)
  }, [successMsg])

  useEffect(() => { setPage(1) }, [search, roleFilter])

  // Close role filter on outside click / Escape
  useEffect(() => {
    if (!roleOpen) return
    function onMouse(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setRoleOpen(false)
    }
    document.addEventListener("mousedown", onMouse)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouse)
      window.removeEventListener("keydown", onKey)
    }
  }, [roleOpen])

  const existingEmails = useMemo(() => users.map(u => u.email.toLowerCase()), [users])

  const roleCounts = useMemo(() => {
    const counts = { "head-office": 0, "head-of-area": 0, "area-manager": 0 } as Record<AdminRole, number>
    users.forEach(u => { counts[u.role]++ })
    return counts
  }, [users])

  const filtered = useMemo(() => {
    let list = users
    if (roleFilter.length > 0) list = list.filter(u => roleFilter.includes(u.role))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return list
  }, [users, roleFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageUsers = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
  const hasFilters = roleFilter.length > 0 || search.trim() !== ""
  const mobileFilterCount = roleFilter.length

  function toggleRole(r: AdminRole) {
    setRoleFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function canManage(targetRole: AdminRole): boolean {
    if (role === "super-admin") return true
    return role === "head-office" && targetRole !== "head-office"
  }

  function handleDeactivateClick(user: AdminUser) {
    if (user.role === "head-of-area" && user.assignedAreaId) {
      setDialog({ type: "deactivate-blocked-hoa", user })
    } else if (user.role === "area-manager" && user.assignedSiteCount > 0) {
      setDialog({ type: "deactivate-blocked-am", user })
    } else {
      setDialog({ type: "deactivate-confirm", user })
    }
  }

  function handleCreateSubmit(data: { firstName: string; lastName: string; email: string; role: AdminRole }) {
    const newUser: AdminUser = {
      id: `u-${users.length + 1}`,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: data.role,
      status: "pending",
      assignedAreaId: null,
      assignedAreaName: null,
      assignedSiteCount: 0,
    }
    setUsers(prev => [...prev, newUser])
    setDialog(null)
    setSuccessMsg(`${newUser.name} has been created. A registration link has been sent to ${newUser.email}.`)
  }

  function handleEditSubmit(userId: string, data: { firstName: string; lastName: string; email: string; role: AdminRole }) {
    setUsers(prev => prev.map(u => u.id !== userId ? u : {
      ...u,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: data.role,
    }))
    setDialog(null)
    setSuccessMsg("User details have been updated successfully.")
  }

  function handleDeactivateConfirm(userId: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "deactivated" as UserStatus } : u))
    setDialog(null)
    setSuccessMsg("User has been deactivated and their access removed.")
  }

  function handleResendConfirm(userName: string) {
    setDialog(null)
    setSuccessMsg(`Registration link resent to ${userName}.`)
  }

  if (role === "head-of-area" || role === "area-manager") return null

  const viewerRole = role as "super-admin" | "head-office"

  return (
    <PageShell
      title={`Admin users (${users.length})`}
      description="Manage admin accounts and role assignments."
      action={
        <div className="w-full @[680px]:w-auto">
          <button type="button" onClick={() => setDialog({ type: "create" })} className={`${btnPrimary} w-full justify-center`}>
            <Plus className="size-4" />
            Add user
          </button>
        </div>
      }
    >
      {/* Success flash */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Mobile toolbar: Search + Filters button */}
      <div className="flex items-center gap-2 @[640px]:hidden">
        <div className="flex h-9 flex-1 min-w-0 items-center gap-2 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FiltersButton activeCount={mobileFilterCount} onClick={() => setFiltersOpen(true)} />
      </div>

      {/* Desktop toolbar: inline filters */}
      <div className="hidden @[640px]:flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Role faceted filter */}
        <div className="relative" ref={roleRef}>
          <button
            ref={roleTriggerRef}
            type="button"
            aria-label="Filter by role"
            aria-expanded={roleOpen}
            onClick={() => setRoleOpen(v => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
              roleFilter.length > 0
                ? "border-border bg-background text-foreground hover:bg-accent"
                : "border-dashed border-input bg-background text-foreground hover:bg-accent"
            )}
          >
            <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
            Role
            {roleFilter.length > 0 && (
              <>
                <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
                {ROLE_ORDER.filter(r => roleFilter.includes(r)).map(r => (
                  <span key={r} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                    {ADMIN_ROLE_LABELS[r]}
                  </span>
                ))}
              </>
            )}
          </button>

          {roleOpen && (
            <div style={rolePopoverStyle} className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="p-1" role="group" aria-label="Filter by role">
                  {ROLE_ORDER.map(r => {
                    const checked = roleFilter.includes(r)
                    return (
                      <label
                        key={r}
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
                        <span className="flex-1">{ADMIN_ROLE_LABELS[r]}</span>
                        <span className="tabular-nums text-xs text-muted-foreground">{roleCounts[r]}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(r)}
                          aria-label={`Filter by ${ADMIN_ROLE_LABELS[r]}`}
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
              {roleFilter.length > 0 && (
                <>
                  <div className="flex-none border-t border-border" />
                  <div className="flex-none p-1">
                    <button
                      type="button"
                      onClick={() => { setRoleFilter([]); setRoleOpen(false) }}
                      className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      Clear filters
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Reset filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setRoleFilter([]); setSearch(""); setPage(1) }}
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
        onReset={() => { setRoleFilter([]); setPage(1) }}
        activeCount={mobileFilterCount}
      >
        <FilterSheetSection title="Role">
          <FilterSheetCheckboxList
            options={ROLE_ORDER.map(r => ({ value: r, label: ADMIN_ROLE_LABELS[r], count: roleCounts[r] }))}
            value={roleFilter}
            onChange={v => { setRoleFilter(v as AdminRole[]); setPage(1) }}
          />
        </FilterSheetSection>
      </MobileFilterSheet>

      {/* Table */}
      {pageUsers.length > 0 || hasFilters ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {pageUsers.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-56 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Admin user</th>
                <th className="w-36 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="w-52 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageUsers.map(user => (
                <tr
                  key={user.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    user.status === "deactivated" ? "opacity-50" : "hover:bg-muted/30"
                  )}
                >
                  {/* Identity cell */}
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar firstName={user.firstName} lastName={user.lastName} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ADMIN_ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {user.status !== "deactivated" && canManage(user.role) && (
                        <OverflowMenu>
                          <button
                            role="menuitem"
                            onClick={() => setDialog({ type: "edit", user })}
                            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                            Edit user
                          </button>
                          {user.status === "pending" && (
                            <button
                              role="menuitem"
                              onClick={() => setDialog({ type: "resend", user })}
                              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <Send className="size-3.5 shrink-0 text-muted-foreground" />
                              Resend registration link
                            </button>
                          )}
                          <div className="-mx-1 my-1 h-px bg-border" />
                          <button
                            role="menuitem"
                            onClick={() => handleDeactivateClick(user)}
                            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                          >
                            <UserX className="size-3.5 shrink-0" />
                            Deactivate user
                          </button>
                        </OverflowMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No users match your filters.
            </div>
          )}

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
            {/* Left: rows per page */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[10, 20, 30].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
            </div>

            {/* Right: navigation */}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="inline-flex @[460px]:hidden whitespace-nowrap px-2 text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
              {getPageWindow(currentPage, totalPages).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={cn(
                    "hidden @[460px]:flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    n === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
                className="hidden @[460px]:flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
          <Users className="mb-3 size-8 text-muted-foreground/40" />
          <p className="font-medium">No admin users yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first admin user to get started.</p>
          <button
            type="button"
            onClick={() => setDialog({ type: "create" })}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Add user
          </button>
        </div>
      )}

      {/* Prototype shortcut — not product content */}
      <p className="text-xs text-muted-foreground/60">
        Prototype:{" "}
        <a href="/auth/set-password" className="underline hover:text-muted-foreground">
          View Set Password page
        </a>
      </p>

      {/* ── Dialogs ── */}

      <Modal open={dialog?.type === "create"} onClose={() => setDialog(null)} title="Create Admin User" size="lg">
        {dialog?.type === "create" && (
          <UserForm
            mode="create"
            viewerRole={viewerRole}
            existingEmails={existingEmails}
            onSubmit={handleCreateSubmit}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={() => setDialog(null)} title="Edit Admin User" size="lg">
        {dialog?.type === "edit" && (
          <UserForm
            mode="edit"
            initial={dialog.user}
            viewerRole={viewerRole}
            existingEmails={existingEmails}
            onSubmit={data => handleEditSubmit(dialog.user.id, data)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal open={dialog?.type === "deactivate-confirm"} onClose={() => setDialog(null)} title="Deactivate User">
        {dialog?.type === "deactivate-confirm" && (
          <DeactivateConfirmContent
            user={dialog.user}
            onConfirm={() => handleDeactivateConfirm(dialog.user.id)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal open={dialog?.type === "deactivate-blocked-hoa"} onClose={() => setDialog(null)} title="Cannot Deactivate User">
        {dialog?.type === "deactivate-blocked-hoa" && (
          <DeactivateBlockedHoAContent user={dialog.user} onClose={() => setDialog(null)} />
        )}
      </Modal>

      <Modal open={dialog?.type === "deactivate-blocked-am"} onClose={() => setDialog(null)} title="Cannot Deactivate User">
        {dialog?.type === "deactivate-blocked-am" && (
          <DeactivateBlockedAMContent user={dialog.user} onClose={() => setDialog(null)} />
        )}
      </Modal>

      <Modal open={dialog?.type === "resend"} onClose={() => setDialog(null)} title="Resend Registration Link">
        {dialog?.type === "resend" && (
          <ResendLinkContent
            user={dialog.user}
            onConfirm={() => handleResendConfirm(dialog.user.name)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </PageShell>
  )
}
