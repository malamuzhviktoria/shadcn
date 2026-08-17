"use client"

import { cn } from "@/lib/utils"

interface TabItem<T extends string> {
  id: T
  label: React.ReactNode
}

interface TabSwitcherProps<T extends string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function TabSwitcher<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabSwitcherProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex w-fit rounded-lg border border-border bg-muted/30 p-0.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
              value === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
