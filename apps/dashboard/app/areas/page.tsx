"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Pencil, Archive,
  AlertTriangle, CheckCircle, X, Loader2, Info, AlertCircle,
  ChevronDown, RotateCcw, MapPin, ExternalLink, EllipsisVertical,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useRouter } from "next/navigation"
import { useBreadcrumbExtra } from "@/lib/breadcrumb-context"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Area {
  id: string
  areaName: string
  hoaEmail: string | null
  hoaName: string | null
}

interface AreaSite {
  id: string
  siteNumber: string
  siteName: string
  areaManagerName: string
}

type AreaView = { name: "list" } | { name: "detail"; areaId: string }

// ── Reference Data ─────────────────────────────────────────────────────────────

const HOA_USERS = [
  { email: "sarah.whitmore@spectrumclean.co.uk",  name: "Sarah Whitmore" },
  { email: "marcus.reid@spectrumclean.co.uk",     name: "Marcus Reid" },
  { email: "joanna.clarke@spectrumclean.co.uk",   name: "Joanna Clarke" },
  { email: "patricia.nolan@spectrumclean.co.uk",  name: "Patricia Nolan" },
  { email: "daniel.forsyth@spectrumclean.co.uk",  name: "Daniel Forsyth" },
  { email: "christine.lawson@spectrumclean.co.uk", name: "Christine Lawson" },
]

// The HoA role preview in this prototype is assigned to North Area
const HOA_ASSIGNED_AREA_ID = "a1"

// ── Sample Data ────────────────────────────────────────────────────────────────

const INITIAL_AREAS: Area[] = [
  { id: "a1", areaName: "North Area",         hoaEmail: "sarah.whitmore@spectrumclean.co.uk",  hoaName: "Sarah Whitmore" },
  { id: "a2", areaName: "South Area",         hoaEmail: "marcus.reid@spectrumclean.co.uk",     hoaName: "Marcus Reid" },
  { id: "a3", areaName: "East Midlands Area", hoaEmail: "joanna.clarke@spectrumclean.co.uk",   hoaName: "Joanna Clarke" },
  { id: "a4", areaName: "Yorkshire Area",     hoaEmail: "patricia.nolan@spectrumclean.co.uk",  hoaName: "Patricia Nolan" },
  { id: "a5", areaName: "East Anglia Area",   hoaEmail: "daniel.forsyth@spectrumclean.co.uk",  hoaName: "Daniel Forsyth" },
  // West Area has no HoA — demonstrates the unassigned-indicator / contradiction
  { id: "a6",  areaName: "West Area",             hoaEmail: null,                                          hoaName: null },
  { id: "a7",  areaName: "South East Area",        hoaEmail: "caroline.bates@spectrumclean.co.uk",         hoaName: "Caroline Bates" },
  { id: "a8",  areaName: "South West Area",        hoaEmail: "david.lennox@spectrumclean.co.uk",           hoaName: "David Lennox" },
  { id: "a9",  areaName: "Midlands Area",          hoaEmail: "emily.cross@spectrumclean.co.uk",            hoaName: "Emily Cross" },
  { id: "a10", areaName: "Scotland Area",          hoaEmail: "callum.fraser@spectrumclean.co.uk",          hoaName: "Callum Fraser" },
  { id: "a11", areaName: "Wales Area",             hoaEmail: "owen.roberts@spectrumclean.co.uk",           hoaName: "Owen Roberts" },
  { id: "a12", areaName: "Greater Manchester Area",hoaEmail: "nisha.patel@spectrumclean.co.uk",            hoaName: "Nisha Patel" },
  { id: "a13", areaName: "Greater London Area",    hoaEmail: "tom.whitfield@spectrumclean.co.uk",          hoaName: "Tom Whitfield" },
  { id: "a14", areaName: "Northern Ireland Area",  hoaEmail: null,                                          hoaName: null },
  { id: "a15", areaName: "Eastern Area",           hoaEmail: "grace.henderson@spectrumclean.co.uk",        hoaName: "Grace Henderson" },
]

