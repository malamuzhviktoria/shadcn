"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type BreadcrumbContextValue = {
  extra: string | null
  setExtra: (label: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  extra: null,
  setExtra: () => {},
})

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [extra, setExtraRaw] = useState<string | null>(null)
  const setExtra = useCallback((label: string | null) => setExtraRaw(label), [])
  return (
    <BreadcrumbContext.Provider value={{ extra, setExtra }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbExtra() {
  return useContext(BreadcrumbContext)
}
