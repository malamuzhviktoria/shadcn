"use client"

import * as React from "react"

export type Theme = "light" | "dark"

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

const STORAGE_KEY = "sc-theme"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from what the blocking script already applied to the DOM.
  // This avoids a toggle-UI flicker on first render when dark is preferred.
  const [theme, setThemeState] = React.useState<Theme>("light")

  React.useEffect(() => {
    // The inline script in layout.tsx already set the class; read it back.
    const applied = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
    setThemeState(applied)
  }, [])

  function setTheme(next: Theme) {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
