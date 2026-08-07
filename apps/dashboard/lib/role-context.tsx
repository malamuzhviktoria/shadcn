"use client"

import * as React from "react"

export type Role =
  | "super-admin"
  | "head-office"
  | "head-of-area"
  | "area-manager"

export const ROLES: Role[] = [
  "super-admin",
  "head-office",
  "head-of-area",
  "area-manager",
]

export const ROLE_LABELS: Record<Role, string> = {
  "super-admin": "Super Admin",
  "head-office": "Head Office",
  "head-of-area": "Head of Area",
  "area-manager": "Area Manager",
}

// Base routes each role may access. Prefix-matched: /employees covers /employees/[id]
export const ROLE_PERMITTED_ROUTES: Record<Role, string[]> = {
  "super-admin": [
    "/employees",
    "/timesheets",
    "/sites",
    "/areas",
    "/customers",
    "/users",
    "/audit",
    "/settings",
    "/auth",
  ],
  "head-office": [
    "/employees",
    "/timesheets",
    "/sites",
    "/areas",
    "/customers",
    "/users",
    "/audit",
    "/auth",
  ],
  "head-of-area": [
    "/employees",
    "/timesheets",
    "/sites",
    "/areas",
    "/audit",
    "/auth",
  ],
  "area-manager": [
    "/employees",
    "/timesheets",
    "/sites",
    "/areas",
    "/auth",
  ],
}

export function isRoutePermitted(role: Role, pathname: string): boolean {
  return ROLE_PERMITTED_ROUTES[role].some(
    (base) => pathname === base || pathname.startsWith(base + "/")
  )
}

const RoleContext = React.createContext<{
  role: Role
  setRole: (role: Role) => void
} | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>("super-admin")
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = React.useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within RoleProvider")
  return ctx
}
