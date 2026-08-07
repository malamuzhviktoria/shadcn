"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, Layers } from "lucide-react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type DemoState = "default" | "invalid-credentials" | "server-error" | "deactivated"

// ── Styles ────────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive hover:border-destructive focus:ring-destructive/30"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [credError, setCredError] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [deactivated, setDeactivated] = useState(false)
  const [demoState, setDemoState] = useState<DemoState>("default")

  const identifierError = submitted && !identifier.trim() ? "Email or username is required." : null
  const passwordError = submitted && !password.trim() ? "Password is required." : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCredError(false)
    setServerError(false)
    setDeactivated(false)
    setSubmitted(true)
    if (!identifier.trim() || !password.trim()) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)

    if (demoState === "invalid-credentials") {
      setCredError(true)
    } else if (demoState === "server-error") {
      setServerError(true)
    } else if (demoState === "deactivated") {
      setDeactivated(true)
    } else {
      router.push("/employees")
    }
  }

  function handleDemoChange(state: DemoState) {
    setDemoState(state)
    setCredError(false)
    setServerError(false)
    setDeactivated(false)
    setSubmitted(false)
  }

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
          <h1 className="mb-1 text-xl font-semibold">Log in</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Sign in to your Spectrum Clean account.
          </p>

          {/* Error alerts */}
          {credError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/10">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>Email or/and Password are incorrect.</span>
              {/* ⚠ Open question: exact copy per spec — may be refined for grammar */}
            </div>
          )}
          {serverError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/10">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              Something went wrong. Please try again.
            </div>
          )}
          {deactivated && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                Your account has been deactivated. Contact Head Office for assistance.
                {/* ⚠ Open question: exact copy not confirmed in requirements */}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Identifier */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="identifier" className="text-sm font-medium">
                Email or username
                {/* ⚠ Open question: confirm whether username login is supported or email only */}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. sam.ainsley@spectrumclean.co.uk"
                disabled={loading}
                autoComplete="username"
                className={`${inputCls} ${identifierError ? inputErrCls : ""}`}
              />
              {identifierError && (
                <p className="text-xs text-destructive">{identifierError}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`${inputCls} pr-10 ${passwordError ? inputErrCls : ""}`}
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
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Log in
            </button>
          </form>
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
            {(["default", "invalid-credentials", "server-error", "deactivated"] as DemoState[]).map(s => (
              <button
                key={s}
                onClick={() => handleDemoChange(s)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  demoState === s
                    ? "bg-background border border-border shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "default" && "Default"}
                {s === "invalid-credentials" && "Invalid credentials"}
                {s === "server-error" && "Server error"}
                {s === "deactivated" && "Deactivated account ⚠"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
