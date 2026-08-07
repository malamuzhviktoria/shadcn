"use client"

import { Archive, CircleCheck, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

export type EmployeeStatus = "active" | "invited" | "archived"

type StatusEntry = {
  label: string
  icon: typeof CircleCheck
  cls: string
}

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, StatusEntry> = {
  active: {
    label: "Active",
    icon: CircleCheck,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  invited: {
    label: "Invited",
    icon: Mail,
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400",
  },
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const { label, icon: Icon, cls } = EMPLOYEE_STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", cls)}>
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
