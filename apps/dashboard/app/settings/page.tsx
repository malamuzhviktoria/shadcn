"use client"

import { useState, useEffect } from "react"
import {
  Info, CheckCircle, AlertCircle, AlertTriangle,
  X, Loader2, Pencil, Trash2, Plus,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"

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
  "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
const btnPrimarySmall =
  "inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
const btnOutline =
  "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
const btnDestructive =
  "inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"

// ── Primitive UI ───────────────────────────────────────────────────────────────

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
      <CheckCircle className="size-3.5 shrink-0" />
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
        Formula: Total Hours Worked × Accrual Percentage.
      </p>

      <div className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Holiday Accrual Percentage <span className="text-destructive">*</span>
          </label>
          <div className="relative w-48">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={e => setValue(e.target.value)}
              className={`${inputCls} pr-8 ${error ? inputErrCls : ""}`}
              placeholder="e.g. 12.07"
              disabled={saving}
            />
            <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-muted-foreground">
              %
            </span>
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enter as a percentage, e.g. 12.07 for 12.07%.
            </p>
          )}
        </div>

        <InfoNote>
          Changes apply to future holiday accrual calculations only. Previously accrued hours will not
          be recalculated.
        </InfoNote>

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
          Defines the lowest Pay Rate allowed in the system. Raising the minimum automatically updates
          any employee Pay Rate below the new value for future clock-ins.
        </p>

        <div className="flex max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Minimum Wage <span className="text-destructive">*</span>
            </label>
            <div className="relative w-48">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                £
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => setValue(e.target.value)}
                className={`${inputCls} pl-7 ${error ? inputErrCls : ""}`}
                placeholder="e.g. 11.44"
                disabled={saving}
              />
            </div>
            <p className="text-xs text-muted-foreground">£ per hour</p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <WarningNote>
            Any current employee Pay Rates below the new minimum will be raised automatically for
            future clock-ins. Historical Timesheets will not change. This change is recorded in the
            Audit Trail.
          </WarningNote>

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
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="mb-1 text-sm font-semibold">Job Roles</h2>
            <p className="text-xs text-muted-foreground">
              System-wide Job Role dictionary used for employee assignment and Pay Rate Overrides.
            </p>
          </div>
          <button onClick={() => setDialog({ type: "add" })} className={btnPrimarySmall}>
            <Plus className="size-3.5" />
            Add Job Role
          </button>
        </div>

        {successMsg && (
          <div className="mb-4">
            <SuccessNote>{successMsg}</SuccessNote>
          </div>
        )}

        {loading ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
                <div className="flex gap-1.5">
                  <div className="size-7 animate-pulse rounded-md bg-muted" />
                  <div className="size-7 animate-pulse rounded-md bg-muted" />
                </div>
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
                  <th className="w-20 px-4 py-2.5" />
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDialog({ type: "edit", role })}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted"
                          aria-label={`Edit ${role.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        {!role.isDefault && (
                          <button
                            onClick={() => handleDeleteClick(role)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${role.name}`}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
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
          Configure global settings for holiday accrual, minimum pay, and job roles.
        </p>
      </div>
      <div className="flex max-w-2xl flex-col gap-6">
        <HolidayAccrualSection />
        <MinimumWageSection />
        <JobRolesSection />
      </div>
    </div>
  )
}
