"use client"

import { useState, useEffect, useRef } from "react"
import {
  CheckCircle, AlertCircle,
  X, Loader2, Pencil, Trash2, Plus, EllipsisVertical,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlertBox } from "@/components/modal-alert"

// ── Types ──────────────────────────────────────────────────────────────────────

interface JobRole {
  id: string
  name: string
  isDefault: boolean
  hasActiveOverrides: boolean
}

type JobRoleDialog =
  | { type: "add" }
  | { type: "edit"; role: JobRole }
  | { type: "delete-confirm"; role: JobRole }
  | { type: "delete-blocked"; role: JobRole }
  | null

// ── Sample Data ────────────────────────────────────────────────────────────────

const INITIAL_JOB_ROLES: JobRole[] = [
  { id: "jr1", name: "Cleaner",        isDefault: true,  hasActiveOverrides: false },
  { id: "jr2", name: "Team Leader",    isDefault: false, hasActiveOverrides: true  },
  { id: "jr3", name: "Supervisor",     isDefault: false, hasActiveOverrides: false },
  { id: "jr4", name: "Window Cleaner", isDefault: false, hasActiveOverrides: false },
  { id: "jr5", name: "Mobile Cleaner", isDefault: false, hasActiveOverrides: false },
]

const INITIAL_ACCRUAL = "12.07"
const INITIAL_MIN_WAGE = "11.44"

// ── CSS Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive hover:border-destructive focus:ring-destructive/30"
const btnPrimary =
  "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
const btnPrimarySmall =
  "inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
const btnOutline =
  "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
const btnDestructive =
  "inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"

