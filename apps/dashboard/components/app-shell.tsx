"use client"

import { SidebarProvider } from "@/lib/sidebar-context"
import { BreadcrumbProvider } from "@/lib/breadcrumb-context"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BreadcrumbProvider>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="@container flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
      </BreadcrumbProvider>
    </SidebarProvider>
  )
}
