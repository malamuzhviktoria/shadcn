"use client"

import { usePathname } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import type { ReactNode } from "react"

export function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith("/auth")) {
    return <div className="flex flex-1 overflow-y-auto">{children}</div>
  }
  return <AppShell>{children}</AppShell>
}
