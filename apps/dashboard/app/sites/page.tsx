"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search, Upload, RefreshCw, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  Pencil, RotateCcw, AlertTriangle, CheckCircle, X,
  FileSpreadsheet, Download, Archive, ExternalLink,
  Loader2, FileUp, AlertCircle, ChevronDown,
  Info, MapPin,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell"
import { FilterDropdown } from "@/components/filter-dropdown"
import { useBreadcrumbExtra } from "@/lib/breadcrumb-context"
import { EmployeeStatusBadge } from "@/components/employee-status-badge"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyBudgets {
  mon: number; tue: number; wed: number; thu: number
  fri: number; sat: number; sun: number
}

interface Site {
  id: string
  siteNumber: string
  siteName: string
  city: string
  address: string
  postcode: string
  customerCode: string
  customerName: string
  area: string
  areaManagerEmail: string
  areaManagerName: string
  geofenceRadius: number
  dailyBudgets: DailyBudgets
}

type ArchivedSite = Site & { archivedDate: string }

interface PayRateOverride {
  id: string
  siteId: string
  employeeId: string
  employeeName: string
  taid: string
  jobRole: string
  payRate: number
  lastShiftDate: string
}

type View =
  | { name: "list" }
  | { name: "archived" }
  | { name: "detail"; siteId: string }
  | { name: "archived-detail"; siteId: string }

// ── Reference Data ────────────────────────────────────────────────────────────

const DAYS: { key: keyof DailyBudgets; short: string; long: string }[] = [
  { key: "mon", short: "Mon", long: "Monday" },
  { key: "tue", short: "Tue", long: "Tuesday" },
  { key: "wed", short: "Wed", long: "Wednesday" },
  { key: "thu", short: "Thu", long: "Thursday" },
  { key: "fri", short: "Fri", long: "Friday" },
  { key: "sat", short: "Sat", long: "Saturday" },
  { key: "sun", short: "Sun", long: "Sunday" },
]

const CUSTOMERS = [
  { code: "SCL", name: "Sparkle Clean Ltd" },
  { code: "BFM", name: "BrightSpace FM" },
  { code: "PFL", name: "ProFacility Ltd" },
  { code: "MTE", name: "Metro Estates Ltd" },
]

const AREA_MANAGERS_REF = [
  { email: "alex.thompson@spectrumclean.co.uk", name: "Alex Thompson" },
  { email: "rachel.moore@spectrumclean.co.uk", name: "Rachel Moore" },
]

const AREAS_LIST = ["North Area", "South Area"]

const PAGE_SIZE = 5

// ── Sample Data ───────────────────────────────────────────────────────────────

const INITIAL_SITES: Site[] = [
  {
    id: "s1", siteNumber: "S-001", siteName: "Citygate House",
    city: "Manchester", address: "48 Deansgate", postcode: "M2 4WD",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s2", siteNumber: "S-002", siteName: "Parkside Office Complex",
    city: "Salford", address: "12 Chapel Street", postcode: "M5 3AN",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
  },
  {
    id: "s3", siteNumber: "S-003", siteName: "Riverside Plaza",
    city: "Manchester", address: "3 Quay Street", postcode: "M1 5LE",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 75,
    dailyBudgets: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 4, sun: 0 },
  },
  {
    id: "s4", siteNumber: "S-004", siteName: "Highfield Tower",
    city: "Birmingham", address: "1 Temple Row", postcode: "B3 2LF",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s5", siteNumber: "S-005", siteName: "Apex House",
    city: "Birmingham", address: "67 Colmore Row", postcode: "B2 5PL",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 100,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 0, sat: 0, sun: 0 },
  },
  {
    id: "s6", siteNumber: "S-006", siteName: "The Exchange Building",
    city: "Leeds", address: "1 City Square", postcode: "LS1 4AQ",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s7", siteNumber: "S-007", siteName: "Crown Court Business Centre",
    city: "Leeds", address: "24 Park Row", postcode: "LS2 8LY",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 10, tue: 10, wed: 10, thu: 10, fri: 10, sat: 6, sun: 0 },
  },
  {
    id: "s8", siteNumber: "S-008", siteName: "Media City Gateway",
    city: "Salford", address: "3 Harbour City", postcode: "M50 2BH",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 75,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 4, sun: 0 },
  },
  {
    id: "s9", siteNumber: "S-009", siteName: "Victoria Chambers",
    city: "Leeds", address: "11 Greek Street", postcode: "LS1 5RU",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
  },
  {
    id: "s10", siteNumber: "S-010", siteName: "Digital Campus North",
    city: "Manchester", address: "21 New Wakefield Street", postcode: "M1 5NP",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 0, sun: 0 },
  },
  {
    id: "s11", siteNumber: "S-011", siteName: "The Mailbox Annex",
    city: "Birmingham", address: "Wharfside Street", postcode: "B1 1RE",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 4, sun: 4 },
  },
  {
    id: "s12", siteNumber: "S-012", siteName: "Corn Exchange House",
    city: "Leeds", address: "Call Lane", postcode: "LS1 7BR",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 6, sat: 6, sun: 0 },
  },
  {
    id: "s13", siteNumber: "S-013", siteName: "Broad Street Plaza",
    city: "Birmingham", address: "44 Broad Street", postcode: "B1 2HP",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 75,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s14", siteNumber: "S-014", siteName: "Halcyon House",
    city: "Sheffield", address: "6 Division Street", postcode: "S1 4GF",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "Midlands Area", areaManagerEmail: "james.wright@spectrumclean.co.uk",
    areaManagerName: "James Wright", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
  },
  {
    id: "s15", siteNumber: "S-015", siteName: "One Shoreham Street",
    city: "Sheffield", address: "1 Shoreham Street", postcode: "S1 4PF",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "Midlands Area", areaManagerEmail: "james.wright@spectrumclean.co.uk",
    areaManagerName: "James Wright", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s16", siteNumber: "S-016", siteName: "Lowry House",
    city: "Salford", address: "17 The Quays", postcode: "M50 3AZ",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 6, sat: 0, sun: 0 },
  },
  {
    id: "s17", siteNumber: "S-017", siteName: "Arena Quarter Tower",
    city: "Leeds", address: "8 Wade Lane", postcode: "LS2 8NJ",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 75,
    dailyBudgets: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 0, sun: 0 },
  },
  {
    id: "s18", siteNumber: "S-018", siteName: "Grand Central House",
    city: "Birmingham", address: "Grand Central Station", postcode: "B2 4BF",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 100,
    dailyBudgets: { mon: 10, tue: 10, wed: 10, thu: 10, fri: 10, sat: 5, sun: 5 },
  },
  {
    id: "s19", siteNumber: "S-019", siteName: "Cobalt Business Park",
    city: "Manchester", address: "2 Cobalt Square", postcode: "M1 2WD",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s20", siteNumber: "S-020", siteName: "The Light Building",
    city: "Leeds", address: "The Headrow", postcode: "LS1 8TL",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 4, sun: 0 },
  },
  {
    id: "s21", siteNumber: "S-021", siteName: "Pennine View Office Park",
    city: "Sheffield", address: "30 Sheaf Square", postcode: "S1 2BP",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "Midlands Area", areaManagerEmail: "james.wright@spectrumclean.co.uk",
    areaManagerName: "James Wright", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 6, sat: 0, sun: 0 },
  },
  {
    id: "s22", siteNumber: "S-022", siteName: "Victoria Square House",
    city: "Birmingham", address: "10 Victoria Square", postcode: "B1 1BD",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
  },
  {
    id: "s23", siteNumber: "S-023", siteName: "Oxford Road Medical Centre",
    city: "Manchester", address: "255 Oxford Road", postcode: "M13 9PL",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 4, sun: 4 },
  },
  {
    id: "s24", siteNumber: "S-024", siteName: "Navigation Wharf",
    city: "Leeds", address: "Bowman Lane", postcode: "LS10 1HG",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 75,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
  },
  {
    id: "s25", siteNumber: "S-025", siteName: "Cube Building",
    city: "Birmingham", address: "200 Wharfside Street", postcode: "B1 1PR",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 0, sun: 0 },
  },
]

