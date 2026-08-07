"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  ROLE_LABELS,
  ROLES,
  Role,
  isRoutePermitted,
  useRole,
} from "@/lib/role-context"

type FrameConfig = {
  id: string
  label: string
  href: string
}

const FRAMES: FrameConfig[] = [
  { id: "employees", label: "Employees", href: "/employees" },
  { id: "timesheets", label: "Timesheets", href: "/timesheets" },
  { id: "sites", label: "Sites", href: "/sites" },
  { id: "areas", label: "Areas", href: "/areas" },
  { id: "customers", label: "Customers", href: "/customers" },
  { id: "employee-profile", label: "Employee profile", href: "/employees/1" },
  { id: "users", label: "Admin users", href: "/users" },
  { id: "settings", label: "System settings", href: "/settings" },
  { id: "auth-login", label: "Log in", href: "/auth/login" },
  { id: "auth-set-password", label: "Set password", href: "/auth/set-password" },
  { id: "auth-forgot-password", label: "Forgot password", href: "/auth/forgot-password" },
  { id: "auth-reset-password", label: "Reset password", href: "/auth/reset-password" },
]

function getCurrentFrameId(pathname: string): string {
  if (pathname.startsWith("/employees/")) return "employee-profile"
  if (pathname === "/employees") return "employees"
  if (pathname === "/timesheets") return "timesheets"
  if (pathname === "/sites") return "sites"
  if (pathname === "/areas") return "areas"
  if (pathname === "/customers") return "customers"
  if (pathname === "/users") return "users"
  if (pathname === "/settings") return "settings"
  if (pathname === "/auth/login") return "auth-login"
  if (pathname === "/auth/set-password") return "auth-set-password"
  if (pathname === "/auth/forgot-password") return "auth-forgot-password"
  if (pathname === "/auth/reset-password") return "auth-reset-password"
  return ""
}

export function DemoToolbar() {
  const { role, setRole } = useRole()
  const pathname = usePathname()
  const router = useRouter()
  const currentFrameId = getCurrentFrameId(pathname)

  function handleRoleChange(newRole: Role) {
    setRole(newRole)
    if (!isRoutePermitted(newRole, pathname)) {
      router.push("/employees")
    }
  }

  function handleFrameChange(frameId: string) {
    if (!frameId) return
    const frame = FRAMES.find((f) => f.id === frameId)
    if (!frame || !isRoutePermitted(role, frame.href)) return
    router.push(frame.href)
  }

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-700/60 bg-zinc-900 px-4">
      {/* Left — prototype badge */}
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-amber-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Prototype
        </span>
      </div>

      {/* Right — demo selectors */}
      <div className="flex items-center gap-5">
        {/* Frame selector */}
        <label className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Frame</span>
          <select
            value={currentFrameId}
            onChange={(e) => handleFrameChange(e.target.value)}
            className="h-6 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[11px] text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {!currentFrameId && (
              <option value="" disabled>
                —
              </option>
            )}
            {FRAMES.map((f) => {
              const permitted = isRoutePermitted(role, f.href)
              return (
                <option key={f.id} value={f.id} disabled={!permitted}>
                  {f.label}
                  {!permitted ? " — restricted" : ""}
                </option>
              )
            })}
          </select>
        </label>

        {/* Divider */}
        <span className="h-3.5 w-px bg-zinc-700" />

        {/* Role selector */}
        <label className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Role</span>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="h-6 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[11px] text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