// ── Primitive UI ───────────────────────────────────────────────────────────────

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
      <CheckCircle className="size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null
  return (
    <div className="fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
      <CheckCircle className="size-4 shrink-0" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-1 rounded p-0.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-800/30"
      >
        <X className="size-3.5" />
      </button>
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
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Validation Helper ──────────────────────────────────────────────────────────

function validatePositiveNumber(value: string, fieldName: string): string | null {
  const stripped = value.trim()
  if (!stripped) return `${fieldName} is required.`
  const n = Number(stripped)
  if (isNaN(n) || !isFinite(n)) return "Enter a valid number."
  if (n <= 0) return `${fieldName} must be greater than 0.`
  return null
}

function validateWholeNumber(value: string, fieldName: string): string | null {
  const stripped = value.trim()
  if (!stripped) return `${fieldName} is required.`
  const n = Number(stripped)
  if (isNaN(n) || !isFinite(n) || !Number.isInteger(n)) return "Enter a whole number."
  if (n <= 0) return `${fieldName} must be greater than 0.`
  return null
}

// ── Holiday Accrual Section ────────────────────────────────────────────────────

function HolidayAccrualSection() {
  const [saved, setSaved] = useState(INITIAL_ACCRUAL)
  const [value, setValue] = useState(INITIAL_ACCRUAL)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const isDirty = value.trim() !== saved
  const error = isDirty ? validatePositiveNumber(value, "Holiday accrual percentage") : null
  const canSave = isDirty && !error

  useEffect(() => { if (isDirty) setSuccess(false) }, [isDirty])

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(value.trim())
    setSuccess(true)
  }

  function handleCancel() {
    setValue(saved)
    setSuccess(false)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-sm font-semibold">Holiday Accrual</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Sets the global Holiday Accrual Percentage applied to all employees.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="relative w-60">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={e => setValue(e.target.value)}
              className={`${inputCls} pr-8 ${error ? inputErrCls : ""}`}
              placeholder="e.g. 12.07"
              disabled={saving}
              aria-label="Holiday Accrual Percentage"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground">
              %
            </span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertBox variant="info">
          Changes apply to future holiday accrual calculations only. Previously accrued hours will not
          be recalculated.
        </AlertBox>

        {success && (
          <SuccessNote>Holiday Accrual Percentage updated successfully.</SuccessNote>
        )}

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={!canSave || saving} className={btnPrimary}>
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          {isDirty && !saving && (
            <button onClick={handleCancel} className={btnOutline}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Minimum Wage Section ───────────────────────────────────────────────────────

function MinimumWageSection() {
  const [saved, setSaved] = useState(INITIAL_MIN_WAGE)
  const [value, setValue] = useState(INITIAL_MIN_WAGE)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const isDirty = value.trim() !== saved
  const error = isDirty ? validatePositiveNumber(value, "Minimum wage") : null
  const canSave = isDirty && !error

  useEffect(() => { if (isDirty) setSuccess(false) }, [isDirty])

  function handleSaveClick() {
    if (!canSave) return
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    setConfirmOpen(false)
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(value.trim())
    setSuccess(true)
  }

  function handleCancel() {
    setValue(saved)
    setSuccess(false)
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 text-sm font-semibold">Minimum Wage</h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Sets the minimum Pay Rate for future clock-ins across the system.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="relative w-60">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                £
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => setValue(e.target.value)}
                className={`${inputCls} pl-7 pr-[76px] ${error ? inputErrCls : ""}`}
                placeholder="e.g. 11.44"
                disabled={saving}
                aria-label="Minimum Wage"
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground">
                per hour
              </span>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <AlertBox variant="error">
            Any current employee Pay Rates below the new minimum will be raised automatically for
            future clock-ins. Historical Timesheets will not change. This change is recorded in the
            Audit Trail.
          </AlertBox>

          {success && (
            <SuccessNote>
              Minimum Wage updated. Affected Pay Rates will apply on the next clock-in.
            </SuccessNote>
          )}

          <div className="flex items-center gap-2">
            <button onClick={handleSaveClick} disabled={!canSave || saving} className={btnPrimary}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            {isDirty && !saving && (
              <button onClick={handleCancel} className={btnOutline}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Minimum Wage Change"
      >
        <div className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm text-muted-foreground">
            You are about to update the system Minimum Wage. Review the change before confirming.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Current minimum wage</span>
              <span className="font-semibold tabular-nums">£{saved}/hr</span>
            </div>
            <div className="flex items-center justify-between border-t border-border py-1">
              <span className="text-muted-foreground">New minimum wage</span>
              <span className="font-semibold tabular-nums text-primary">£{value.trim()}/hr</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Employee Pay Rates currently below £{value.trim()}/hr will be automatically raised to the
            new minimum for future clock-ins. Historical Timesheet records will not be changed. This
            update will be recorded in the Audit Trail.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={() => setConfirmOpen(false)} className={btnOutline}>
              Cancel
            </button>
            <button onClick={handleConfirm} className={btnPrimary}>
              Confirm Change
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Job Role Form (shared: Add / Edit) ────────────────────────────────────────

function JobRoleForm({
  existingNames,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  existingNames: string[]
  initial?: string
  submitLabel: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial ?? "")
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const trimmed = name.trim()
  const nameError = !trimmed
    ? "Job role name is required."
    : existingNames.includes(trimmed.toLowerCase())
    ? "A job role with this name already exists."
    : null

  async function handleSubmit() {
    setSubmitted(true)
    if (nameError) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    onSubmit(trimmed)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Job Role Name <span className="text-destructive">*</span>
          </label>
          <input
            className={`${inputCls} ${submitted && nameError ? inputErrCls : ""}`}
            value={name}
            onChange={e => { setName(e.target.value); if (submitted) setSubmitted(false) }}
            placeholder="e.g. Supervisor"
            disabled={saving}
            autoFocus
          />
          {submitted && nameError && (
            <p className="text-xs text-destructive">{nameError}</p>
          )}
        </div>
      </div>
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

// ── Delete Confirm Content ─────────────────────────────────────────────────────

function DeleteConfirmContent({
  role, onConfirm, onCancel,
}: { role: JobRole; onConfirm: () => void; onCancel: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await new Promise(r => setTimeout(r, 700))
    setDeleting(false)
    onConfirm()
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete the job role{" "}
        <strong className="text-foreground">{role.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button onClick={onCancel} disabled={deleting} className={btnOutline}>
          Cancel
        </button>
        <button onClick={handleDelete} disabled={deleting} className={btnDestructive}>
          {deleting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Deleting…
            </>
          ) : (
            "Delete Job Role"
          )}
        </button>
      </div>
    </div>
  )
}

// ── Delete Blocked Content ─────────────────────────────────────────────────────

function DeleteBlockedContent({
  role, onClose,
}: { role: JobRole; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">Cannot delete this Job Role</p>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{role.name}</strong> is used by one or more active Pay
          Rate Overrides and cannot be deleted.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Remove or reassign all active Pay Rate Overrides referencing this role before deleting it.
      </p>
      <div className="flex justify-end border-t border-border pt-4">
        <button onClick={onClose} className={btnOutline}>
          Close
        </button>
      </div>
    </div>
  )
}

// ── Job Role Row Actions ───────────────────────────────────────────────────────

function JobRoleRowActions({
  role,
  onEdit,
  onDelete,
}: {
  role: JobRole
  onEdit: () => void
  onDelete: () => void
}) {
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
        const menuH = role.isDefault ? 42 : 88
        const spaceBelow = window.innerHeight - rect.bottom - 8
        setPos(spaceBelow >= menuH
          ? { top: rect.bottom + 4, right }
          : { bottom: window.innerHeight - rect.top + 4, right })
      }
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
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
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    setTimeout(() => {
      const first = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null
      first?.focus()
    }, 10)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  function pick(action: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
      action()
    }
  }

  return (
    <>
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
          style={{ position: "fixed", zIndex: 200, ...pos }}
          className="w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            onClick={pick(onEdit)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
            Edit
          </button>
          {!role.isDefault && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                role="menuitem"
                type="button"
                onClick={pick(onDelete)}
                className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
              >
                <Trash2 className="size-3.5 shrink-0" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

// ── Job Roles Section ──────────────────────────────────────────────────────────

function JobRolesSection() {
  const [roles, setRoles] = useState<JobRole[]>(INITIAL_JOB_ROLES)
  const [dialog, setDialog] = useState<JobRoleDialog>(null)
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function handleDeleteClick(role: JobRole) {
    if (role.hasActiveOverrides) {
      setDialog({ type: "delete-blocked", role })
    } else {
      setDialog({ type: "delete-confirm", role })
    }
  }

  function handleAdd(name: string) {
    const id = `jr-${Date.now()}`
    setRoles(prev => [...prev, { id, name, isDefault: false, hasActiveOverrides: false }])
    setDialog(null)
    showSuccess(`Job role "${name}" added.`)
  }

  function handleEdit(roleId: string, name: string) {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, name } : r))
    setDialog(null)
    showSuccess("Job role updated.")
  }

  function handleDelete(roleId: string) {
    const role = roles.find(r => r.id === roleId)
    setRoles(prev => prev.filter(r => r.id !== roleId))
    setDialog(null)
    if (role) showSuccess(`"${role.name}" deleted.`)
  }

  const existingNames = roles.map(r => r.name.toLowerCase())

  return (
    <>
      <section className="@container rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col gap-3 @[380px]:flex-row @[380px]:items-start @[380px]:justify-between @[380px]:gap-4">
          <div>
            <h2 className="mb-1 text-sm font-semibold">Job Roles</h2>
            <p className="text-xs text-muted-foreground">
              System-wide Job Role dictionary used for employee assignment and Pay Rate Overrides.
            </p>
          </div>
          <button onClick={() => setDialog({ type: "add" })} className={cn(btnPrimary, "shrink-0 self-start whitespace-nowrap")}>
            <Plus className="size-4" />
            Add Job Role
          </button>
        </div>

        <Toast message={successMsg} onClose={() => setSuccessMsg(null)} />

        {loading ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
                <div className="size-8 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Job Role
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isDefault && (
                          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <JobRoleRowActions
                          role={role}
                          onEdit={() => setDialog({ type: "edit", role })}
                          onDelete={() => handleDeleteClick(role)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={dialog?.type === "add"} onClose={() => setDialog(null)} title="Add Job Role">
        <JobRoleForm
          existingNames={existingNames}
          submitLabel="Add Job Role"
          onSubmit={handleAdd}
          onCancel={() => setDialog(null)}
        />
      </Modal>

      <Modal open={dialog?.type === "edit"} onClose={() => setDialog(null)} title="Edit Job Role">
        {dialog?.type === "edit" && (
          <JobRoleForm
            existingNames={existingNames.filter(n => n !== dialog.role.name.toLowerCase())}
            initial={dialog.role.name}
            submitLabel="Save Changes"
            onSubmit={name => handleEdit(dialog.role.id, name)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete-confirm"}
        onClose={() => setDialog(null)}
        title="Delete Job Role"
      >
        {dialog?.type === "delete-confirm" && (
          <DeleteConfirmContent
            role={dialog.role}
            onConfirm={() => handleDelete(dialog.role.id)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete-blocked"}
        onClose={() => setDialog(null)}
        title="Cannot Delete Job Role"
      >
        {dialog?.type === "delete-blocked" && (
          <DeleteBlockedContent
            role={dialog.role}
            onClose={() => setDialog(null)}
          />
        )}
      </Modal>
    </>
  )
}

// ── Shift History Window Section ───────────────────────────────────────────────

const INITIAL_SHIFT_WINDOW = "14"

function ShiftHistoryWindowSection() {
  const [saved, setSaved] = useState(INITIAL_SHIFT_WINDOW)
  const [value, setValue] = useState(INITIAL_SHIFT_WINDOW)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const isDirty = value.trim() !== saved
  const error = isDirty ? validateWholeNumber(value, "Shift history window") : null
  const canSave = isDirty && !error

  useEffect(() => { if (isDirty) setSuccess(false) }, [isDirty])

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(value.trim())
    setSuccess(true)
  }

  function handleCancel() {
    setValue(saved)
    setSuccess(false)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-sm font-semibold">Shift History Window</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Sets how many days back shift history is visible across the system.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="relative w-60">
            <input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={e => setValue(e.target.value)}
              className={`${inputCls} pr-16 ${error ? inputErrCls : ""}`}
              placeholder="e.g. 14"
              disabled={saving}
              aria-label="Shift history window (days)"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground">
              days
            </span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {success && (
          <SuccessNote>Shift history window updated successfully.</SuccessNote>
        )}

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={!canSave || saving} className={btnPrimary}>
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          {isDirty && !saving && (
            <button onClick={handleCancel} className={btnOutline}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SystemSettingsPage() {
  const { role } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (role !== "super-admin") {
      router.replace("/employees")
    }
  }, [role, router])

  if (role !== "super-admin") return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure global settings for holiday accrual, minimum wage, job roles, and shift history.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HolidayAccrualSection />
        <MinimumWageSection />
        <JobRolesSection />
        <ShiftHistoryWindowSection />
      </div>
    </div>
  )
}