const INITIAL_ARCHIVED: ArchivedSite[] = [
  {
    id: "arc1", siteNumber: "S-ARC-001", siteName: "Old Mill Trading Estate",
    city: "Manchester", address: "Old Mill Lane", postcode: "M4 1HN",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 6, sat: 0, sun: 0 },
    archivedDate: "15 Mar 2025",
  },
  {
    id: "arc2", siteNumber: "S-ARC-002", siteName: "Station Square House",
    city: "Birmingham", address: "15 Station Road", postcode: "B1 1RT",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
    archivedDate: "20 May 2025",
  },
  {
    id: "arc3", siteNumber: "S-ARC-003", siteName: "Cloverleaf Business Centre",
    city: "Leeds", address: "40 Cloverleaf Way", postcode: "LS11 5DZ",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 5, tue: 5, wed: 5, thu: 5, fri: 5, sat: 0, sun: 0 },
    archivedDate: "3 Jan 2025",
  },
  {
    id: "arc4", siteNumber: "S-ARC-004", siteName: "Sycamore House",
    city: "Sheffield", address: "9 Sycamore Street", postcode: "S1 5WA",
    customerCode: "SCL", customerName: "Sparkle Clean Ltd",
    area: "Midlands Area", areaManagerEmail: "james.wright@spectrumclean.co.uk",
    areaManagerName: "James Wright", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 6, sat: 0, sun: 0 },
    archivedDate: "28 Feb 2025",
  },
  {
    id: "arc5", siteNumber: "S-ARC-005", siteName: "Westgate Tower",
    city: "Manchester", address: "2 Westgate", postcode: "M3 4LX",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 75,
    dailyBudgets: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
    archivedDate: "11 Apr 2025",
  },
  {
    id: "arc6", siteNumber: "S-ARC-006", siteName: "Bridge Street Offices",
    city: "Birmingham", address: "35 Bridge Street", postcode: "B1 2JZ",
    customerCode: "PFL", customerName: "ProFacility Ltd",
    area: "South Area", areaManagerEmail: "rachel.moore@spectrumclean.co.uk",
    areaManagerName: "Rachel Moore", geofenceRadius: 50,
    dailyBudgets: { mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0 },
    archivedDate: "7 Jun 2025",
  },
  {
    id: "arc7", siteNumber: "S-ARC-007", siteName: "The Landmark",
    city: "Leeds", address: "Landmark House, King Street", postcode: "LS1 2HH",
    customerCode: "BFM", customerName: "BrightSpace FM",
    area: "North Area", areaManagerEmail: "alex.thompson@spectrumclean.co.uk",
    areaManagerName: "Alex Thompson", geofenceRadius: 50,
    dailyBudgets: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 0, sun: 0 },
    archivedDate: "1 Jul 2025",
  },
  {
    id: "arc8", siteNumber: "S-ARC-008", siteName: "Pennine House",
    city: "Sheffield", address: "123 West Street", postcode: "S1 4EQ",
    customerCode: "MTE", customerName: "Metro Estates Ltd",
    area: "Midlands Area", areaManagerEmail: "james.wright@spectrumclean.co.uk",
    areaManagerName: "James Wright", geofenceRadius: 50,
    dailyBudgets: { mon: 6, tue: 6, wed: 6, thu: 6, fri: 0, sat: 0, sun: 0 },
    archivedDate: "25 Jul 2025",
  },
]

// Active = last shift within 3 months of Aug 2025
const ACTIVE_CUTOFF = "2025-05-06"

const PAY_RATES: PayRateOverride[] = [
  { id: "pr1",  siteId: "s1", employeeId: "1",  employeeName: "James Mitchell",   taid: "TAA-0001", jobRole: "Security Officer", payRate: 12.50, lastShiftDate: "2025-08-04" },
  { id: "pr2",  siteId: "s1", employeeId: "2",  employeeName: "Sarah Okonkwo",    taid: "TAA-0002", jobRole: "Cleaner",          payRate: 11.00, lastShiftDate: "2025-08-05" },
  { id: "pr3",  siteId: "s1", employeeId: "8",  employeeName: "Priya Singh",      taid: "TAA-0008", jobRole: "Cleaner",          payRate: 11.00, lastShiftDate: "2025-08-05" },
  { id: "pr4",  siteId: "s1", employeeId: "14", employeeName: "David Walsh",      taid: "TAA-0014", jobRole: "Supervisor",       payRate: 13.50, lastShiftDate: "2025-08-02" },
  { id: "pr5",  siteId: "s1", employeeId: "19", employeeName: "Helen Carr",       taid: "TAA-0019", jobRole: "Cleaner",          payRate: 10.50, lastShiftDate: "2025-01-14" },
  { id: "pr6",  siteId: "s2", employeeId: "4",  employeeName: "Aisha Patel",      taid: "TAA-0004", jobRole: "Cleaner",          payRate: 11.00, lastShiftDate: "2025-08-05" },
  { id: "pr7",  siteId: "s2", employeeId: "13", employeeName: "Callum Robertson", taid: "TAA-0013", jobRole: "Cleaner",          payRate: 11.00, lastShiftDate: "2025-08-04" },
  { id: "pr8",  siteId: "s2", employeeId: "12", employeeName: "Fatima Ahmed",     taid: "TAA-0012", jobRole: "Supervisor",       payRate: 13.00, lastShiftDate: "2025-08-04" },
  { id: "pr9",  siteId: "s2", employeeId: "12", employeeName: "Fatima Ahmed",     taid: "TAA-0012", jobRole: "Team Leader",      payRate: 12.50, lastShiftDate: "2025-02-17" },
  { id: "pr10", siteId: "s3", employeeId: "10", employeeName: "Emma Clarke",      taid: "TAA-0010", jobRole: "Cleaner",          payRate: 13.00, lastShiftDate: "2025-08-05" },
  { id: "pr11", siteId: "s3", employeeId: "6",  employeeName: "Maria Santos",     taid: "TAA-0006", jobRole: "Cleaner",          payRate: 12.00, lastShiftDate: "2025-08-04" },
  { id: "pr12", siteId: "s4", employeeId: "12", employeeName: "Fatima Ahmed",     taid: "TAA-0012", jobRole: "Supervisor",       payRate: 12.50, lastShiftDate: "2025-08-04" },
]

