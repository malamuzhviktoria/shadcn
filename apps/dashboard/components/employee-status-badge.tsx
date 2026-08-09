"use client"

import { Archive, CircleCheck, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BadgeVariant } from "@/components/ui/badge"

export type EmployeeStatus = "active" | "invited" | "archived"

type StatusEntry = {
  label: string
  icon: typeof CircleCheck
  variant: BadgeVariant
}

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, StatusEntry> = {
  active: {
    label: "Active",
    icon: CircleCheck,
    variant: "success",
  },
  invited: {
    label: "Invited",
    icon: Mail,
    variant: "info",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    variant: "neutral",
  },
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const { label, icon: Icon, variant } = EMPLOYEE_STATUS_CONFIG[status]
  return (
    <Badge variant={variant}>
      <Icon className="size-3.5 shrink-0" />
      {label}
    </Badge>
  )
}