// Sites per area — mirrors Sites page data (s1–s7 IDs)
const AREA_SITES: Record<string, AreaSite[]> = {
  a1: [
    { id: "s1", siteNumber: "S-001", siteName: "Citygate House",           areaManagerName: "Alex Thompson" },
    { id: "s2", siteNumber: "S-002", siteName: "Parkside Office Complex",  areaManagerName: "Alex Thompson" },
    { id: "s3", siteNumber: "S-003", siteName: "Riverside Plaza",          areaManagerName: "Alex Thompson" },
    { id: "s6", siteNumber: "S-006", siteName: "The Exchange Building",    areaManagerName: "Alex Thompson" },
  ],
  a2: [
    { id: "s4", siteNumber: "S-004", siteName: "Highfield Tower",                areaManagerName: "Rachel Moore" },
    { id: "s5", siteNumber: "S-005", siteName: "Apex House",                     areaManagerName: "Rachel Moore" },
    { id: "s7", siteNumber: "S-007", siteName: "Crown Court Business Centre",    areaManagerName: "Rachel Moore" },
  ],
  a3: [
    { id: "s-em1", siteNumber: "S-EM-001", siteName: "Waterfront Business Centre", areaManagerName: "Claire Baxter" },
  ],
  a4: [
    { id: "s30", siteNumber: "S-030", siteName: "Northgate House",   areaManagerName: "Sandra Bates" },
    { id: "s31", siteNumber: "S-031", siteName: "Elmwood Park",       areaManagerName: "Sandra Bates" },
  ],
  a5: [
    { id: "s-ea1", siteNumber: "S-EA-001", siteName: "Ipswich Business Centre", areaManagerName: "Mark Osborne" },
  ],
  a6: [], // West — no sites, no HoA
  a7: [
    { id: "s-se1", siteNumber: "S-SE-001", siteName: "Canary Wharf Office",    areaManagerName: "Louise Grant" },
    { id: "s-se2", siteNumber: "S-SE-002", siteName: "Dartford Exchange",       areaManagerName: "Louise Grant" },
    { id: "s-se3", siteNumber: "S-SE-003", siteName: "Brighton Seafront Hub",   areaManagerName: "Pete Rowan" },
  ],
  a8: [
    { id: "s31",   siteNumber: "S-031",    siteName: "Cabot Circus",            areaManagerName: "James Harley" },
    { id: "s32",   siteNumber: "S-032",    siteName: "Central Square Cardiff",  areaManagerName: "James Harley" },
    { id: "s40",   siteNumber: "S-040",    siteName: "St David's Dewi Sant",    areaManagerName: "James Harley" },
  ],
  a9: [
    { id: "s34",   siteNumber: "S-034",    siteName: "Friargate Tower",         areaManagerName: "Claire Baxter" },
    { id: "s35",   siteNumber: "S-035",    siteName: "Mander Centre",           areaManagerName: "Claire Baxter" },
    { id: "s36",   siteNumber: "S-036",    siteName: "Broadmarsh Centre",       areaManagerName: "Claire Baxter" },
    { id: "s37",   siteNumber: "S-037",    siteName: "Highcross Leicester",     areaManagerName: "Claire Baxter" },
  ],
  a10: [
    { id: "s-sc1", siteNumber: "S-SC-001", siteName: "St Vincent Street",      areaManagerName: "Angus Drummond" },
    { id: "s-sc2", siteNumber: "S-SC-002", siteName: "Edinburgh Gate",         areaManagerName: "Angus Drummond" },
  ],
  a11: [
    { id: "s32",   siteNumber: "S-032",    siteName: "Central Square",         areaManagerName: "Owen Roberts" },
    { id: "s-wl1", siteNumber: "S-WL-001", siteName: "Swansea Marina Hub",    areaManagerName: "Owen Roberts" },
  ],
  a12: [
    { id: "s38",   siteNumber: "S-038",    siteName: "Liverpool One",          areaManagerName: "Nisha Patel" },
    { id: "s-nm1", siteNumber: "S-NM-001", siteName: "Spinningfields Tower",  areaManagerName: "Nisha Patel" },
    { id: "s-nm2", siteNumber: "S-NM-002", siteName: "MediaCity UK",          areaManagerName: "Nisha Patel" },
  ],
  a13: [
    { id: "s-gl1", siteNumber: "S-GL-001", siteName: "Bishopsgate House",     areaManagerName: "Tom Whitfield" },
    { id: "s-gl2", siteNumber: "S-GL-002", siteName: "King's Cross Central",  areaManagerName: "Tom Whitfield" },
    { id: "s-gl3", siteNumber: "S-GL-003", siteName: "Canary Wharf South",    areaManagerName: "Priya Kapoor" },
    { id: "s-gl4", siteNumber: "S-GL-004", siteName: "Southbank Tower",       areaManagerName: "Priya Kapoor" },
  ],
  a14: [], // Northern Ireland — no sites, no HoA
  a15: [
    { id: "s-es1", siteNumber: "S-ES-001", siteName: "Norwich Business Park", areaManagerName: "Grace Henderson" },
    { id: "s-es2", siteNumber: "S-ES-002", siteName: "Cambridge Science Park", areaManagerName: "Grace Henderson" },
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

function countManagers(sites: AreaSite[]): number {
  return new Set(sites.map(s => s.areaManagerName)).size
}

// ── Primitive UI ───────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const selectCls =
  "h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm text-foreground">{children}</div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function WarningNote({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        {title && <p className="text-sm font-medium text-destructive">{title}</p>}
        <p className="text-sm text-destructive/80">{children}</p>
      </div>
    </div>
  )
}

function UnassignedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <AlertCircle className="size-3.5 shrink-0" />
      <span className="text-sm">Not assigned</span>
    </span>
  )
}

