"use client"

import { useState, type FormEvent } from "react"
import { Loader2, AlertCircle, CheckCircle, Layers, ArrowLeft } from "lucide-react"
import Link from "next/link"

// ── Styles ────────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const inputErrCls = "border-destructive focus:ring-destructive/30"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = submitted && !email.trim()
    ? "Email address is required."
    : submitted && !emailRegex.test(email.trim())
      ? "Enter a valid email address."
      : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(false)
    setSubmitted(true)
    if (!email.trim() || !emailRegex.test(email.trim())) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
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
          {sent ? (
            // ── Confirmation state ─────────────────────────────────────────
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Check your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">{email}</span>,
                  a password reset link has been sent.
                  {/* ⚠ Open question: spec flags whether account existence should be disclosed */}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                The link expires after 24 hours. Check your spam folder if you don't
                see it in your inbox.
              </p>
              <div className="flex w-full flex-col gap-2 pt-2">
                <button
                  onClick={() => { setSent(false); setSubmitted(false) }}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-muted/50 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Try a different email
                </button>
                <Link
                  href="/auth/login"
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            // ── Default / form state ───────────────────────────────────────
            <>
              <h1 className="mb-1 text-xl font-semibold">Forgot password?</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your registered email address and we'll send you a password reset link.
              </p>

              {serverError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive dark:border-destructive/40">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  Something went wrong. Please try again.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. sam.ainsley@spectrumclean.co.uk"
                    disabled={loading}
                    autoComplete="email"
                    className={`${inputCls} ${emailError ? inputErrCls : ""}`}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Send reset link
                </button>
              </form>

              <div className="mt-5 flex justify-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
