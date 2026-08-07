"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

const JOB_ROLES = ["Cleaner", "Supervisor", "Team Leader", "Window Cleaner", "Operative"]

type EmployeeSnapshot = {
  firstName: string
  lastName: string
  email: string
  jobRole: string
  payrollSC: string
  payrollSFM: string
}

export type EditEmployeePayload = {
  firstName: string
  lastName: string
  email: string
  jobRole: string
  payrollSC: string
  payrollSFM: string
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

function inputCls(hasError?: boolean) {
  return cn(
    "flex h-9 w-full rounded-md border bg-muted/50 px-3 text-sm transition-colors",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    hasError
      ? "border-destructive hover:border-destructive focus:ring-destructive/30"
      : "border-input hover:border-input-hover"
  )
}

export function EditEmployeeDialog({
  open,
  onClose,
  employee,
  onSave,
}: {
  open: boolean
  onClose: () => void
  employee: EmployeeSnapshot
  onSave: (payload: EditEmployeePayload) => void
}) {
  const [firstName,  setFirstName]  = useState(employee.firstName)
  const [lastName,   setLastName]   = useState(employee.lastName)
  const [email,      setEmail]      = useState(employee.email)
  const [jobRole,    setJobRole]    = useState(employee.jobRole)
  const [payrollSC,  setPayrollSC]  = useState(employee.payrollSC)
  const [payrollSFM, setPayrollSFM] = useState(employee.payrollSFM)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") done ? handleDone() : onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done, onClose])

  useEffect(() => {
    if (open) {
      setFirstName(employee.firstName); setLastName(employee.lastName)
      setEmail(employee.email);         setJobRole(employee.jobRole)
      setPayrollSC(employee.payrollSC); setPayrollSFM(employee.payrollSFM)
      setErrors({}); setSubmitting(false); setDone(false)
    }
  }, [open, employee])

  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim())  e.firstName = "First name is required."
    if (!lastName.trim())   e.lastName  = "Last name is required."
    if (!email.trim())      e.email     = "Email address is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address."
    if (!jobRole)           e.jobRole   = "Job role is required."
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setDone(true) }, 1200)
  }

  function handleDone() {
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), jobRole, payrollSC, payrollSFM })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={done ? handleDone : onClose} />
      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-xl bg-background shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Edit employee</h2>
          <button type="button" onClick={done ? handleDone : onClose}
            className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" /><span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {done ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Employee updated</p>
                <p className="mt-1 text-sm text-muted-foreground">{firstName} {lastName}&apos;s details have been saved.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" required error={errors.firstName}>
                  <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: "" })) }}
                    placeholder="First name" className={inputCls(!!errors.firstName)} />
                </Field>
                <Field label="Last name" required error={errors.lastName}>
                  <input value={lastName} onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: "" })) }}
                    placeholder="Last name" className={inputCls(!!errors.lastName)} />
                </Field>
              </div>
              <Field label="Email address" required error={errors.email}>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })) }}
                  placeholder="name@example.com" className={inputCls(!!errors.email)} />
              </Field>
              <Field label="Job role" required error={errors.jobRole}>
                <div className="relative">
                  <select value={jobRole} onChange={e => { setJobRole(e.target.value); setErrors(p => ({ ...p, jobRole: "" })) }}
                    className={cn(inputCls(!!errors.jobRole), "appearance-none pr-8")}>
                    <option value="">Select a job role…</option>
                    {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Payroll ID (SC)">
                  <input value={payrollSC} onChange={e => setPayrollSC(e.target.value)}
                    placeholder="e.g. SC-001" className={inputCls()} />
                </Field>
                <Field label="Payroll ID (SFM)">
                  <input value={payrollSFM} onChange={e => setPayrollSFM(e.target.value)}
                    placeholder="e.g. SFM-001" className={inputCls()} />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4">
          {done ? (
            <div className="flex justify-end">
              <button type="button" onClick={handleDone}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Done
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose}
                className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