function Modal({
  open, onClose, title, children, lockClose = false,
}: {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, lockClose, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!lockClose ? onClose : undefined} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-xl border border-border bg-background shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button onClick={onClose} className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-4" /><span className="sr-only">Close</span>
            </button>
          )}
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function StepSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// Fixed-position row action menu — used in the Areas table
function AreaRowActionMenu({ onEdit, onArchive }: { onEdit: () => void; onArchive: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        items[(e.key === "ArrowDown" ? idx + 1 : idx - 1 + items.length) % items.length]?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    setTimeout(() => { (menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus() }, 10)
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey) }
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  function pick(action: () => void) {
    return (e: React.MouseEvent) => { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); action() }
  }

  return (
    <div ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-accent text-accent-foreground",
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
          className="w-44 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button role="menuitem" type="button" onClick={pick(onEdit)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
            Edit Area
          </button>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button role="menuitem" type="button" onClick={pick(onArchive)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10">
            <Archive className="size-3.5 shrink-0" />
            Archive Area
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AreaListView({
  areas,
  canManage,
  onSelectArea,
  onCreateArea,
  onEditArea,
  onArchiveArea,
}: {
  areas: Area[]
  canManage: boolean
  onSelectArea: (id: string) => void
  onCreateArea: () => void
  onEditArea: (area: Area) => void
  onArchiveArea: (area: Area) => void
}) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => { setPage(1) }, [search, perPage])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return areas
    return areas.filter(a => a.areaName.toLowerCase().includes(q))
  }, [areas, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Areas ({areas.length})</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage cleaning operation areas and their Heads of Area.
          </p>
        </div>
        {canManage && (
          <button
            onClick={onCreateArea}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create Area
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by area name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Table container */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {areas.length === 0 ? (
          /* Empty state — no areas exist at all */
          <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
            <div className="rounded-full bg-muted p-3">
              <MapPin className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No areas yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {canManage
                  ? "Create your first area to organise your Sites and Heads of Area."
                  : "No areas have been configured."}
              </p>
            </div>
            {canManage && (
              <button
                onClick={onCreateArea}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Create Area
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[27%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                {canManage && <col className="w-[7%]" />}
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Head of Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sites</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Managers</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  /* No search results */
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="size-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No areas found for <strong>&ldquo;{search}&rdquo;</strong>
                        </p>
                        <button
                          onClick={() => setSearch("")}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map(area => {
                    const sites = AREA_SITES[area.id] ?? []
                    const managerCount = countManagers(sites)
                    return (
                      <tr
                        key={area.id}
                        onClick={() => onSelectArea(area.id)}
                        className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-foreground hover:underline">{area.areaName}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">
                          {area.hoaName ? area.hoaName : <UnassignedBadge />}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{sites.length}</td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{managerCount}</td>
                        {canManage && (
                          <td className="px-2 py-2.5">
                            <div className="flex justify-end">
                              <AreaRowActionMenu
                                onEdit={() => onEditArea(area)}
                                onArchive={() => onArchiveArea(area)}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* Pagination footer */}
            {filtered.length > 0 && (
              <div className="flex items-center gap-4 border-t border-border px-4 py-3">
                <div className="flex shrink-0 items-center gap-2">
                  <div className="relative flex items-center">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                      className="flex h-8 appearance-none rounded-md border border-input bg-muted/50 pl-2.5 pr-7 text-xs font-medium transition-colors hover:border-input-hover focus:outline-none focus:ring-2 focus:ring-ring">
                      {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
                </div>
                <div className="flex-1" />
                <div className="flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setPage(1)} disabled={currentPage === 1}
                      aria-label="First page"
                      className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronsLeft className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronLeft className="size-3.5" />
                    </button>
                    {getPageWindow(currentPage, totalPages).map(n => (
                      <button key={n} type="button" onClick={() => setPage(n)}
                        aria-label={`Page ${n}`}
                        aria-current={n === currentPage ? "page" : undefined}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                          n === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                        )}>
                        {n}
                      </button>
                    ))}
                    <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronRight className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}
                      aria-label="Last page"
                      className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronsRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AreaDetailView({
  area,
  sites,
  canManage,
  isHoA,
  onBack,
  onEdit,
  onArchive,
  onOpenSite,
}: {
  area: Area
  sites: AreaSite[]
  canManage: boolean
  isHoA: boolean
  onBack: () => void
  onEdit: () => void
  onArchive: () => void
  onOpenSite: (siteId: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header — matches Employee Profile / SiteDetails pattern */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isHoA && (
            <button
              onClick={onBack}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted"
              aria-label="Back to Areas"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <h1 className="text-xl font-semibold">{area.areaName}</h1>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="size-4" />
              Edit Area
            </button>
            <button
              onClick={onArchive}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Archive className="size-4" />
              Archive Area
            </button>
          </div>
        )}
      </div>

      {/* Area Information — Employee Profile card pattern */}
      <SectionCard title="Area Information">
        <div className="divide-y divide-border">
          <Field label="Area Name">{area.areaName}</Field>
          {!isHoA && (
            <Field label="Head of Area">
              {area.hoaName ? area.hoaName : <UnassignedBadge />}
            </Field>
          )}
        </div>
      </SectionCard>

      {/* Sites within Area — flat section, no nested card */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Sites ({sites.length})
        </h2>

        {sites.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/20 px-8 py-12 text-center">
            <div className="rounded-full bg-muted p-2.5">
              <MapPin className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No Sites in this Area</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Sites assigned to {area.areaName} will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-1/2 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area Manager</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr
                    key={site.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td
                      className="cursor-pointer px-4 py-3.5"
                      onClick={() => onOpenSite(site.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold hover:underline">{site.siteName}</span>
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{site.siteNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{site.areaManagerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AreaForm({
  areas,
  initial,
  editingId,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  areas: Area[]
  initial: { areaName: string; hoaEmail: string }
  editingId?: string
  onSubmit: (areaName: string, hoaEmail: string, hoaName: string) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [areaName, setAreaName] = useState(initial.areaName)
  const [hoaEmail, setHoaEmail] = useState(initial.hoaEmail)
  const [touched, setTouched] = useState({ areaName: false, hoaEmail: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const existingNames = useMemo(
    () => areas.filter(a => a.id !== editingId).map(a => a.areaName.toLowerCase()),
    [areas, editingId],
  )

  const nameError = !areaName.trim()
    ? "Area Name is required"
    : existingNames.includes(areaName.trim().toLowerCase())
    ? "An Area with this name already exists"
    : null

  const hoaError = !hoaEmail ? "Head of Area is required" : null

  const valid = !nameError && !hoaError

  // For reassignment warning: check if selected HoA already manages a different Area
  const conflictingArea = useMemo(
    () => hoaEmail ? areas.find(a => a.id !== editingId && a.hoaEmail === hoaEmail) : null,
    [hoaEmail, areas, editingId],
  )
  const originalHoaEmail = initial.hoaEmail
  const hoaChanged = hoaEmail !== originalHoaEmail

  function handleSubmit() {
    setTouched({ areaName: true, hoaEmail: true })
    if (!valid) return
    setSaving(true)
    setTimeout(() => {
      const user = HOA_USERS.find(u => u.email === hoaEmail)!
      setSaving(false)
      setSaved(true)
      setTimeout(() => onSubmit(areaName.trim(), hoaEmail, user.name), 700)
    }, 1200)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="rounded-full bg-green-50 p-3 dark:bg-green-900/20">
          <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-medium">
            {editingId ? "Area updated" : "Area created"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {editingId ? "Changes saved successfully." : "Navigating to Area Details…"}
          </p>
        </div>
      </div>
    )
  }

  if (saving) return <StepSpinner label={editingId ? "Saving changes…" : "Creating area…"} />

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Area Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Area Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. North West Area"
          value={areaName}
          onChange={e => setAreaName(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, areaName: true }))}
          className={inputCls + (touched.areaName && nameError ? " border-destructive focus:ring-destructive" : "")}
        />
        {touched.areaName && nameError && (
          <p className="text-xs text-destructive">{nameError}</p>
        )}
      </div>

      {/* Head of Area */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Head of Area <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <select
            value={hoaEmail}
            onChange={e => setHoaEmail(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, hoaEmail: true }))}
            className={selectCls + (touched.hoaEmail && hoaError ? " border-destructive focus:ring-destructive" : "")}
          >
            <option value="">Select Head of Area…</option>
            {HOA_USERS.map(u => (
              <option key={u.email} value={u.email}>{u.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
        </div>
        {touched.hoaEmail && hoaError && (
          <p className="text-xs text-destructive">{hoaError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Only Admin Users with the Head of Area role are shown.
        </p>
      </div>

      {/* HoA reassignment warning */}
      {hoaChanged && hoaEmail && (
        conflictingArea ? (
          <WarningNote title="Head of Area reassignment">
            {HOA_USERS.find(u => u.email === hoaEmail)?.name} is currently the Head of Area for{" "}
            <strong>{conflictingArea.areaName}</strong>. Saving will reassign them here and leave{" "}
            {conflictingArea.areaName} without a Head of Area. Review that Area afterwards.
          </WarningNote>
        ) : editingId ? (
          <InfoNote>
            {HOA_USERS.find(u => u.email === hoaEmail)?.name} will immediately take responsibility for this
            Area. The previous Head of Area will lose their assignment.
          </InfoNote>
        ) : null
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ArchiveAreaModal({
  area,
  sites,
  onClose,
  onConfirm,
}: {
  area: Area
  sites: AreaSite[]
  onClose: () => void
  onConfirm: () => void
}) {
  const hasActiveSites = sites.length > 0
  const [archiving, setArchiving] = useState(false)
  const [archived, setArchived] = useState(false)

  function handleConfirm() {
    setArchiving(true)
    setTimeout(() => {
      setArchiving(false)
      setArchived(true)
      setTimeout(onConfirm, 700)
    }, 1300)
  }

  return (
    <Modal open onClose={archiving || archived ? () => {} : onClose} title="Archive Area" lockClose={archiving || archived}>
      {archived ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <CheckCircle className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{area.areaName} archived</p>
            <p className="mt-0.5 text-sm text-muted-foreground">The Area has been removed from the active list.</p>
          </div>
        </div>
      ) : archiving ? (
        <StepSpinner label="Archiving area…" />
      ) : hasActiveSites ? (
        /* Blocked — active Sites exist */
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Cannot archive this Area</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>{area.areaName}</strong> contains{" "}
                <strong>{sites.length} active {sites.length === 1 ? "Site" : "Sites"}</strong>.
                All Sites must be reassigned to another Area or archived before this Area can be archived.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Go to the Area Details Site list to reassign or archive the remaining Sites.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        /* Confirm — safe to archive */
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-muted-foreground">
            Archiving <strong>{area.areaName}</strong> will make it inactive. It will no longer appear in the Areas list.
          </p>
          {!area.hoaName && (
            <InfoNote>This Area has no Head of Area assigned.</InfoNote>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              Archive Area
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AreasPage() {
  const { role } = useRole()
  const router = useRouter()
  const { setExtra, setOnParentClick } = useBreadcrumbExtra()

  const canManage = role === "super-admin" || role === "head-office"
  const isHoA = role === "head-of-area"
  const isAM = role === "area-manager"

  const [areas, setAreas] = useState<Area[]>(INITIAL_AREAS)
  const [view, setView] = useState<AreaView>({ name: "list" })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Simulate initial page load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  // Role changes: HoA goes directly to their area detail; AM sees access denied
  useEffect(() => {
    if (role === "head-of-area") {
      setView({ name: "detail", areaId: HOA_ASSIGNED_AREA_ID })
    } else if (role === "area-manager") {
      setView({ name: "list" })
    }
    // SA/HO: leave view as-is
  }, [role])

  // Update app-header breadcrumb when entering/leaving a detail view
  useEffect(() => {
    if (view.name === "detail") {
      const area = areas.find(a => a.id === (view as { name: "detail"; areaId: string }).areaId)
      setExtra(area?.areaName ?? null)
      setOnParentClick(() => setView({ name: "list" }))
    } else {
      setExtra(null)
      setOnParentClick(null)
    }
    return () => { setExtra(null); setOnParentClick(null) }
  }, [view, areas, setExtra, setOnParentClick])

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editArea, setEditArea] = useState<Area | null>(null)
  const [archiveArea, setArchiveArea] = useState<Area | null>(null)

  // Navigate to Site Details via sessionStorage handshake
  function openSiteDetail(siteId: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sc:openSiteId", siteId)
    }
    router.push("/sites")
  }

  // CRUD handlers
  function handleCreate(areaName: string, hoaEmail: string, hoaName: string) {
    const id = `a-${Date.now()}`
    // If this HoA is already managing another area, clear that assignment
    setAreas(prev => {
      const updated = prev.map(a =>
        a.hoaEmail === hoaEmail ? { ...a, hoaEmail: null, hoaName: null } : a
      )
      return [...updated, { id, areaName, hoaEmail, hoaName }]
    })
    setCreateOpen(false)
    setView({ name: "detail", areaId: id })
  }

  function handleEdit(areaId: string, areaName: string, hoaEmail: string, hoaName: string) {
    setAreas(prev =>
      prev.map(a => {
        if (a.id === areaId) return { ...a, areaName, hoaEmail, hoaName }
        // Clear the HoA from any other area that currently holds the same email
        if (hoaEmail && a.hoaEmail === hoaEmail) return { ...a, hoaEmail: null, hoaName: null }
        return a
      }),
    )
    setEditArea(null)
  }

  function handleArchive(areaId: string) {
    setAreas(prev => prev.filter(a => a.id !== areaId))
    setArchiveArea(null)
    setView({ name: "list" })
  }

  // ── Render: loading ──────────────────────────────────────────────────────────

  if (loading && !isAM) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Areas</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage cleaning operation areas and their Heads of Area.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-border bg-card py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading areas…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: page-level error ─────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Areas</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage cleaning operation areas and their Heads of Area.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">Failed to load areas</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Something went wrong while loading the Areas list.
            </p>
          </div>
          <button
            onClick={() => {
              setLoadError(false)
              setLoading(true)
              setTimeout(() => setLoading(false), 700)
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Area Manager — no access ─────────────────────────────────────────

  if (isAM) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Areas</h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <MapPin className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Area Managers do not have access to the Areas list.
          </p>
        </div>
      </div>
    )
  }

  // ── Render: list view ─────────────────────────────────────────────────────────

  if (view.name === "list") {
    return (
      <>
        <AreaListView
          areas={areas}
          canManage={canManage}
          onSelectArea={id => setView({ name: "detail", areaId: id })}
          onCreateArea={() => setCreateOpen(true)}
          onEditArea={area => setEditArea(area)}
          onArchiveArea={area => setArchiveArea(area)}
        />

        {createOpen && (
          <Modal open onClose={() => setCreateOpen(false)} title="Create Area">
            <AreaForm
              areas={areas}
              initial={{ areaName: "", hoaEmail: "" }}
              submitLabel="Create Area"
              onCancel={() => setCreateOpen(false)}
              onSubmit={handleCreate}
            />
          </Modal>
        )}

        {editArea && (
          <Modal open onClose={() => setEditArea(null)} title="Edit Area">
            <AreaForm
              areas={areas}
              initial={{ areaName: editArea.areaName, hoaEmail: editArea.hoaEmail ?? "" }}
              editingId={editArea.id}
              submitLabel="Save changes"
              onCancel={() => setEditArea(null)}
              onSubmit={(name, email, hoaName) => handleEdit(editArea.id, name, email, hoaName)}
            />
          </Modal>
        )}

        {archiveArea && (
          <ArchiveAreaModal
            area={archiveArea}
            sites={AREA_SITES[archiveArea.id] ?? []}
            onClose={() => setArchiveArea(null)}
            onConfirm={() => handleArchive(archiveArea.id)}
          />
        )}
      </>
    )
  }

  // ── Render: detail view ───────────────────────────────────────────────────────

  const areaId = (view as { name: "detail"; areaId: string }).areaId
  const area = areas.find(a => a.id === areaId)

  if (!area) {
    // Area was just archived — brief fallback before list re-renders
    return null
  }

  const areaSites = AREA_SITES[area.id] ?? []

  return (
    <>
      <AreaDetailView
        area={area}
        sites={areaSites}
        canManage={canManage}
        isHoA={isHoA}
        onBack={() => setView({ name: "list" })}
        onEdit={() => setEditArea(area)}
        onArchive={() => setArchiveArea(area)}
        onOpenSite={openSiteDetail}
      />

      {editArea && (
        <Modal open onClose={() => setEditArea(null)} title="Edit Area">
          <AreaForm
            areas={areas}
            initial={{ areaName: editArea.areaName, hoaEmail: editArea.hoaEmail ?? "" }}
            editingId={editArea.id}
            submitLabel="Save changes"
            onCancel={() => setEditArea(null)}
            onSubmit={(name, email, hoaName) => handleEdit(editArea.id, name, email, hoaName)}
          />
        </Modal>
      )}

      {archiveArea && (
        <ArchiveAreaModal
          area={archiveArea}
          sites={AREA_SITES[archiveArea.id] ?? []}
          onClose={() => setArchiveArea(null)}
          onConfirm={() => handleArchive(archiveArea.id)}
        />
      )}
    </>
  )
}
