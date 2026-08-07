"use client"

import * as React from "react"

type SidebarCtx = {
  open: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarCtx>({
  open: true,
  toggleSidebar: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)

  // Read persisted preference after hydration
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("sc-sidebar")
      if (stored !== null) setOpen(stored !== "false")
    } catch {}
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      try { localStorage.setItem("sc-sidebar", String(next)) } catch {}
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}
