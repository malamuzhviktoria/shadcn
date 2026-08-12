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

// Sidebar auto-collapses below this viewport width (Tailwind's xl = 1280px)
const COLLAPSE_AT = 1280

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  // tracks whether the user has explicitly toggled this session
  const userToggled = React.useRef(false)

  // After hydration: use stored preference if it exists, otherwise auto-detect viewport
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("sc-sidebar")
      if (stored !== null) {
        setOpen(stored !== "false")
        userToggled.current = true
      } else {
        setOpen(window.innerWidth >= COLLAPSE_AT)
      }
    } catch {}
  }, [])

  // Respond to viewport resize only when the user has not manually toggled
  React.useEffect(() => {
    function onResize() {
      if (!userToggled.current) {
        setOpen(window.innerWidth >= COLLAPSE_AT)
      }
    }
    window.addEventListener("resize", onResize, { passive: true })
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      userToggled.current = true
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
