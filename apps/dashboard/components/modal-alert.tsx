"use client"

import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type AlertVariant = "error" | "warning" | "info"

const VARIANTS: Record<AlertVariant, {
  container: string
  Icon: React.ComponentType<{ className?: string }>
  iconCls: string
  titleCls: string
  bodyCls: string
}> = {
  error: {
    container: "border-destructive/30 bg-destructive/5",
    Icon: AlertCircle,
    iconCls: "text-destructive",
    titleCls: "font-medium text-destructive",
    bodyCls: "text-destructive/80",
  },
  warning: {
    container: "border-amber-300/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-500/10",
    Icon: AlertTriangle,
    iconCls: "text-amber-600 dark:text-amber-400",
    titleCls: "font-medium text-amber-800 dark:text-amber-300",
    bodyCls: "text-amber-700 dark:text-amber-400",
  },
  info: {
    container: "border-blue-300 bg-blue-50",
    Icon: Info,
    iconCls: "text-blue-700",
    titleCls: "font-medium text-blue-900",
    bodyCls: "text-blue-800",
  },
}

export function AlertBox({
  variant,
  title,
  children,
}: {
  variant: AlertVariant
  title?: string
  children: React.ReactNode
}) {
  const { container, Icon, iconCls, titleCls, bodyCls } = VARIANTS[variant]
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", container)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconCls)} />
      <div>
        {title && <p className={titleCls}>{title}</p>}
        <p className={cn(title ? "mt-0.5" : "", bodyCls)}>{children}</p>
      </div>
    </div>
  )
}
