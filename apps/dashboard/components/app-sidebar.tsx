"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  ClipboardList,
  Clock,
  Layers,
  Map,
  MapPin,
  Settings,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useRole, Role } from "@/lib/role-context"
import { useSidebar } from "@/lib/sidebar-context"

type NavItem = {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  group: string
  items: NavItem[]
}

const EMPLOYEES  = { id: "employees",   label: "Employees",       href: "/employees",  icon: Users        }
const TIMESHEETS = { id: "timesheets",  label: "Timesheets",      href: "/timesheets", icon: Clock        }
const SITES      = { id: "sites",       label: "Sites",           href: "/sites",      icon: MapPin       }
const AREAS      = { id: "areas",       label: "Areas",           href: "/areas",      icon: Map          }
const CUSTOMERS  = { id: "customers",   label: "Customers",       href: "/customers",  icon: Building2    }
const ADMIN_USERS = { id: "admin-users", label: "Admin users",   href: "/users",      icon: UserCog      }
const AUDIT      = { id: "audit",       label: "Audit trail",     href: "/audit",      icon: ClipboardList }
const SETTINGS   = { id: "settings",    label: "System settings", href: "/settings",   icon: Settings     }

const WORKFORCE: NavGroup = { group: "Workforce", items: [EMPLOYEES, TIMESHEETS] }

function getNavGroups(role: Role): NavGroup[] {
  switch (role) {
    case "super-admin":
      return [
        WORKFORCE,
        { group: "Operations",     items: [SITES, AREAS, CUSTOMERS] },
        { group: "Administration", items: [ADMIN_USERS, AUDIT, SETTINGS] },
      ]
    case "head-office":
      return [
        WORKFORCE,
        { group: "Operations",     items: [SITES, AREAS, CUSTOMERS] },
        { group: "Administration", items: [ADMIN_USERS, AUDIT] },
      ]
    case "head-of-area":
      return [
        WORKFORCE,
        { group: "Operations",     items: [SITES] },
        { group: "Administration", items: [AUDIT] },
      ]
    case "area-manager":
      return [
        WORKFORCE,
        { group: "Operations",     items: [SITES] },
      ]
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const { role } = useRole()
  const { open } = useSidebar()
  const navGroups = getNavGroups(role)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-in-out",
        open ? "w-60" : "w-14"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border",
          open ? "gap-2.5 px-4" : "justify-center"
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-3.5" />
        </div>
        {open && (
          <span className="overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight">
            SpectrumClean
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 pt-3"
        aria-label="Primary"
      >
        {navGroups.map((group) => (
          <div key={group.group} className="flex flex-col gap-0.5">
            {open ? (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.group}
              </p>
            ) : (
              <div className="mb-1 h-px bg-sidebar-border/60" />
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={isActive(item.href)}
                expanded={open}
              />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function NavItem({
  item,
  active,
  expanded,
}: {
  item: NavItem
  active: boolean
  expanded: boolean
}) {
  const Icon = item.icon
  const [tooltip, setTooltip] = React.useState<{ top: number; left: number } | null>(null)

  return (
    <div
      className="relative"
      onMouseEnter={(e) => {
        if (!expanded) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          setTooltip({ top: rect.top + rect.height / 2, left: rect.right + 8 })
        }
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={!expanded ? item.label : undefined}
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-colors",
          expanded
            ? "gap-2.5 px-2 py-1.5"
            : "h-9 justify-center",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" />
        {expanded && item.label}
      </Link>

      {/* Fixed-position tooltip — unaffected by overflow on ancestor elements */}
      {tooltip && !expanded && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: "translateY(-50%)",
          }}
        >
          {item.label}
        </div>
      )}
    </div>
  )
}