// ── Role Scope ────────────────────────────────────────────────────────────────

// AM has hardcoded site IDs; HoA uses area-based filtering; SA/HO see everything.
// This ensures reactivated sites (with non-standard IDs) surface correctly.
const AM_SITE_IDS = ["s1", "s2"]
const HOA_AREA = "North Area"

function scopeSites(sites: Site[], role: string): Site[] {
  if (role === "super-admin" || role === "head-office") return sites
  if (role === "head-of-area") return sites.filter(s => s.area === HOA_AREA)
  if (role === "area-manager") return sites.filter(s => AM_SITE_IDS.includes(s.id))
  return []
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcWeekly(d: DailyBudgets): number {
  return d.mon + d.tue + d.wed + d.thu + d.fri + d.sat + d.sun
}

// ── Primitive UI ──────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
const selectCls = "h-9 w-full rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"

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

function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Modal({
  open, onClose, title, children, footer, lockClose = false, wide = false,
}: {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; footer?: React.ReactNode; lockClose?: boolean; wide?: boolean
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
      <div className={cn("relative z-10 flex w-full flex-col rounded-xl bg-background shadow-xl max-h-[90vh]", wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button type="button" onClick={onClose} className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-4" /><span className="sr-only">Close</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

function SideSheet({
  open, onClose, title, children, footer, maxWidth = "max-w-2xl",
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative z-10 flex w-full flex-col rounded-xl border border-border bg-background shadow-xl ${maxWidth}`} style={{ maxHeight: "calc(100vh - 2rem)" }}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose}
            className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" /><span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

// ── Upload Shared Components ───────────────────────────────────────────────────

function UploadArea({ onSelect }: { onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-10 text-center transition-colors border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/40"
    >
      <Upload className="mb-3 size-6 text-muted-foreground/60" />
      <p className="text-sm font-medium">Drop your Excel file here</p>
      <p className="mt-1 text-xs text-muted-foreground">or click to browse — .xlsx files only</p>
    </div>
  )
}

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">Ready to analyse</p>
      </div>
      <button type="button" onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
        <X className="size-4" />
      </button>
    </div>
  )
}

function StepSpinner({ label, processing = false }: { label: string; processing?: boolean }) {
  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-20">
        <Loader2 className="size-9 animate-spin text-primary" />
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">Please do not close this window.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 py-10">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// ── Sync Sites Dialog ─────────────────────────────────────────────────────────

type SyncStep = "upload" | "analysing" | "review" | "processing" | "done"

const SYNC_PREVIEW = {
  toCreate: [
    { siteNumber: "S-008", siteName: "The Meridian", customer: "BrightSpace FM", area: "North Area" },
    { siteNumber: "S-009", siteName: "Canal Quarter Office", customer: "Metro Estates Ltd", area: "South Area" },
  ],
  toArchive: [
    { siteNumber: "S-ARC-003", siteName: "Forum Business Park", reason: "Not present in uploaded file" },
  ],
  unchanged: 5,
  errors: [
    { row: 6, siteNumber: "S-006", field: "Customer", value: "GreenSpace Ltd", reason: "No matching Customer Code in the system" },
  ],
}

function SyncSitesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<SyncStep>("upload")
  const [fileName, setFileName] = useState("")
  const [skipError, setSkipError] = useState(false)

  useEffect(() => {
    if (open) { setStep("upload"); setFileName(""); setSkipError(false) }
  }, [open])

  function handleSelect() { setFileName("spectrum_sites_aug2025.xlsx") }
  function handleContinue() {
    setStep("analysing")
    setTimeout(() => setStep("review"), 2000)
  }
  function handleApply() {
    setStep("processing")
    setTimeout(() => setStep("done"), 2500)
  }

  const dialogTitle = {
    upload:     "Sync Sites",
    analysing:  "Sync Sites",
    review:     "Review site sync",
    processing: "Syncing sites",
    done:       "Site sync complete",
  }[step]

  const footer = step === "upload" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleContinue}
        disabled={!fileName}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Continue
      </button>
    </div>
  ) : step === "review" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => { setStep("upload"); setFileName(""); setSkipError(false) }}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Back
      </button>
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button"
        disabled={SYNC_PREVIEW.errors.length > 0 && !skipError}
        onClick={handleApply}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Apply sync
      </button>
    </div>
  ) : step === "done" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Close
      </button>
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Done
      </button>
    </div>
  ) : null

  return (
    <Modal open={open} onClose={onClose} title={dialogTitle} footer={footer}
      wide={step === "review"} lockClose={step === "processing"}>

      {/* Upload step */}
      {(step === "upload" || step === "analysing") && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file containing your full active site list. The system will reconcile it against existing records.
          </p>

          {/* Warning alert */}
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Sites missing from this file will be archived</p>
              <p className="text-sm text-destructive/80">Historical timesheet data for archived sites is preserved and remains available for payroll export.</p>
            </div>
          </div>

          {/* Reconciliation rules */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm mb-2">Reconciliation rules</p>
            <p>✓ Site in file + system → <strong>unchanged</strong></p>
            <p>✓ Site in file but not in system → <strong>created</strong></p>
            <p>✓ Site in system but not in file → <strong>archived</strong></p>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs font-medium">Download Excel template</p>
              <p className="text-xs text-muted-foreground">Required columns pre-filled</p>
            </div>
            <button type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-3 text-xs font-medium hover:bg-accent transition-colors">
              <Download className="size-3.5" />Template (.xlsx)
            </button>
          </div>

          {/* Upload area */}
          {step === "analysing" ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating file and checking references…</p>
            </div>
          ) : fileName ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">Ready to analyse</p>
              </div>
              <button type="button" onClick={() => setFileName("")}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <UploadArea onSelect={handleSelect} />
          )}
        </div>
      )}

      {/* Review step */}
      {step === "review" && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {SYNC_PREVIEW.toCreate.length + SYNC_PREVIEW.toArchive.length + SYNC_PREVIEW.unchanged + SYNC_PREVIEW.errors.length} rows in file
              </p>
            </div>
            <button type="button" onClick={() => { setStep("upload"); setFileName(""); setSkipError(false) }}
              className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline">
              Replace file
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "To create",  value: SYNC_PREVIEW.toCreate.length,  color: "text-emerald-700 dark:text-emerald-400" },
              { label: "To archive", value: SYNC_PREVIEW.toArchive.length, color: "text-foreground" },
              { label: "Unchanged",  value: SYNC_PREVIEW.unchanged,        color: "text-foreground" },
              { label: "Errors",     value: SYNC_PREVIEW.errors.length,    color: "text-destructive" },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {SYNC_PREVIEW.toCreate.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sites to create</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Area</th>
                  </tr></thead>
                  <tbody>
                    {SYNC_PREVIEW.toCreate.map(r => (
                      <tr key={r.siteNumber} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono">{r.siteNumber}</td>
                        <td className="px-4 py-3">{r.siteName}</td>
                        <td className="px-4 py-3">{r.customer}</td>
                        <td className="px-4 py-3">{r.area}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {SYNC_PREVIEW.toArchive.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sites to archive</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                  </tr></thead>
                  <tbody>
                    {SYNC_PREVIEW.toArchive.map(r => (
                      <tr key={r.siteNumber} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono">{r.siteNumber}</td>
                        <td className="px-4 py-3">{r.siteName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {SYNC_PREVIEW.errors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-destructive">Row errors</p>
              <div className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5">
                {SYNC_PREVIEW.errors.map(e => (
                  <div key={e.row} className="border-b border-destructive/20 px-4 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Row {e.row} — {e.siteNumber}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground"><strong>{e.field}:</strong> "{e.value}" — {e.reason}</p>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input type="checkbox" checked={skipError} onChange={e2 => setSkipError(e2.target.checked)} className="rounded" />
                        <span className="text-xs text-muted-foreground">Skip row</span>
                      </label>
                    </div>
                    {skipError && (
                      <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                        ⚠ Skipping this row in a full sync may affect reconciliation accuracy.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {!skipError && (
                <p className="mt-1.5 text-xs text-muted-foreground">Resolve errors or skip the row to continue.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center gap-6 px-8 py-20">
          <Loader2 className="size-9 animate-spin text-primary" />
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-medium">Applying site sync</p>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Sync complete</p>
              <p className="text-sm text-muted-foreground">
                {SYNC_PREVIEW.toCreate.length} site{SYNC_PREVIEW.toCreate.length !== 1 ? "s" : ""} created · {SYNC_PREVIEW.toArchive.length} archived · {SYNC_PREVIEW.unchanged} unchanged
                {skipError ? ` · 1 skipped` : ""}
              </p>
            </div>
          </div>
          <div className="flex divide-x divide-border rounded-lg border border-border bg-card">
            {[
              { label: "Sites created",  value: SYNC_PREVIEW.toCreate.length,  color: "text-emerald-700 dark:text-emerald-400" },
              { label: "Sites archived", value: SYNC_PREVIEW.toArchive.length, color: "text-amber-700 dark:text-amber-400" },
              { label: "Unchanged",      value: SYNC_PREVIEW.unchanged,        color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-4 py-3 text-center">
                <p className={cn("text-lg font-semibold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <InfoNote>Historical timesheet data for archived sites has been preserved.</InfoNote>
        </div>
      )}
    </Modal>
  )
}

// ── Bulk Edit Dialog ───────────────────────────────────────────────────────────

type BulkStep = "upload" | "analysing" | "review" | "processing" | "done"

const BULK_PREVIEW = {
  toUpdate: [
    { siteNumber: "S-002", siteName: "Parkside Office Complex", changes: "Daily Budget Mon–Fri: 7h → 8h" },
    { siteNumber: "S-004", siteName: "Highfield Tower", changes: "Area Manager: Rachel Moore → Alex Thompson" },
    { siteNumber: "S-006", siteName: "The Exchange Building", changes: "Customer: BrightSpace FM → Sparkle Clean Ltd" },
  ],
  errors: [
    { row: 4, siteNumber: "S-099", reason: "Site Number not found in active sites" },
  ],
}

function BulkEditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<BulkStep>("upload")
  const [fileName, setFileName] = useState("")

  useEffect(() => {
    if (open) { setStep("upload"); setFileName("") }
  }, [open])

  function handleSelect() { setFileName("site_bulk_update.xlsx") }
  function handleContinue() { setStep("analysing"); setTimeout(() => setStep("review"), 2000) }
  function handleApply() { setStep("processing"); setTimeout(() => setStep("done"), 2500) }

  const dialogTitle = {
    upload:     "Bulk Edit Sites",
    analysing:  "Bulk Edit Sites",
    review:     "Review bulk edits",
    processing: "Applying updates",
    done:       "Bulk update complete",
  }[step]

  const footer = step === "upload" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleContinue}
        disabled={!fileName}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Continue
      </button>
    </div>
  ) : step === "review" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => { setStep("upload"); setFileName("") }}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Back
      </button>
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleApply}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Apply updates
      </button>
    </div>
  ) : step === "done" ? (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Close
      </button>
      <button type="button" onClick={onClose}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Done
      </button>
    </div>
  ) : null

  return (
    <Modal open={open} onClose={onClose} title={dialogTitle} footer={footer}
      wide={step === "review"} lockClose={step === "processing"}>

      {/* Upload step */}
      {(step === "upload" || step === "analysing") && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file to update attributes of existing active sites in bulk. Only columns included in the file are updated — omitted columns remain unchanged.
          </p>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>This operation updates existing active sites only. It does not create or archive sites. Site Number is required to match records.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs font-medium">Download Excel template</p>
              <p className="text-xs text-muted-foreground">Required columns pre-filled</p>
            </div>
            <button type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-3 text-xs font-medium hover:bg-accent transition-colors">
              <Download className="size-3.5" />Template (.xlsx)
            </button>
          </div>
          {step === "analysing" ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating file and matching site records…</p>
            </div>
          ) : fileName ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">Ready to analyse</p>
              </div>
              <button type="button" onClick={() => setFileName("")}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <UploadArea onSelect={handleSelect} />
          )}
        </div>
      )}

      {/* Review step */}
      {step === "review" && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {BULK_PREVIEW.toUpdate.length + BULK_PREVIEW.errors.length} rows in file
              </p>
            </div>
            <button type="button" onClick={() => { setStep("upload"); setFileName("") }}
              className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline">
              Replace file
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "To update",       value: BULK_PREVIEW.toUpdate.length, color: "text-primary" },
              { label: "Skipped / errors", value: BULK_PREVIEW.errors.length,  color: "text-destructive" },
              { label: "No change",       value: 0,                            color: "text-foreground" },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sites to update</p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Changes</th>
                </tr></thead>
                <tbody>
                  {BULK_PREVIEW.toUpdate.map(r => (
                    <tr key={r.siteNumber} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono">{r.siteNumber}</td>
                      <td className="px-4 py-3">{r.siteName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.changes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {BULK_PREVIEW.errors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-destructive">Skipped rows</p>
              <div className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5">
                {BULK_PREVIEW.errors.map(e => (
                  <div key={e.row} className="border-b border-destructive/20 px-4 py-3 last:border-0">
                    <p className="text-xs font-medium">Row {e.row} — {e.siteNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.reason}</p>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Invalid rows are skipped. Only matched sites will be updated.</p>
            </div>
          )}
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center gap-6 px-8 py-20">
          <Loader2 className="size-9 animate-spin text-primary" />
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-medium">Applying bulk site updates</p>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Bulk update complete</p>
              <p className="text-sm text-muted-foreground">
                {BULK_PREVIEW.toUpdate.length} site{BULK_PREVIEW.toUpdate.length !== 1 ? "s" : ""} updated · {BULK_PREVIEW.errors.length} row{BULK_PREVIEW.errors.length !== 1 ? "s" : ""} skipped
              </p>
            </div>
          </div>
          <div className="flex divide-x divide-border rounded-lg border border-border bg-card">
            {[
              { label: "Sites updated", value: BULK_PREVIEW.toUpdate.length, color: "text-primary" },
              { label: "Rows skipped",  value: BULK_PREVIEW.errors.length,   color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-4 py-3 text-center">
                <p className={cn("text-lg font-semibold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Edit Site Sheet (Super Admin / Head Office) ────────────────────────────────

function EditSiteSheet({
  open, onClose, site, onSave,
}: {
  open: boolean; onClose: () => void; site: Site
  onSave: (updates: Partial<Site>) => void
}) {
  const [form, setForm] = useState({ ...site })
  const [postcodeChanged, setPostcodeChanged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) { setForm({ ...site }); setPostcodeChanged(false); setSubmitting(false); setSuccess(false); setErrors({}) }
  }, [open, site.id])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n })
    if (key === "postcode" && value !== site.postcode) setPostcodeChanged(true)
    if (key === "postcode" && value === site.postcode) setPostcodeChanged(false)
  }

  function setBudget(key: keyof DailyBudgets, val: string) {
    const n = Math.max(0, parseFloat(val) || 0)
    setForm(f => ({ ...f, dailyBudgets: { ...f.dailyBudgets, [key]: n } }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.siteName.trim()) e.siteName = "Required"
    if (!form.city.trim()) e.city = "Required"
    if (!form.address.trim()) e.address = "Required"
    if (!form.postcode.trim()) e.postcode = "Required"
    if (!form.customerCode) e.customerCode = "Required"
    if (!form.area) e.area = "Required"
    if (!form.areaManagerEmail) e.areaManagerEmail = "Required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    setTimeout(() => {
      const selectedCustomer = CUSTOMERS.find(c => c.code === form.customerCode)
      const selectedManager = AREA_MANAGERS_REF.find(m => m.email === form.areaManagerEmail)
      onSave({
        ...form,
        customerName: selectedCustomer?.name ?? form.customerName,
        areaManagerName: selectedManager?.name ?? form.areaManagerName,
      })
      setSubmitting(false)
      setSuccess(true)
    }, 1200)
  }

  if (success) {
    return (
      <SideSheet open={open} onClose={onClose} title="Edit Site" maxWidth="max-w-2xl">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold">Changes saved</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {postcodeChanged && "Geofencing coordinates will be refreshed for the updated postcode."}
            </p>
          </div>
          <button onClick={onClose} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Done</button>
        </div>
      </SideSheet>
    )
  }

  const inputError = (key: string) => errors[key]
    ? "border-destructive focus:ring-destructive"
    : ""

  return (
    <SideSheet open={open} onClose={onClose} title={`Edit — ${site.siteNumber}`} maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        {/* Site identity (read-only) */}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Site Number</p>
          <p className="mt-0.5 font-mono text-sm font-medium">{site.siteNumber}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Unique identifier — not editable</p>
        </div>

        {/* Site Information */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Site Information</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Site Name *</label>
              <input className={`${inputCls} ${inputError("siteName")}`} value={form.siteName} onChange={e => set("siteName", e.target.value)} />
              {errors.siteName && <p className="mt-1 text-xs text-destructive">{errors.siteName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City *</label>
              <input className={`${inputCls} ${inputError("city")}`} value={form.city} onChange={e => set("city", e.target.value)} />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Address *</label>
              <input className={`${inputCls} ${inputError("address")}`} value={form.address} onChange={e => set("address", e.target.value)} />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Postcode *</label>
              <input className={`${inputCls} ${inputError("postcode")}`} value={form.postcode} onChange={e => set("postcode", e.target.value)} />
              {errors.postcode && <p className="mt-1 text-xs text-destructive">{errors.postcode}</p>}
            </div>
          </div>
          {postcodeChanged && <InfoNote>Changing postcode will refresh geofencing coordinates when saved.</InfoNote>}
        </div>

        {/* Organisation */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organisation</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Customer *</label>
              <div className="relative">
                <select className={`${selectCls} w-full`} value={form.customerCode} onChange={e => set("customerCode", e.target.value)}>
                  <option value="">Select customer…</option>
                  {CUSTOMERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
              </div>
              {errors.customerCode && <p className="mt-1 text-xs text-destructive">{errors.customerCode}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Area *</label>
              <div className="relative">
                <select className={`${selectCls} w-full`} value={form.area} onChange={e => set("area", e.target.value)}>
                  <option value="">Select area…</option>
                  {AREAS_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
              </div>
              {errors.area && <p className="mt-1 text-xs text-destructive">{errors.area}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Area Manager *</label>
              <div className="relative">
                <select className={`${selectCls} w-full`} value={form.areaManagerEmail} onChange={e => set("areaManagerEmail", e.target.value)}>
                  <option value="">Select area manager…</option>
                  {AREA_MANAGERS_REF.map(m => <option key={m.email} value={m.email}>{m.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
              </div>
              {errors.areaManagerEmail && <p className="mt-1 text-xs text-destructive">{errors.areaManagerEmail}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Geofence Radius (m)</label>
              <input
                type="number"
                min={0}
                step={1}
                className={inputCls}
                value={form.geofenceRadius}
                onChange={e => set("geofenceRadius", Math.max(0, parseInt(e.target.value) || 0))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Defaults to 50 m.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Area Manager reassignment takes effect immediately.</p>
        </div>

        {/* Daily Hour Budgets */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Hour Budgets</p>
          <InfoNote>Changes take effect from the next calendar day and do not apply retroactively.</InfoNote>
          <div className="overflow-hidden rounded-lg border border-border">
            {DAYS.map((d, i) => (
              <div key={d.key} className={`flex items-center gap-3 px-4 py-2.5 ${i < DAYS.length - 1 ? "border-b border-border" : ""}`}>
                <span className="w-24 text-sm text-foreground">{d.long}</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-20 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.dailyBudgets[d.key]}
                  onChange={e => setBudget(d.key, e.target.value)}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Weekly total: <strong>{calcWeekly(form.dailyBudgets)}h</strong></p>
        </div>
      </div>
    </SideSheet>
  )
}

// ── Edit Budget Sheet (Head of Area / Area Manager) ───────────────────────────

function EditBudgetSheet({
  open, onClose, site, onSave,
}: {
  open: boolean; onClose: () => void; site: Site
  onSave: (budgets: DailyBudgets) => void
}) {
  const [budgets, setBudgets] = useState<DailyBudgets>({ ...site.dailyBudgets })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) { setBudgets({ ...site.dailyBudgets }); setSubmitting(false); setSuccess(false) }
  }, [open, site.id])

  function setBudget(key: keyof DailyBudgets, val: string) {
    const n = Math.max(0, parseFloat(val) || 0)
    setBudgets(b => ({ ...b, [key]: n }))
  }

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => { onSave(budgets); setSubmitting(false); setSuccess(true) }, 1000)
  }

  if (success) {
    return (
      <SideSheet open={open} onClose={onClose} title="Edit Daily Budgets" maxWidth="max-w-lg">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold">Daily budgets updated</p>
            <p className="mt-1 text-sm text-muted-foreground">Changes take effect from tomorrow.</p>
          </div>
          <button onClick={onClose} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Done</button>
        </div>
      </SideSheet>
    )
  }

  return (
    <SideSheet open={open} onClose={onClose} title={`Edit Daily Budgets — ${site.siteNumber}`} maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-sm font-medium">{site.siteName}</p>
          <p className="text-xs text-muted-foreground">{site.siteNumber} · {site.city}</p>
        </div>
        <InfoNote>Changes take effect from the next calendar day and do not apply retroactively.</InfoNote>
        <div className="overflow-hidden rounded-lg border border-border">
          {DAYS.map((d, i) => (
            <div key={d.key} className={`flex items-center gap-3 px-4 py-2.5 ${i < DAYS.length - 1 ? "border-b border-border" : ""}`}>
              <span className="w-24 text-sm text-foreground">{d.long}</span>
              <input
                type="number" min={0} step={0.5}
                className="w-20 rounded-md border border-input bg-muted/50 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={budgets[d.key]}
                onChange={e => setBudget(d.key, e.target.value)}
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Weekly total: <strong>{calcWeekly(budgets)}h</strong></p>
      </div>
    </SideSheet>
  )
}

// ── Reactivate Dialog ─────────────────────────────────────────────────────────

function ReactivateDialog({
  open, onClose, site, onConfirm,
}: {
  open: boolean; onClose: () => void; site: ArchivedSite | null
  onConfirm: () => void
}) {
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm")

  useEffect(() => { if (open) setStep("confirm") }, [open])

  function handleConfirm() {
    setStep("processing")
    setTimeout(() => { onConfirm(); setStep("success") }, 1200)
  }

  if (!site) return null

  return (
    <Modal open={open} onClose={step === "processing" ? () => {} : onClose} title="Reactivate Site" lockClose={step === "processing"}>
      {step === "confirm" && (
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-muted-foreground">
            Reactivating <strong>{site.siteName}</strong> ({site.siteNumber}) will restore it to the Active Sites list.
            Employees will be able to clock in there immediately.
          </p>
          <InfoNote>Historical timesheet data recorded at this site is already preserved and will remain accessible.</InfoNote>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={onClose} className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">Cancel</button>
            <button onClick={handleConfirm} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Reactivate site
            </button>
          </div>
        </div>
      )}
      {step === "processing" && <StepSpinner label="Reactivating site…" />}
      {step === "success" && (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold">Site reactivated</p>
            <p className="mt-1 text-sm text-muted-foreground">{site.siteName} is now active. Employees may clock in immediately.</p>
          </div>
          <button onClick={onClose} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Done</button>
        </div>
      )}
    </Modal>
  )
}

// ── Pay Rate Overrides Section ────────────────────────────────────────────────

function PayRateOverridesSection({ siteId }: { siteId: string }) {
  const [showAll, setShowAll] = useState(false)
  const allRates = PAY_RATES.filter(r => r.siteId === siteId)
  const activeRates = allRates.filter(r => r.lastShiftDate >= ACTIVE_CUTOFF)
  const displayed = showAll ? allRates : activeRates

  return (
    <SectionCard title="Pay Rate Overrides">
      {displayed.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No pay rate overrides for this site.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {displayed.map(r => {
            const isActive = r.lastShiftDate >= ACTIVE_CUTOFF
            return (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <a
                    href={`/employees/${r.employeeId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {r.employeeName}
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                  </a>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{r.taid}</span>
                    <span aria-hidden>·</span>
                    <span>{r.jobRole}</span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  £{r.payRate.toFixed(2)}
                </span>
                <EmployeeStatusBadge status={isActive ? "active" : "archived"} />
              </div>
            )
          })}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {showAll
            ? `${allRates.length} override${allRates.length !== 1 ? "s" : ""} (including inactive)`
            : `${activeRates.length} active override${activeRates.length !== 1 ? "s" : ""}`}
        </p>
        {allRates.length > activeRates.length && (
          <button onClick={() => setShowAll(s => !s)} className="text-xs text-primary hover:underline">
            {showAll ? "Show active only" : `Show all (${allRates.length - activeRates.length} inactive)`}
          </button>
        )}
      </div>
      <div className="px-5 pb-4">
        <InfoNote>
          Active = employee recorded hours at this site within the last 3 months.
          Pay rate overrides are managed from the Employee Profile. Editing from Site Details is pending confirmation.
        </InfoNote>
      </div>
    </SectionCard>
  )
}

// ── Site Details ──────────────────────────────────────────────────────────────

function SiteDetails({
  site, onBack, onEdit, onEditBudget, role,
}: {
  site: Site
  onBack: () => void
  onEdit: () => void
  onEditBudget: () => void
  role: string
}) {
  const canFullEdit = role === "super-admin" || role === "head-office"
  const canEditBudget = role === "head-of-area" || role === "area-manager"
  const showAreaManager = role !== "area-manager"
  const weekly = calcWeekly(site.dailyBudgets)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{site.siteName}</h1>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400">
              {site.siteNumber}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canFullEdit && (
            <button onClick={onEdit} className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Pencil className="size-4" />
              Edit site
            </button>
          )}
          {canEditBudget && (
            <button onClick={onEditBudget} className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Pencil className="size-4" />
              Edit daily budgets
            </button>
          )}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Site Information */}
        <SectionCard title="Site Information">
          <div className="divide-y divide-border">
            <Field label="Site name">{site.siteName}</Field>
            <Field label="City">{site.city}</Field>
            <Field label="Address">{site.address}</Field>
            <Field label="Postcode">{site.postcode}</Field>
          </div>
        </SectionCard>

        {/* Organisation */}
        <SectionCard title="Organisation">
          <div className="divide-y divide-border">
            <Field label="Customer">{site.customerName}</Field>
            <Field label="Area">{site.area}</Field>
            {showAreaManager && <Field label="Area Manager">{site.areaManagerName}</Field>}
          </div>
        </SectionCard>

        {/* Time & Location */}
        <SectionCard title="Time and location rules">
          <div className="divide-y divide-border">
            <Field label="Geofence radius">
              {site.geofenceRadius} m{site.geofenceRadius === 50 && <span className="ml-1.5 text-xs text-muted-foreground">(default)</span>}
            </Field>
            {DAYS.map(d => (
              <Field key={d.key} label={d.long}>{site.dailyBudgets[d.key]}h</Field>
            ))}
            <div className="flex items-center gap-4 bg-muted/30 px-5 py-3.5">
              <span className="w-40 shrink-0 text-sm font-medium">Weekly total</span>
              <span className="text-sm font-semibold tabular-nums">{weekly}h</span>
            </div>
          </div>
        </SectionCard>

        {/* Pay Rate Overrides */}
        <PayRateOverridesSection siteId={site.id} />
      </div>
    </div>
  )
}

