"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type BreadcrumbContextValue = {
  extra: string | null
  setExtra: (label: string | null) => void
  onParentClick: (() => void) | null
  setOnParentClick: (fn: (() => void) | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  extra: null,
  setExtra: () => {},
  onParentClick: null,
  setOnParentClick: () => {},
})

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [extra, setExtraRaw] = useState<string | null>(null)
  const [onParentClick, setOnParentClickRaw] = useState<(() => void) | null>(null)

  const setExtra = useCallback((label: string | null) => setExtraRaw(label), [])

  // Wrap fn in a thunk so React doesn't treat it as a state updater function
  const setOnParentClick = useCallback((fn: (() => void) | null) => {
    setOnParentClickRaw(fn === null ? null : () => fn)
  }, [])

  return (
    <BreadcrumbContext.Provider value={{ extra, setExtra, onParentClick, setOnParentClick }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbExtra() {
  return useContext(BreadcrumbContext)
}
