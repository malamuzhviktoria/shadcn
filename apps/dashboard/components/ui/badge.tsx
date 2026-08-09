import { cn } from "@/lib/utils"

const VARIANTS = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  info:    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger:  "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-400",
  outline: "border border-border bg-background text-foreground",
} as const

export type BadgeVariant = keyof typeof VARIANTS

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
