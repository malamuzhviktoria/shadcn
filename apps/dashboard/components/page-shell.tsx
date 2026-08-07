import * as React from "react"
import { cn } from "@/lib/utils"

interface PageShellProps {
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageShell({
  title,
  description,
  action,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  )
}