// ── Archived Site Details ─────────────────────────────────────────────────────

function ArchivedSiteDetails({
  site, onBack, onReactivate,
}: {
  site: ArchivedSite; onBack: () => void; onReactivate: () => void
}) {
  const weekly = calcWeekly(site.dailyBudgets)
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-muted/50 transition-colors hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{site.siteName}</h1>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400">
              {site.siteNumber}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Archive className="size-3" />
              Archived
            </span>
          </div>
        </div>
        <button onClick={onReactivate} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <RotateCcw className="size-4" />
          Reactivate site
        </button>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Site Information">
          <div className="divide-y divide-border">
            <Field label="Site name">{site.siteName}</Field>
            <Field label="City">{site.city}</Field>
            <Field label="Address">{site.address}</Field>
            <Field label="Postcode">{site.postcode}</Field>
          </div>
        </SectionCard>

        <SectionCard title="Organisation">
          <div className="divide-y divide-border">
            <Field label="Customer">{site.customerName}</Field>
            <Field label="Area">{site.area}</Field>
            <Field label="Area Manager">{site.areaManagerName}</Field>
          </div>
        </SectionCard>

        <SectionCard title="Time and location rules">
          <div className="divide-y divide-border">
            <Field label="Geofence radius">{site.geofenceRadius} m</Field>
            <Field label="Daily budgets"><span className="text-xs text-muted-foreground">at time of archiving</span></Field>
            {DAYS.map(d => (
              <Field key={d.key} label={d.long}>{site.dailyBudgets[d.key]}h</Field>
            ))}
            <div className="flex items-center gap-4 bg-muted/30 px-5 py-3.5">
              <span className="w-40 shrink-0 text-sm font-medium">Weekly total</span>
              <span className="text-sm font-semibold tabular-nums">{weekly}h</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ── Pagination helper ─────────────────────────────────────────────────────────

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current === 1) return [1, 2, 3]
  if (current === total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

// ── Sites List ────────────────────────────────────────────────────────────────

function SitesList({
  sites, role, onSelectSite,
}: {
  sites: Site[]
  role: string
  onSelectSite: (siteId: string) => void
}) {
  const [search, setSearch] = useState("")
  const [areaFilter, setAreaFilter] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [amFilter, setAmFilter] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const showAM = role !== "area-manager"

  useEffect(() => {
    setSearch(""); setAreaFilter(""); setCustomerFilter(""); setAmFilter(""); setPage(1)
  }, [role])

  const availableAreas = [...new Set(sites.map(s => s.area))].sort()
  const availableCustomers = [...new Set(sites.map(s => s.customerCode))].map(code => CUSTOMERS.find(c => c.code === code)!).filter(Boolean)
  const availableAMs = [...new Set(sites.map(s => s.areaManagerEmail))].map(email => AREA_MANAGERS_REF.find(m => m.email === email)!).filter(Boolean)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sites.filter(s => {
      if (q && !s.siteName.toLowerCase().includes(q) && !s.siteNumber.toLowerCase().includes(q)) return false
      if (areaFilter && s.area !== areaFilter) return false
      if (customerFilter && s.customerCode !== customerFilter) return false
      if (amFilter && s.areaManagerEmail !== amFilter) return false
      return true
    })
  }, [sites, search, areaFilter, customerFilter, amFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pageSites = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const pageWindow = getPageWindow(safePage, totalPages)

  const clearFilters = () => { setSearch(""); setAreaFilter(""); setCustomerFilter(""); setAmFilter(""); setPage(1) }
  const hasFilters = !!(search || areaFilter || customerFilter || amFilter)

  const areaOptions = availableAreas.map(area => ({ value: area, label: area }))
  const customerOptions = availableCustomers.map(c => ({ value: c.code, label: c.name }))
  const amOptions = availableAMs.map(m => ({ value: m.email, label: m.name }))

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by site name or number…"
            className="flex-1 bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1) }} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterDropdown label="Area" options={areaOptions} value={areaFilter} onChange={v => { setAreaFilter(v); setPage(1) }} />
        <FilterDropdown label="Customer" options={customerOptions} value={customerFilter} onChange={v => { setCustomerFilter(v); setPage(1) }} />
        {showAM && <FilterDropdown label="Area Manager" options={amOptions} value={amFilter} onChange={v => { setAmFilter(v); setPage(1) }} />}

        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {pageSites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="size-8 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">No sites found</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {hasFilters ? "Try adjusting your search or filters." : "No sites are currently in scope."}
              </p>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[20%]" />
              {showAM ? <col className="w-[17%]" /> : <col className="w-[36%]" />}
              {showAM && <col className="w-[19%]" />}
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area</th>
                {showAM && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area Manager</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Weekly budget</th>
              </tr>
            </thead>
            <tbody>
              {pageSites.map(site => (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{site.siteName}</p>
                      <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{site.siteNumber}</span>
                    </div>
                  </td>
                  <td className="truncate px-4 py-3.5 text-muted-foreground">{site.customerName}</td>
                  <td className="truncate px-4 py-3.5 text-muted-foreground">{site.area}</td>
                  {showAM && <td className="truncate px-4 py-3.5 text-muted-foreground">{site.areaManagerName}</td>}
                  <td className="px-4 py-3.5 tabular-nums font-medium">{calcWeekly(site.dailyBudgets)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 border-t border-border px-4 py-3">
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
            </div>
            <div className="flex-1" />
            <div className="flex shrink-0 items-center gap-3">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}
                  aria-label="First page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsLeft className="size-3.5" />
                </button>
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  aria-label="Previous page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-3.5" />
                </button>
                {pageWindow.map(n => (
                  <button key={n} type="button" onClick={() => setPage(n)}
                    aria-label={`Page ${n}`}
                    aria-current={n === safePage ? "page" : undefined}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                      n === safePage
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                    )}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="size-3.5" />
                </button>
                <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                  aria-label="Last page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Archived Sites List ───────────────────────────────────────────────────────

function ArchivedSitesList({
  sites, onSelectSite,
}: {
  sites: ArchivedSite[]
  onSelectSite: (siteId: string) => void
}) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return sites
    return sites.filter(s => s.siteName.toLowerCase().includes(q) || s.siteNumber.toLowerCase().includes(q))
  }, [sites, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedArchived = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const pageWindow = getPageWindow(safePage, totalPages)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by site name or number…"
          className="flex-1 bg-transparent placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Archive className="size-8 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">{search ? "No archived sites match your search" : "No archived sites"}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{search ? "Try a different search term." : "Archived sites will appear here."}</p>
            </div>
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[23%]" />
              <col className="w-[17%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Area Manager</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Weekly budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Archived</th>
              </tr>
            </thead>
            <tbody>
              {pagedArchived.map(site => (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{site.siteName}</p>
                      <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{site.siteNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 truncate text-muted-foreground">{site.customerName}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{site.area}</td>
                  <td className="px-4 py-3.5 truncate text-muted-foreground">{site.areaManagerName}</td>
                  <td className="px-4 py-3.5 tabular-nums font-medium">{calcWeekly(site.dailyBudgets)}h</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{site.archivedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 border-t border-border px-4 py-3">
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
            </div>
            <div className="flex-1" />
            <div className="flex shrink-0 items-center gap-3">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}
                  aria-label="First page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsLeft className="size-3.5" />
                </button>
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  aria-label="Previous page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-3.5" />
                </button>
                {pageWindow.map(n => (
                  <button key={n} type="button" onClick={() => setPage(n)}
                    aria-label={`Page ${n}`}
                    aria-current={n === safePage ? "page" : undefined}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                      n === safePage
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                    )}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="size-3.5" />
                </button>
                <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                  aria-label="Last page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sites Page ────────────────────────────────────────────────────────────────

export default function SitesPage() {
  const { role } = useRole()
  const { setExtra } = useBreadcrumbExtra()

  const [view, setView] = useState<View>({ name: "list" })
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES)
  const [archivedSites, setArchivedSites] = useState<ArchivedSite[]>(INITIAL_ARCHIVED)

  // Dialogs
  const [syncOpen, setSyncOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editSiteOpen, setEditSiteOpen] = useState(false)
  const [editBudgetOpen, setEditBudgetOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [reactivateSite, setReactivateSite] = useState<ArchivedSite | null>(null)

  const canFullAccess = role === "super-admin" || role === "head-office"
  const canSeeArchived = role === "super-admin" || role === "head-office"

  // Scope-limit visible sites by role
  const scopedSites = useMemo(() => scopeSites(sites, role), [sites, role])

  // Update app-header breadcrumb when entering/leaving a detail view
  useEffect(() => {
    if (view.name === "detail") {
      const site = scopedSites.find(s => s.id === (view as { name: "detail"; siteId: string }).siteId)
      setExtra(site?.siteName ?? null)
    } else if (view.name === "archived-detail") {
      const site = archivedSites.find(s => s.id === (view as { name: "archived-detail"; siteId: string }).siteId)
      setExtra(site?.siteName ?? null)
    } else {
      setExtra(null)
    }
    return () => setExtra(null)
  }, [view, scopedSites, archivedSites, setExtra])

  // Reset view when role loses access to current view
  useEffect(() => {
    if (view.name === "archived" && !canSeeArchived) { setView({ name: "list" }); return }
    if (view.name === "archived-detail" && !canSeeArchived) { setView({ name: "list" }); return }
    if (view.name === "detail") {
      const siteId = (view as { name: "detail"; siteId: string }).siteId
      if (!scopedSites.find(s => s.id === siteId)) setView({ name: "list" })
    }
  }, [role])

  // Open a specific site detail when navigating from another page (e.g. Area Details)
  useEffect(() => {
    if (typeof window === "undefined") return
    const sid = sessionStorage.getItem("sc:openSiteId")
    if (!sid) return
    sessionStorage.removeItem("sc:openSiteId")
    setView({ name: "detail", siteId: sid })
  }, [])

  const currentSite = useMemo(() => {
    if (view.name === "detail") return scopedSites.find(s => s.id === view.siteId) ?? null
    return null
  }, [view, scopedSites])

  const currentArchivedSite = useMemo(() => {
    if (view.name === "archived-detail") return archivedSites.find(s => s.id === view.siteId) ?? null
    return null
  }, [view, archivedSites])

  function handleSaveSite(updates: Partial<Site>) {
    if (!currentSite) return
    setSites(prev => prev.map(s => s.id === currentSite.id ? { ...s, ...updates } : s))
    setEditSiteOpen(false)
  }

  function handleSaveBudget(budgets: DailyBudgets) {
    if (!currentSite) return
    setSites(prev => prev.map(s => s.id === currentSite.id ? { ...s, dailyBudgets: budgets } : s))
    setEditBudgetOpen(false)
  }

  function handleReactivate() {
    if (!reactivateSite) return
    setSites(prev => {
      const base = archivedSites.find(a => a.id === reactivateSite.id)!
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { archivedDate, ...siteData } = base
      return [...prev, siteData]
    })
    setArchivedSites(prev => prev.filter(a => a.id !== reactivateSite.id))
    setReactivateOpen(false)
    setView({ name: "list" })
  }

  // Page header actions
  const pageActions = canFullAccess ? (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setBulkOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Upload className="size-4" />
        Bulk Edit
      </button>
      <button
        onClick={() => setSyncOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        Sync Sites
      </button>
    </div>
  ) : null

  // View‑tab switcher (Active / Archived)
  const viewSwitcher = canSeeArchived ? (
    <div className="flex w-fit rounded-lg border border-border bg-muted/30 p-0.5">
      {(["list", "archived"] as const).map(v => (
        <button
          key={v}
          onClick={() => setView({ name: v } as View)}
          className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${view.name === v || (v === "list" && view.name === "detail") || (v === "archived" && view.name === "archived-detail") ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {v === "list" ? "Active Sites" : (
            <>
              <Archive className="size-3.5" />
              Archived Sites
            </>
          )}
        </button>
      ))}
    </div>
  ) : null

  const isDetailView = view.name === "detail" || view.name === "archived-detail"

  return (
    <>
      {isDetailView ? (
        <div className="flex flex-col gap-6">
          {view.name === "detail" && currentSite && (
            <SiteDetails
              site={currentSite}
              role={role}
              onBack={() => setView({ name: "list" })}
              onEdit={() => setEditSiteOpen(true)}
              onEditBudget={() => setEditBudgetOpen(true)}
            />
          )}
          {view.name === "archived-detail" && currentArchivedSite && (
            <ArchivedSiteDetails
              site={currentArchivedSite}
              onBack={() => setView({ name: "archived" })}
              onReactivate={() => {
                setReactivateSite(currentArchivedSite)
                setReactivateOpen(true)
              }}
            />
          )}
        </div>
      ) : (
        <PageShell
          title="Sites"
          description="Manage sites, daily hour budgets, and area assignments."
          action={pageActions}
        >
          {viewSwitcher}
          {view.name === "list" && (
            <SitesList
              sites={scopedSites}
              role={role}
              onSelectSite={id => setView({ name: "detail", siteId: id })}
            />
          )}
          {view.name === "archived" && (
            <ArchivedSitesList
              sites={archivedSites}
              onSelectSite={id => setView({ name: "archived-detail", siteId: id })}
            />
          )}
        </PageShell>
      )}

      <SyncSitesDialog open={syncOpen} onClose={() => setSyncOpen(false)} />
      <BulkEditDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />

      {currentSite && (
        <>
          <EditSiteSheet
            open={editSiteOpen}
            onClose={() => setEditSiteOpen(false)}
            site={currentSite}
            onSave={handleSaveSite}
          />
          <EditBudgetSheet
            open={editBudgetOpen}
            onClose={() => setEditBudgetOpen(false)}
            site={currentSite}
            onSave={handleSaveBudget}
          />
        </>
      )}

      <ReactivateDialog
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        site={reactivateSite}
        onConfirm={handleReactivate}
      />
    </>
  )
}
