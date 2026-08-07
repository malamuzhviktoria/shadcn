"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useRole, ROLE_LABELS } from "@/lib/role-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSidebar } from "@/lib/sidebar-context"
import { useBreadcrumbExtra } from "@/lib/breadcrumb-context"

const SEGMENT_LABELS: Record<string, string> = {
  employees: "Employees",
  timesheets: "Timesheets",
  sites: "Sites",
  areas: "Areas",
  customers: "Customers",
  users: "Admin users",
  audit: "Audit trail",
  settings: "System settings",
}

function getLabel(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment.charAt(0).toUpperCase() + segment.slice(1)
  )
}

function useBreadcrumbs(): Array<{ label: string; href: string }> {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return []

  const crumbs: Array<{ label: string; href: string }> = []
  let currentPath = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    const isId =
      i > 0 && (/^\d+$/.test(segment) || segment.length > 20)
    crumbs.push({
      label: isId ? "Profile" : getLabel(segment),
      href: currentPath,
    })
  }

  return crumbs
}

function LogoutDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        <h2 className="text-base font-semibold text-foreground">Log out</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to log out? You will need to sign in again to
          access Spectrum Clean.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4",
              "text-sm font-medium text-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex h-9 items-center rounded-md bg-destructive px-4",
              "text-sm font-medium text-destructive-foreground transition-colors",
              "hover:bg-destructive/90"
            )}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppHeader() {
  const breadcrumbs = useBreadcrumbs()
  const { extra } = useBreadcrumbExtra()
  const { role } = useRole()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("pointerdown", handlePointerDown)
    }
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [menuOpen])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        {/* Sidebar toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <PanelLeftIcon className="size-4" />
        </button>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 ? (
          <nav
            className="flex flex-1 items-center gap-1.5 text-sm"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1 && !extra
              return (
                <React.Fragment key={crumb.href}>
                  {i > 0 && (
                    <span className="text-muted-foreground/30" aria-hidden>
                      /
                    </span>
                  )}
                  {isLast ? (
                    <span className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
            {extra && (
              <>
                <span className="text-muted-foreground/30" aria-hidden>/</span>
                <span className="font-medium text-foreground">{extra}</span>
              </>
            )}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        <ThemeToggle />

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              "hover:bg-accent",
              menuOpen && "bg-accent"
            )}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              VM
            </div>
            <span className="font-medium text-foreground">Viktoria M.</span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-150",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
            >
              {/* Identity */}
              <div className="border-b border-border px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    VM
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium leading-none">
                      Viktoria M.
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setLogoutOpen(true)
                  }}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {logoutOpen && (
        <LogoutDialog
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false)
            router.push("/auth/login")
          }}
        />
      )}
    </>
  )
}
