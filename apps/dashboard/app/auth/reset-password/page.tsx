"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertCircle, Layers, ArrowLeft } from "lucide-react"
import Link from "next/link"

// ── Password requirements ─────────────────────────────────────────────────────

const REQUIREMENTS = [
  { label: "At least 8 characters",      test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",            test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character",       test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type DemoState = "valid" | "expired" | "superseded"

// ── Styles ────────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive focus:ring-destructive/30"

// ── Reset form (valid link state) ─────────────────────────────────────────────

function ResetForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [done, setDone] = useState(false)

  const metAll = REQUIREMENTS.every(r => r.test(password))
  const confirmMatch = password.length > 0 && confirm === password
  const confirmError = submitted && confirm && !confirmMatch ? "Passwords do not match." : null
  const canSubmit = metAll && confirmMatch

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(false)
    setSubmitted(true)
    if (!canSubmit) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setDone(true)

    // Navigate to login after brief success display
    setTimeout(() => router.push("/auth/login"), 2500)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Password reset</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated. A confirmation email has been sent to your
            registered address.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Redirecting to login…</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Create a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a strong password for your Spectrum Clean account.
      </p>

      {serverError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive dark:border-destructive/40">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            New password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a new password"
              disabled={loading}
              autoComplete="new-password"
              className={`${inputCls} pr-10 ${submitted && !metAll ? inputErrCls : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Requirements checklist */}
          {(password.length > 0 || submitted) && (
            <ul className="mt-0.5 flex flex-col gap-1">
              {REQUIREMENTS.map(req => {
                const met = req.test(password)
                return (
                  <li
                    key={req.label}
                    className={`flex items-center gap-1.5 text-xs ${
                      met
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {met
                      ? <CheckCircle className="size-3.5 shrink-0 text-emerald-500" />
                      : <XCircle className="size-3.5 shrink-0 text-muted-foreground/40" />
                    }
                    {req.label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              disabled={loading}
              autoComplete="new-password"
              className={`${inputCls} pr-10 ${confirmError ? inputErrCls : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(s => !s)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {confirmError && (
            <p className="text-xs text-destructive">{confirmError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Reset password
        </button>
      </form>
    </>
  )
}

// ── Invalid link state ────────────────────────────────────────────────────────

function InvalidLink({ reason }: { reason: "expired" | "superseded" }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Password reset link is no longer valid
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            {reason === "superseded"
              ? "This link was superseded when a newer reset link was requested."
              : "This link has expired. Password reset links are valid for 24 hours."}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Request a new password reset link to continue.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/auth/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Request new link
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const [demoState, setDemoState] = useState<DemoState>("valid")

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">Spectrum Clean</div>
            <div className="text-xs text-muted-foreground">Manager Web App</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {demoState === "valid" ? (
            <ResetForm key="reset-form" />
          ) : (
            <>
              <h1 className="mb-4 text-xl font-semibold">Reset password</h1>
              <InvalidLink reason={demoState === "superseded" ? "superseded" : "expired"} />
            </>
          )}
        </div>

        {/* Demo state control */}
        <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Prototype state
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["valid", "expired", "superseded"] as DemoState[]).map(s => (
              <button
                key={s}
                onClick={() => setDemoState(s)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  demoState === s
                    ? "bg-background border border-border shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "valid" && "Valid link"}
                {s === "expired" && "Expired link"}
                {s === "superseded" && "Superseded link"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
