"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Clock,
  Download,
  EllipsisVertical,
  FileSpreadsheet,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { PageShell } from "@/components/page-shell"
import { MultiFilterDropdown } from "@/components/filter-dropdown"
import { AlertBox } from "@/components/modal-alert"
import { Badge } from "@/components/ui/badge"

// ─── Types ──────────────────────────────────────────────────────────────────────

type ViewMode  = "by-site" | "by-employee"
type ExportStep = "form" | "processing" | "success" | "no-data"

type Entry = {
  id: string
  date: string
  dateLabel: string
  month: string
  employeeId: string
  employeeName: string
  taid: string
  siteId: string
  siteCode: string
  siteName: string
  siteArchived: boolean
  area: string
  shiftJobRole: string
  defaultJobRole: string
  clockIn: string
  clockOut: string
  totalHours: number
  payRate: number
  isAdjusted: boolean
  isAutoClockOut: boolean
  originalClockIn?: string
  originalClockOut?: string
}

// ─── Mock data ───────────────────────────────────────────────────────────────────

const RAW_ENTRIES: Entry[] = [
  // Aug 2025 — 001 Citygate House (North)
  { id:"t1",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"1",  employeeName:"James Mitchell",   taid:"TAA-0001", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t2",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"1",  employeeName:"James Mitchell",   taid:"TAA-0001", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t3",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"2",  employeeName:"Sarah Okonkwo",    taid:"TAA-0002", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"15:30", totalHours:8.5, payRate:11.00, isAdjusted:true,  isAutoClockOut:false, originalClockIn:"07:00", originalClockOut:"15:00" },
  { id:"t4",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"2",  employeeName:"Sarah Okonkwo",    taid:"TAA-0002", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"23:59", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:true  },
  { id:"t5",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"8",  employeeName:"Priya Singh",      taid:"TAA-0008", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t6",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"8",  employeeName:"Priya Singh",      taid:"TAA-0008", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"23:59", totalHours:8,   payRate:11.00, isAdjusted:true,  isAutoClockOut:true,  originalClockIn:"08:00", originalClockOut:"16:30" },
  // Aug 2025 — 002 Parkside Office (North)
  { id:"t7",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"4",  employeeName:"Aisha Patel",      taid:"TAA-0004", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"17:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t8",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"4",  employeeName:"Aisha Patel",      taid:"TAA-0004", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"17:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t9",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"13", employeeName:"Callum Robertson", taid:"TAA-0013", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t10", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"13", employeeName:"Callum Robertson", taid:"TAA-0013", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 003 Riverside Plaza (North)
  { id:"t11", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"10", employeeName:"Emma Clarke",      taid:"TAA-0010", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",   siteArchived:false, area:"North", shiftJobRole:"Window Cleaner", defaultJobRole:"Window Cleaner", clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:13.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t12", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"10", employeeName:"Emma Clarke",      taid:"TAA-0010", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",   siteArchived:false, area:"North", shiftJobRole:"Window Cleaner", defaultJobRole:"Window Cleaner", clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:13.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t13", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"6",  employeeName:"Maria Santos",     taid:"TAA-0006", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",   siteArchived:false, area:"North", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t14", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"6",  employeeName:"Maria Santos",     taid:"TAA-0006", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",   siteArchived:false, area:"North", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 004 Highfield Tower (South)
  { id:"t15", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"12", employeeName:"Fatima Ahmed",     taid:"TAA-0012", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",   siteArchived:false, area:"South", shiftJobRole:"Supervisor",     defaultJobRole:"Team Leader",    clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t16", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"12", employeeName:"Fatima Ahmed",     taid:"TAA-0012", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",   siteArchived:false, area:"South", shiftJobRole:"Supervisor",     defaultJobRole:"Team Leader",    clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 005 Apex House (Archived, South)
  { id:"t17", date:"2025-08-01", dateLabel:"Fri 1 Aug",  month:"2025-08", employeeId:"1",  employeeName:"James Mitchell",   taid:"TAA-0001", siteId:"s5",  siteCode:"005", siteName:"Apex House",        siteArchived:true,  area:"South", shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 006 Central Court (South)
  { id:"t20", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"3",  employeeName:"Daniel Osei",      taid:"TAA-0003", siteId:"s6",  siteCode:"006", siteName:"Central Court",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"06:00", clockOut:"14:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t21", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"3",  employeeName:"Daniel Osei",      taid:"TAA-0003", siteId:"s6",  siteCode:"006", siteName:"Central Court",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"06:00", clockOut:"14:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t22", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"5",  employeeName:"Ryan O'Brien",     taid:"TAA-0005", siteId:"s6",  siteCode:"006", siteName:"Central Court",     siteArchived:false, area:"South", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"06:00", clockOut:"14:00", totalHours:8,   payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t23", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"5",  employeeName:"Ryan O'Brien",     taid:"TAA-0005", siteId:"s6",  siteCode:"006", siteName:"Central Court",     siteArchived:false, area:"South", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"06:00", clockOut:"14:30", totalHours:8.5, payRate:12.00, isAdjusted:true,  isAutoClockOut:false, originalClockIn:"06:00", originalClockOut:"14:00" },
  // Aug 2025 — 007 Bridge Street Hub (South)
  { id:"t24", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"7",  employeeName:"Yusuf Idris",      taid:"TAA-0007", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub", siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t25", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"7",  employeeName:"Yusuf Idris",      taid:"TAA-0007", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub", siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t26", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"9",  employeeName:"Grace Okafor",     taid:"TAA-0009", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub", siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"17:00", totalHours:9,   payRate:11.00, isAdjusted:true,  isAutoClockOut:false, originalClockIn:"08:00", originalClockOut:"16:00" },
  { id:"t27", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"9",  employeeName:"Grace Okafor",     taid:"TAA-0009", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub", siteArchived:false, area:"South", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"08:00", clockOut:"16:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 008 Millbank Tower (East)
  { id:"t28", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"11", employeeName:"Hassan Malik",     taid:"TAA-0011", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",    siteArchived:false, area:"East",  shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t29", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"11", employeeName:"Hassan Malik",     taid:"TAA-0011", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",    siteArchived:false, area:"East",  shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t30", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"14", employeeName:"Clare Whitfield",  taid:"TAA-0014", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",    siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"23:59", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:true  },
  { id:"t31", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"14", employeeName:"Clare Whitfield",  taid:"TAA-0014", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",    siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 009 Eastgate Centre (East)
  { id:"t32", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"15", employeeName:"Thomas Nguyen",    taid:"TAA-0015", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",   siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"17:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t33", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"15", employeeName:"Thomas Nguyen",    taid:"TAA-0015", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",   siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"17:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t34", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"16", employeeName:"Nina Petrov",      taid:"TAA-0016", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",   siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"17:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t35", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"16", employeeName:"Nina Petrov",      taid:"TAA-0016", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",   siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"09:00", clockOut:"23:59", totalHours:8,   payRate:11.00, isAdjusted:true,  isAutoClockOut:true,  originalClockIn:"09:00", originalClockOut:"17:30" },
  // Aug 2025 — 010 Victoria House (East)
  { id:"t36", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"3",  employeeName:"Daniel Osei",      taid:"TAA-0003", siteId:"s10", siteCode:"010", siteName:"Victoria House",    siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"10:00", clockOut:"18:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t37", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"3",  employeeName:"Daniel Osei",      taid:"TAA-0003", siteId:"s10", siteCode:"010", siteName:"Victoria House",    siteArchived:false, area:"East",  shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"10:00", clockOut:"18:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t38", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"11", employeeName:"Hassan Malik",     taid:"TAA-0011", siteId:"s10", siteCode:"010", siteName:"Victoria House",    siteArchived:false, area:"East",  shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"10:00", clockOut:"18:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  { id:"t39", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"11", employeeName:"Hassan Malik",     taid:"TAA-0011", siteId:"s10", siteCode:"010", siteName:"Victoria House",    siteArchived:false, area:"East",  shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"10:00", clockOut:"18:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 011 Northgate House (North)
  { id:"t40", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"5",  employeeName:"Ryan O'Brien",     taid:"TAA-0005", siteId:"s11", siteCode:"011", siteName:"Northgate House",   siteArchived:false, area:"North", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"07:30", clockOut:"15:30", totalHours:8,   payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t41", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"5",  employeeName:"Ryan O'Brien",     taid:"TAA-0005", siteId:"s11", siteCode:"011", siteName:"Northgate House",   siteArchived:false, area:"North", shiftJobRole:"Team Leader",    defaultJobRole:"Team Leader",    clockIn:"07:30", clockOut:"15:30", totalHours:8,   payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t42", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"7",  employeeName:"Yusuf Idris",      taid:"TAA-0007", siteId:"s11", siteCode:"011", siteName:"Northgate House",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:30", clockOut:"23:59", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:true  },
  { id:"t43",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"7",  employeeName:"Yusuf Idris",      taid:"TAA-0007", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 012 Queensgate House (North)
  { id:"t44",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"17", employeeName:"Kieran Walsh",      taid:"TAA-0017", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t45",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"17", employeeName:"Kieran Walsh",      taid:"TAA-0017", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t46",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"18", employeeName:"Natasha Patel",     taid:"TAA-0018", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t47",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"18", employeeName:"Natasha Patel",     taid:"TAA-0018", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t48",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"37", employeeName:"Marcus Day",        taid:"TAA-0037", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t49",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"37", employeeName:"Marcus Day",        taid:"TAA-0037", siteId:"s12", siteCode:"012", siteName:"Queensgate House",     siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 013 Elmwood Centre (North)
  { id:"t50",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"19", employeeName:"George Thornton",   taid:"TAA-0019", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t51",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"19", employeeName:"George Thornton",   taid:"TAA-0019", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t52",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"20", employeeName:"Chloe Drummond",    taid:"TAA-0020", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t53",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"20", employeeName:"Chloe Drummond",    taid:"TAA-0020", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t54",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"38", employeeName:"Imogen Reid",       taid:"TAA-0038", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t55",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"38", employeeName:"Imogen Reid",       taid:"TAA-0038", siteId:"s13", siteCode:"013", siteName:"Elmwood Centre",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 014 Harrow Court (North)
  { id:"t56",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"21", employeeName:"Mohammed Hassan",   taid:"TAA-0021", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t57",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"21", employeeName:"Mohammed Hassan",   taid:"TAA-0021", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t58",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"22", employeeName:"Rebecca Atkins",    taid:"TAA-0022", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t59",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"22", employeeName:"Rebecca Atkins",    taid:"TAA-0022", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t60",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"39", employeeName:"Ben Holton",        taid:"TAA-0039", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t61",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"39", employeeName:"Ben Holton",        taid:"TAA-0039", siteId:"s14", siteCode:"014", siteName:"Harrow Court",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 015 Pennine Place (North)
  { id:"t62",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"23", employeeName:"Brandon Ellis",     taid:"TAA-0023", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t63",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"23", employeeName:"Brandon Ellis",     taid:"TAA-0023", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t64",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"24", employeeName:"Siobhan Murphy",    taid:"TAA-0024", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t65",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"24", employeeName:"Siobhan Murphy",    taid:"TAA-0024", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t66",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"40", employeeName:"Caitlin Norris",    taid:"TAA-0040", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t67",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"40", employeeName:"Caitlin Norris",    taid:"TAA-0040", siteId:"s15", siteCode:"015", siteName:"Pennine Place",        siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 016 Broadmoor House (North)
  { id:"t68",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"25", employeeName:"David Griffiths",   taid:"TAA-0025", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t69",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"25", employeeName:"David Griffiths",   taid:"TAA-0025", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t70",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"26", employeeName:"Zara Hussain",      taid:"TAA-0026", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t71",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"26", employeeName:"Zara Hussain",      taid:"TAA-0026", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t72",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"41", employeeName:"Joel Patterson",    taid:"TAA-0041", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t73",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"41", employeeName:"Joel Patterson",    taid:"TAA-0041", siteId:"s16", siteCode:"016", siteName:"Broadmoor House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 017 Redwood Park (North)
  { id:"t74",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"27", employeeName:"Tyler Barnes",      taid:"TAA-0027", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t75",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"27", employeeName:"Tyler Barnes",      taid:"TAA-0027", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t76",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"28", employeeName:"Aimee Lawson",      taid:"TAA-0028", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t77",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"28", employeeName:"Aimee Lawson",      taid:"TAA-0028", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t78",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"42", employeeName:"Sasha Morgan",      taid:"TAA-0042", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t79",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"42", employeeName:"Sasha Morgan",      taid:"TAA-0042", siteId:"s17", siteCode:"017", siteName:"Redwood Park",         siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 018 Chapel Gate (North)
  { id:"t80",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"29", employeeName:"Connor Hughes",     taid:"TAA-0029", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t81",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"29", employeeName:"Connor Hughes",     taid:"TAA-0029", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t82",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"30", employeeName:"Jade Kaur",         taid:"TAA-0030", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t83",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"30", employeeName:"Jade Kaur",         taid:"TAA-0030", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t84",  date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"43", employeeName:"Ibrahim Yilmaz",    taid:"TAA-0043", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t85",  date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"43", employeeName:"Ibrahim Yilmaz",    taid:"TAA-0043", siteId:"s18", siteCode:"018", siteName:"Chapel Gate",          siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 019 Southern Cross House (South)
  { id:"t86",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"31", employeeName:"Ryan Preston",      taid:"TAA-0031", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t87",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"31", employeeName:"Ryan Preston",      taid:"TAA-0031", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t88",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"32", employeeName:"Lucy Whitfield",    taid:"TAA-0032", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t89",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"32", employeeName:"Lucy Whitfield",    taid:"TAA-0032", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t90",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"44", employeeName:"Eleanor Parks",     taid:"TAA-0044", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t91",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"44", employeeName:"Eleanor Parks",     taid:"TAA-0044", siteId:"s19", siteCode:"019", siteName:"Southern Cross House", siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 020 Whitehall Park (South)
  { id:"t92",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"33", employeeName:"Aaron Chambers",    taid:"TAA-0033", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t93",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"33", employeeName:"Aaron Chambers",    taid:"TAA-0033", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t94",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"34", employeeName:"Hannah Cole",       taid:"TAA-0034", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t95",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"34", employeeName:"Hannah Cole",       taid:"TAA-0034", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t96",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"45", employeeName:"Liam Doherty",      taid:"TAA-0045", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t97",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"45", employeeName:"Liam Doherty",      taid:"TAA-0045", siteId:"s20", siteCode:"020", siteName:"Whitehall Park",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 021 Crown Court (South)
  { id:"t98",  date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"35", employeeName:"Ollie Byrne",       taid:"TAA-0035", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t99",  date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"35", employeeName:"Ollie Byrne",       taid:"TAA-0035", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t100", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"36", employeeName:"Faye Sanderson",    taid:"TAA-0036", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t101", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"36", employeeName:"Faye Sanderson",    taid:"TAA-0036", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t102", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"46", employeeName:"Tamara Firth",      taid:"TAA-0046", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t103", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"46", employeeName:"Tamara Firth",      taid:"TAA-0046", siteId:"s21", siteCode:"021", siteName:"Crown Court",          siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 022 Imperial House (South)
  { id:"t104", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"47", employeeName:"Sebastian Cross",   taid:"TAA-0047", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t105", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"47", employeeName:"Sebastian Cross",   taid:"TAA-0047", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t106", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"48", employeeName:"Amara Obi",         taid:"TAA-0048", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t107", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"48", employeeName:"Amara Obi",         taid:"TAA-0048", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t108", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"49", employeeName:"Jake Hennessy",     taid:"TAA-0049", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t109", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"49", employeeName:"Jake Hennessy",     taid:"TAA-0049", siteId:"s22", siteCode:"022", siteName:"Imperial House",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 023 Granary Square (South)
  { id:"t110", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"50", employeeName:"Priscilla Vance",   taid:"TAA-0050", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t111", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"50", employeeName:"Priscilla Vance",   taid:"TAA-0050", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t112", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"51", employeeName:"Declan Hurley",     taid:"TAA-0051", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t113", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"51", employeeName:"Declan Hurley",     taid:"TAA-0051", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t114", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"52", employeeName:"Mei Lin",           taid:"TAA-0052", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t115", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"52", employeeName:"Mei Lin",           taid:"TAA-0052", siteId:"s23", siteCode:"023", siteName:"Granary Square",       siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 024 Wellington House (South)
  { id:"t116", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"53", employeeName:"Nathan Gibbs",      taid:"TAA-0053", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t117", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"53", employeeName:"Nathan Gibbs",      taid:"TAA-0053", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t118", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"54", employeeName:"Sophia Tran",       taid:"TAA-0054", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t119", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"54", employeeName:"Sophia Tran",       taid:"TAA-0054", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t120", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"55", employeeName:"Karl Bjorn",        taid:"TAA-0055", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t121", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"55", employeeName:"Karl Bjorn",        taid:"TAA-0055", siteId:"s24", siteCode:"024", siteName:"Wellington House",     siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 025 Harbour Point (South)
  { id:"t122", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"56", employeeName:"Leila Farooq",      taid:"TAA-0056", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t123", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"56", employeeName:"Leila Farooq",      taid:"TAA-0056", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t124", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"57", employeeName:"Toby Carlisle",     taid:"TAA-0057", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t125", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"57", employeeName:"Toby Carlisle",     taid:"TAA-0057", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t126", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"58", employeeName:"Destiny Okonkwo",   taid:"TAA-0058", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t127", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"58", employeeName:"Destiny Okonkwo",   taid:"TAA-0058", siteId:"s25", siteCode:"025", siteName:"Harbour Point",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 026 Gateway House (East)
  { id:"t128", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"59", employeeName:"Warren Steele",     taid:"TAA-0059", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t129", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"59", employeeName:"Warren Steele",     taid:"TAA-0059", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t130", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"60", employeeName:"Isla Mackenzie",    taid:"TAA-0060", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t131", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"60", employeeName:"Isla Mackenzie",    taid:"TAA-0060", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t132", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"61", employeeName:"Felipe Morales",    taid:"TAA-0061", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t133", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"61", employeeName:"Felipe Morales",    taid:"TAA-0061", siteId:"s26", siteCode:"026", siteName:"Gateway House",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 027 Thornton Gate (East)
  { id:"t134", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"62", employeeName:"Harriet Dunne",     taid:"TAA-0062", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t135", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"62", employeeName:"Harriet Dunne",     taid:"TAA-0062", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t136", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"63", employeeName:"Adnan Sheikh",      taid:"TAA-0063", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t137", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"63", employeeName:"Adnan Sheikh",      taid:"TAA-0063", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t138", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"64", employeeName:"Niamh Brady",       taid:"TAA-0064", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t139", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"64", employeeName:"Niamh Brady",       taid:"TAA-0064", siteId:"s27", siteCode:"027", siteName:"Thornton Gate",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 028 Ashwood Centre (East)
  { id:"t140", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"65", employeeName:"Craig Dalton",      taid:"TAA-0065", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t141", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"65", employeeName:"Craig Dalton",      taid:"TAA-0065", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t142", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"66", employeeName:"Priya Sharma",      taid:"TAA-0066", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t143", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"66", employeeName:"Priya Sharma",      taid:"TAA-0066", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t144", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"67", employeeName:"Ross Buchanan",     taid:"TAA-0067", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t145", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"67", employeeName:"Ross Buchanan",     taid:"TAA-0067", siteId:"s28", siteCode:"028", siteName:"Ashwood Centre",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 029 Clifton Tower (East)
  { id:"t146", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"68", employeeName:"Valeria Costa",     taid:"TAA-0068", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t147", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"68", employeeName:"Valeria Costa",     taid:"TAA-0068", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t148", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"69", employeeName:"Owen Gallagher",    taid:"TAA-0069", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t149", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"69", employeeName:"Owen Gallagher",    taid:"TAA-0069", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t150", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"70", employeeName:"Aaliyah Cooper",    taid:"TAA-0070", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t151", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"70", employeeName:"Aaliyah Cooper",    taid:"TAA-0070", siteId:"s29", siteCode:"029", siteName:"Clifton Tower",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 030 Maple Court (East)
  { id:"t152", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"71", employeeName:"Stefan Braun",      taid:"TAA-0071", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t153", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"71", employeeName:"Stefan Braun",      taid:"TAA-0071", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t154", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"72", employeeName:"Cora Fitzgerald",   taid:"TAA-0072", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t155", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"72", employeeName:"Cora Fitzgerald",   taid:"TAA-0072", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t156", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"73", employeeName:"Monty Hall",        taid:"TAA-0073", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t157", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"73", employeeName:"Monty Hall",        taid:"TAA-0073", siteId:"s30", siteCode:"030", siteName:"Maple Court",          siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 031 Broadland House (East)
  { id:"t158", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"74", employeeName:"Sunita Rao",        taid:"TAA-0074", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t159", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"74", employeeName:"Sunita Rao",        taid:"TAA-0074", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t160", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"75", employeeName:"Carl Beaumont",     taid:"TAA-0075", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t161", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"75", employeeName:"Carl Beaumont",     taid:"TAA-0075", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t162", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"76", employeeName:"Amelia Thorne",     taid:"TAA-0076", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t163", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"76", employeeName:"Amelia Thorne",     taid:"TAA-0076", siteId:"s31", siteCode:"031", siteName:"Broadland House",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 032 Holbrook Park (East)
  { id:"t164", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"77", employeeName:"Barry Knight",      taid:"TAA-0077", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t165", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"77", employeeName:"Barry Knight",      taid:"TAA-0077", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t166", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"78", employeeName:"Jess Whitmore",     taid:"TAA-0078", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t167", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"78", employeeName:"Jess Whitmore",     taid:"TAA-0078", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t168", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"79", employeeName:"Dmitri Volkov",     taid:"TAA-0079", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t169", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"79", employeeName:"Dmitri Volkov",     taid:"TAA-0079", siteId:"s32", siteCode:"032", siteName:"Holbrook Park",        siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 033 Westbrook House (West)
  { id:"t170", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"80", employeeName:"Evelyn Nash",       taid:"TAA-0080", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t171", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"80", employeeName:"Evelyn Nash",       taid:"TAA-0080", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t172", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"81", employeeName:"Kevin Flood",       taid:"TAA-0081", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t173", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"81", employeeName:"Kevin Flood",       taid:"TAA-0081", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t174", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"82", employeeName:"Rosie Quinn",       taid:"TAA-0082", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t175", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"82", employeeName:"Rosie Quinn",       taid:"TAA-0082", siteId:"s33", siteCode:"033", siteName:"Westbrook House",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 034 Caldwell Centre (West)
  { id:"t176", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"83", employeeName:"Elliot Harker",     taid:"TAA-0083", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t177", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"83", employeeName:"Elliot Harker",     taid:"TAA-0083", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t178", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"84", employeeName:"Blessing Adeyemi",  taid:"TAA-0084", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t179", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"84", employeeName:"Blessing Adeyemi",  taid:"TAA-0084", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t180", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"85", employeeName:"Sam Norris",        taid:"TAA-0085", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t181", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"85", employeeName:"Sam Norris",        taid:"TAA-0085", siteId:"s34", siteCode:"034", siteName:"Caldwell Centre",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 035 Briarfield Tower (West)
  { id:"t182", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"86", employeeName:"Tanya Frost",       taid:"TAA-0086", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t183", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"86", employeeName:"Tanya Frost",       taid:"TAA-0086", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t184", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"87", employeeName:"Vijay Kumar",       taid:"TAA-0087", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t185", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"87", employeeName:"Vijay Kumar",       taid:"TAA-0087", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t186", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"88", employeeName:"Saoirse O'Neill",   taid:"TAA-0088", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t187", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"88", employeeName:"Saoirse O'Neill",   taid:"TAA-0088", siteId:"s35", siteCode:"035", siteName:"Briarfield Tower",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 036 Ironbridge Court (West)
  { id:"t188", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"89", employeeName:"Patrick Boyle",     taid:"TAA-0089", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t189", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"89", employeeName:"Patrick Boyle",     taid:"TAA-0089", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t190", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"90", employeeName:"Wendy Holt",        taid:"TAA-0090", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t191", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"90", employeeName:"Wendy Holt",        taid:"TAA-0090", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t192", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"91", employeeName:"Alec Stirling",     taid:"TAA-0091", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t193", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"91", employeeName:"Alec Stirling",     taid:"TAA-0091", siteId:"s36", siteCode:"036", siteName:"Ironbridge Court",     siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 037 Ferndale Place (West)
  { id:"t194", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"92", employeeName:"Fatou Diallo",      taid:"TAA-0092", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t195", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"92", employeeName:"Fatou Diallo",      taid:"TAA-0092", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t196", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"93", employeeName:"Jamie Greer",       taid:"TAA-0093", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t197", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"93", employeeName:"Jamie Greer",       taid:"TAA-0093", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t198", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"94", employeeName:"Helen Shaw",        taid:"TAA-0094", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t199", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"94", employeeName:"Helen Shaw",        taid:"TAA-0094", siteId:"s37", siteCode:"037", siteName:"Ferndale Place",       siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 038 Severn Gate (West)
  { id:"t200", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"95", employeeName:"Reza Ahmadi",       taid:"TAA-0095", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t201", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"95", employeeName:"Reza Ahmadi",       taid:"TAA-0095", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t202", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"96", employeeName:"Penny Lawton",      taid:"TAA-0096", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t203", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"96", employeeName:"Penny Lawton",      taid:"TAA-0096", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t204", date:"2025-08-06", dateLabel:"Wed 6 Aug",  month:"2025-08", employeeId:"97", employeeName:"Niall Brennan",     taid:"TAA-0097", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t205", date:"2025-08-07", dateLabel:"Thu 7 Aug",  month:"2025-08", employeeId:"97", employeeName:"Niall Brennan",     taid:"TAA-0097", siteId:"s38", siteCode:"038", siteName:"Severn Gate",          siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 039 Malvern House (West)
  { id:"t206", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"98",  employeeName:"Olivia Marsh",      taid:"TAA-0098", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t207", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"98",  employeeName:"Olivia Marsh",      taid:"TAA-0098", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t208", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"99",  employeeName:"Gareth Probert",    taid:"TAA-0099", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t209", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"99",  employeeName:"Gareth Probert",    taid:"TAA-0099", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t210", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"100", employeeName:"Lena Fischer",      taid:"TAA-0100", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t211", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"100", employeeName:"Lena Fischer",      taid:"TAA-0100", siteId:"s39", siteCode:"039", siteName:"Malvern House",        siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — 040 Ravenswood Park (West)
  { id:"t212", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"101", employeeName:"Howard Webb",       taid:"TAA-0101", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t213", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"101", employeeName:"Howard Webb",       taid:"TAA-0101", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Team Leader",  defaultJobRole:"Team Leader",  clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:12.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t214", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"102", employeeName:"Nneka Okafor",      taid:"TAA-0102", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t215", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"102", employeeName:"Nneka Okafor",      taid:"TAA-0102", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t216", date:"2025-08-04", dateLabel:"Mon 4 Aug",  month:"2025-08", employeeId:"103", employeeName:"Will Cartwright",   taid:"TAA-0103", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t217", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"103", employeeName:"Will Cartwright",   taid:"TAA-0103", siteId:"s40", siteCode:"040", siteName:"Ravenswood Park",      siteArchived:false, area:"West",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Aug 2025 — employees 104–124 at existing sites
  { id:"t218", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"104", employeeName:"Beatrice Knowles",  taid:"TAA-0104", siteId:"s1",  siteCode:"001", siteName:"Citygate House",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t219", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"104", employeeName:"Beatrice Knowles",  taid:"TAA-0104", siteId:"s1",  siteCode:"001", siteName:"Citygate House",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t220", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"105", employeeName:"Karl Finlay",       taid:"TAA-0105", siteId:"s1",  siteCode:"001", siteName:"Citygate House",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t221", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"105", employeeName:"Karl Finlay",       taid:"TAA-0105", siteId:"s1",  siteCode:"001", siteName:"Citygate House",       siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t222", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"106", employeeName:"Alisha Chowdhury",  taid:"TAA-0106", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t223", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"106", employeeName:"Alisha Chowdhury",  taid:"TAA-0106", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t224", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"107", employeeName:"Peter Stokes",      taid:"TAA-0107", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t225", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"107", employeeName:"Peter Stokes",      taid:"TAA-0107", siteId:"s2",  siteCode:"002", siteName:"Parkside Office",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t226", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"108", employeeName:"Davina Osei",       taid:"TAA-0108", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t227", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"108", employeeName:"Davina Osei",       taid:"TAA-0108", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t228", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"109", employeeName:"Luke Sheridan",     taid:"TAA-0109", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t229", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"109", employeeName:"Luke Sheridan",     taid:"TAA-0109", siteId:"s3",  siteCode:"003", siteName:"Riverside Plaza",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t230", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"110", employeeName:"Nadia Petit",       taid:"TAA-0110", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",      siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t231", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"110", employeeName:"Nadia Petit",       taid:"TAA-0110", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",      siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t232", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"111", employeeName:"Shane Dunleavy",    taid:"TAA-0111", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",      siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t233", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"111", employeeName:"Shane Dunleavy",    taid:"TAA-0111", siteId:"s4",  siteCode:"004", siteName:"Highfield Tower",      siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t234", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"112", employeeName:"Vivienne Hartley",  taid:"TAA-0112", siteId:"s6",  siteCode:"006", siteName:"Central Court",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t235", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"112", employeeName:"Vivienne Hartley",  taid:"TAA-0112", siteId:"s6",  siteCode:"006", siteName:"Central Court",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"06:00", clockOut:"14:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t236", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"113", employeeName:"Dean Alderton",     taid:"TAA-0113", siteId:"s6",  siteCode:"006", siteName:"Central Court",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t237", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"113", employeeName:"Dean Alderton",     taid:"TAA-0113", siteId:"s6",  siteCode:"006", siteName:"Central Court",        siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t238", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"114", employeeName:"Abby Cheng",        taid:"TAA-0114", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub",    siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t239", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"114", employeeName:"Abby Cheng",        taid:"TAA-0114", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub",    siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t240", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"115", employeeName:"Frank Corrigan",    taid:"TAA-0115", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub",    siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t241", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"115", employeeName:"Frank Corrigan",    taid:"TAA-0115", siteId:"s7",  siteCode:"007", siteName:"Bridge Street Hub",    siteArchived:false, area:"South", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t242", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"116", employeeName:"Iris Browne",       taid:"TAA-0116", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t243", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"116", employeeName:"Iris Browne",       taid:"TAA-0116", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:00", clockOut:"15:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t244", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"117", employeeName:"Theo Blackwood",    taid:"TAA-0117", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t245", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"117", employeeName:"Theo Blackwood",    taid:"TAA-0117", siteId:"s8",  siteCode:"008", siteName:"Millbank Tower",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"08:00", clockOut:"16:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t246", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"118", employeeName:"Salma Hadi",        taid:"TAA-0118", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t247", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"118", employeeName:"Salma Hadi",        taid:"TAA-0118", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t248", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"119", employeeName:"Clive Sutton",      taid:"TAA-0119", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t249", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"119", employeeName:"Clive Sutton",      taid:"TAA-0119", siteId:"s9",  siteCode:"009", siteName:"Eastgate Centre",      siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"09:00", clockOut:"17:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t250", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"120", employeeName:"Josephine Mensah",  taid:"TAA-0120", siteId:"s10", siteCode:"010", siteName:"Victoria House",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"10:00", clockOut:"18:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t251", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"120", employeeName:"Josephine Mensah",  taid:"TAA-0120", siteId:"s10", siteCode:"010", siteName:"Victoria House",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"10:00", clockOut:"18:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t252", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"121", employeeName:"Raymond Tucker",    taid:"TAA-0121", siteId:"s10", siteCode:"010", siteName:"Victoria House",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"10:00", clockOut:"18:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t253", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"121", employeeName:"Raymond Tucker",    taid:"TAA-0121", siteId:"s10", siteCode:"010", siteName:"Victoria House",       siteArchived:false, area:"East",  shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"10:00", clockOut:"18:00", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t254", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"122", employeeName:"Esme Clifford",     taid:"TAA-0122", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t255", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"122", employeeName:"Esme Clifford",     taid:"TAA-0122", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t256", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"123", employeeName:"Andy Pearce",       taid:"TAA-0123", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t257", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"123", employeeName:"Andy Pearce",       taid:"TAA-0123", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t258", date:"2025-08-11", dateLabel:"Mon 11 Aug", month:"2025-08", employeeId:"124", employeeName:"Miriam Adler",      taid:"TAA-0124", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t259", date:"2025-08-12", dateLabel:"Tue 12 Aug", month:"2025-08", employeeId:"124", employeeName:"Miriam Adler",      taid:"TAA-0124", siteId:"s11", siteCode:"011", siteName:"Northgate House",      siteArchived:false, area:"North", shiftJobRole:"Cleaner",      defaultJobRole:"Cleaner",      clockIn:"07:30", clockOut:"15:30", totalHours:8, payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  // Jul 2025 — locked for HoA / AM after 10th Aug
  { id:"t18", date:"2025-07-31", dateLabel:"Thu 31 Jul", month:"2025-07", employeeId:"2",  employeeName:"Sarah Okonkwo",    taid:"TAA-0002", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
  { id:"t19", date:"2025-07-30", dateLabel:"Wed 30 Jul", month:"2025-07", employeeId:"1",  employeeName:"James Mitchell",   taid:"TAA-0001", siteId:"s1",  siteCode:"001", siteName:"Citygate House",    siteArchived:false, area:"North", shiftJobRole:"Supervisor",     defaultJobRole:"Supervisor",     clockIn:"07:00", clockOut:"15:00", totalHours:8,   payRate:12.50, isAdjusted:false, isAutoClockOut:false },
]

const SITES_LIST = [
  { id:"s1",  code:"001", name:"Citygate House",    area:"North" },
  { id:"s2",  code:"002", name:"Parkside Office",   area:"North" },
  { id:"s3",  code:"003", name:"Riverside Plaza",   area:"North" },
  { id:"s4",  code:"004", name:"Highfield Tower",   area:"South" },
  { id:"s5",  code:"005", name:"Apex House",        area:"South" },
  { id:"s6",  code:"006", name:"Central Court",     area:"South" },
  { id:"s7",  code:"007", name:"Bridge Street Hub", area:"South" },
  { id:"s8",  code:"008", name:"Millbank Tower",    area:"East"  },
  { id:"s9",  code:"009", name:"Eastgate Centre",   area:"East"  },
  { id:"s10", code:"010", name:"Victoria House",    area:"East"  },
  { id:"s11", code:"011", name:"Northgate House",      area:"North" },
  { id:"s12", code:"012", name:"Queensgate House",     area:"North" },
  { id:"s13", code:"013", name:"Elmwood Centre",        area:"North" },
  { id:"s14", code:"014", name:"Harrow Court",          area:"North" },
  { id:"s15", code:"015", name:"Pennine Place",         area:"North" },
  { id:"s16", code:"016", name:"Broadmoor House",       area:"North" },
  { id:"s17", code:"017", name:"Redwood Park",          area:"North" },
  { id:"s18", code:"018", name:"Chapel Gate",           area:"North" },
  { id:"s19", code:"019", name:"Southern Cross House",  area:"South" },
  { id:"s20", code:"020", name:"Whitehall Park",        area:"South" },
  { id:"s21", code:"021", name:"Crown Court",           area:"South" },
  { id:"s22", code:"022", name:"Imperial House",        area:"South" },
  { id:"s23", code:"023", name:"Granary Square",        area:"South" },
  { id:"s24", code:"024", name:"Wellington House",      area:"South" },
  { id:"s25", code:"025", name:"Harbour Point",         area:"South" },
  { id:"s26", code:"026", name:"Gateway House",         area:"East"  },
  { id:"s27", code:"027", name:"Thornton Gate",         area:"East"  },
  { id:"s28", code:"028", name:"Ashwood Centre",        area:"East"  },
  { id:"s29", code:"029", name:"Clifton Tower",         area:"East"  },
  { id:"s30", code:"030", name:"Maple Court",           area:"East"  },
  { id:"s31", code:"031", name:"Broadland House",       area:"East"  },
  { id:"s32", code:"032", name:"Holbrook Park",         area:"East"  },
  { id:"s33", code:"033", name:"Westbrook House",       area:"West"  },
  { id:"s34", code:"034", name:"Caldwell Centre",       area:"West"  },
  { id:"s35", code:"035", name:"Briarfield Tower",      area:"West"  },
  { id:"s36", code:"036", name:"Ironbridge Court",      area:"West"  },
  { id:"s37", code:"037", name:"Ferndale Place",        area:"West"  },
  { id:"s38", code:"038", name:"Severn Gate",           area:"West"  },
  { id:"s39", code:"039", name:"Malvern House",         area:"West"  },
  { id:"s40", code:"040", name:"Ravenswood Park",       area:"West"  },
]

const EMPLOYEES_LIST = [
  { id:"1",  name:"James Mitchell",   taid:"TAA-0001" },
  { id:"2",  name:"Sarah Okonkwo",    taid:"TAA-0002" },
  { id:"3",  name:"Daniel Osei",      taid:"TAA-0003" },
  { id:"4",  name:"Aisha Patel",      taid:"TAA-0004" },
  { id:"5",  name:"Ryan O'Brien",     taid:"TAA-0005" },
  { id:"6",  name:"Maria Santos",     taid:"TAA-0006" },
  { id:"7",  name:"Yusuf Idris",      taid:"TAA-0007" },
  { id:"8",  name:"Priya Singh",      taid:"TAA-0008" },
  { id:"9",  name:"Grace Okafor",     taid:"TAA-0009" },
  { id:"10", name:"Emma Clarke",      taid:"TAA-0010" },
  { id:"11", name:"Hassan Malik",     taid:"TAA-0011" },
  { id:"12", name:"Fatima Ahmed",     taid:"TAA-0012" },
  { id:"13", name:"Callum Robertson", taid:"TAA-0013" },
  { id:"14", name:"Clare Whitfield",  taid:"TAA-0014" },
  { id:"15", name:"Thomas Nguyen",    taid:"TAA-0015" },
  { id:"16",  name:"Nina Petrov",        taid:"TAA-0016" },
  { id:"17",  name:"Kieran Walsh",       taid:"TAA-0017" },
  { id:"18",  name:"Natasha Patel",      taid:"TAA-0018" },
  { id:"19",  name:"George Thornton",    taid:"TAA-0019" },
  { id:"20",  name:"Chloe Drummond",     taid:"TAA-0020" },
  { id:"21",  name:"Mohammed Hassan",    taid:"TAA-0021" },
  { id:"22",  name:"Rebecca Atkins",     taid:"TAA-0022" },
  { id:"23",  name:"Brandon Ellis",      taid:"TAA-0023" },
  { id:"24",  name:"Siobhan Murphy",     taid:"TAA-0024" },
  { id:"25",  name:"David Griffiths",    taid:"TAA-0025" },
  { id:"26",  name:"Zara Hussain",       taid:"TAA-0026" },
  { id:"27",  name:"Tyler Barnes",       taid:"TAA-0027" },
  { id:"28",  name:"Aimee Lawson",       taid:"TAA-0028" },
  { id:"29",  name:"Connor Hughes",      taid:"TAA-0029" },
  { id:"30",  name:"Jade Kaur",          taid:"TAA-0030" },
  { id:"31",  name:"Ryan Preston",       taid:"TAA-0031" },
  { id:"32",  name:"Lucy Whitfield",     taid:"TAA-0032" },
  { id:"33",  name:"Aaron Chambers",     taid:"TAA-0033" },
  { id:"34",  name:"Hannah Cole",        taid:"TAA-0034" },
  { id:"35",  name:"Ollie Byrne",        taid:"TAA-0035" },
  { id:"36",  name:"Faye Sanderson",     taid:"TAA-0036" },
  { id:"37",  name:"Marcus Day",         taid:"TAA-0037" },
  { id:"38",  name:"Imogen Reid",        taid:"TAA-0038" },
  { id:"39",  name:"Ben Holton",         taid:"TAA-0039" },
  { id:"40",  name:"Caitlin Norris",     taid:"TAA-0040" },
  { id:"41",  name:"Joel Patterson",     taid:"TAA-0041" },
  { id:"42",  name:"Sasha Morgan",       taid:"TAA-0042" },
  { id:"43",  name:"Ibrahim Yilmaz",     taid:"TAA-0043" },
  { id:"44",  name:"Eleanor Parks",      taid:"TAA-0044" },
  { id:"45",  name:"Liam Doherty",       taid:"TAA-0045" },
  { id:"46",  name:"Tamara Firth",       taid:"TAA-0046" },
  { id:"47",  name:"Sebastian Cross",    taid:"TAA-0047" },
  { id:"48",  name:"Amara Obi",          taid:"TAA-0048" },
  { id:"49",  name:"Jake Hennessy",      taid:"TAA-0049" },
  { id:"50",  name:"Priscilla Vance",    taid:"TAA-0050" },
  { id:"51",  name:"Declan Hurley",      taid:"TAA-0051" },
  { id:"52",  name:"Mei Lin",            taid:"TAA-0052" },
  { id:"53",  name:"Nathan Gibbs",       taid:"TAA-0053" },
  { id:"54",  name:"Sophia Tran",        taid:"TAA-0054" },
  { id:"55",  name:"Karl Bjorn",         taid:"TAA-0055" },
  { id:"56",  name:"Leila Farooq",       taid:"TAA-0056" },
  { id:"57",  name:"Toby Carlisle",      taid:"TAA-0057" },
  { id:"58",  name:"Destiny Okonkwo",    taid:"TAA-0058" },
  { id:"59",  name:"Warren Steele",      taid:"TAA-0059" },
  { id:"60",  name:"Isla Mackenzie",     taid:"TAA-0060" },
  { id:"61",  name:"Felipe Morales",     taid:"TAA-0061" },
  { id:"62",  name:"Harriet Dunne",      taid:"TAA-0062" },
  { id:"63",  name:"Adnan Sheikh",       taid:"TAA-0063" },
  { id:"64",  name:"Niamh Brady",        taid:"TAA-0064" },
  { id:"65",  name:"Craig Dalton",       taid:"TAA-0065" },
  { id:"66",  name:"Priya Sharma",       taid:"TAA-0066" },
  { id:"67",  name:"Ross Buchanan",      taid:"TAA-0067" },
  { id:"68",  name:"Valeria Costa",      taid:"TAA-0068" },
  { id:"69",  name:"Owen Gallagher",     taid:"TAA-0069" },
  { id:"70",  name:"Aaliyah Cooper",     taid:"TAA-0070" },
  { id:"71",  name:"Stefan Braun",       taid:"TAA-0071" },
  { id:"72",  name:"Cora Fitzgerald",    taid:"TAA-0072" },
  { id:"73",  name:"Monty Hall",         taid:"TAA-0073" },
  { id:"74",  name:"Sunita Rao",         taid:"TAA-0074" },
  { id:"75",  name:"Carl Beaumont",      taid:"TAA-0075" },
  { id:"76",  name:"Amelia Thorne",      taid:"TAA-0076" },
  { id:"77",  name:"Barry Knight",       taid:"TAA-0077" },
  { id:"78",  name:"Jess Whitmore",      taid:"TAA-0078" },
  { id:"79",  name:"Dmitri Volkov",      taid:"TAA-0079" },
  { id:"80",  name:"Evelyn Nash",        taid:"TAA-0080" },
  { id:"81",  name:"Kevin Flood",        taid:"TAA-0081" },
  { id:"82",  name:"Rosie Quinn",        taid:"TAA-0082" },
  { id:"83",  name:"Elliot Harker",      taid:"TAA-0083" },
  { id:"84",  name:"Blessing Adeyemi",   taid:"TAA-0084" },
  { id:"85",  name:"Sam Norris",         taid:"TAA-0085" },
  { id:"86",  name:"Tanya Frost",        taid:"TAA-0086" },
  { id:"87",  name:"Vijay Kumar",        taid:"TAA-0087" },
  { id:"88",  name:"Saoirse O'Neill",    taid:"TAA-0088" },
  { id:"89",  name:"Patrick Boyle",      taid:"TAA-0089" },
  { id:"90",  name:"Wendy Holt",         taid:"TAA-0090" },
  { id:"91",  name:"Alec Stirling",      taid:"TAA-0091" },
  { id:"92",  name:"Fatou Diallo",       taid:"TAA-0092" },
  { id:"93",  name:"Jamie Greer",        taid:"TAA-0093" },
  { id:"94",  name:"Helen Shaw",         taid:"TAA-0094" },
  { id:"95",  name:"Reza Ahmadi",        taid:"TAA-0095" },
  { id:"96",  name:"Penny Lawton",       taid:"TAA-0096" },
  { id:"97",  name:"Niall Brennan",      taid:"TAA-0097" },
  { id:"98",  name:"Olivia Marsh",       taid:"TAA-0098" },
  { id:"99",  name:"Gareth Probert",     taid:"TAA-0099" },
  { id:"100", name:"Lena Fischer",       taid:"TAA-0100" },
  { id:"101", name:"Howard Webb",        taid:"TAA-0101" },
  { id:"102", name:"Nneka Okafor",       taid:"TAA-0102" },
  { id:"103", name:"Will Cartwright",    taid:"TAA-0103" },
  { id:"104", name:"Beatrice Knowles",   taid:"TAA-0104" },
  { id:"105", name:"Karl Finlay",        taid:"TAA-0105" },
  { id:"106", name:"Alisha Chowdhury",   taid:"TAA-0106" },
  { id:"107", name:"Peter Stokes",       taid:"TAA-0107" },
  { id:"108", name:"Davina Osei",        taid:"TAA-0108" },
  { id:"109", name:"Luke Sheridan",      taid:"TAA-0109" },
  { id:"110", name:"Nadia Petit",        taid:"TAA-0110" },
  { id:"111", name:"Shane Dunleavy",     taid:"TAA-0111" },
  { id:"112", name:"Vivienne Hartley",   taid:"TAA-0112" },
  { id:"113", name:"Dean Alderton",      taid:"TAA-0113" },
  { id:"114", name:"Abby Cheng",         taid:"TAA-0114" },
  { id:"115", name:"Frank Corrigan",     taid:"TAA-0115" },
  { id:"116", name:"Iris Browne",        taid:"TAA-0116" },
  { id:"117", name:"Theo Blackwood",     taid:"TAA-0117" },
  { id:"118", name:"Salma Hadi",         taid:"TAA-0118" },
  { id:"119", name:"Clive Sutton",       taid:"TAA-0119" },
  { id:"120", name:"Josephine Mensah",   taid:"TAA-0120" },
  { id:"121", name:"Raymond Tucker",     taid:"TAA-0121" },
  { id:"122", name:"Esme Clifford",      taid:"TAA-0122" },
  { id:"123", name:"Andy Pearce",        taid:"TAA-0123" },
  { id:"124", name:"Miriam Adler",       taid:"TAA-0124" },
]

const ROLE_SITES: Record<string, string[]> = {
  "super-admin":  ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23","s24","s25","s26","s27","s28","s29","s30","s31","s32","s33","s34","s35","s36","s37","s38","s39","s40"],
  "head-office":  ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23","s24","s25","s26","s27","s28","s29","s30","s31","s32","s33","s34","s35","s36","s37","s38","s39","s40"],
  "head-of-area": ["s1","s2","s3","s11"],
  "area-manager": ["s1","s2"],
}

const FLAG_OPTIONS = [
  { value: "adjusted",       label: "Adjusted" },
  { value: "auto-clock-out", label: "Auto Clock-Out" },
]

function isPayrollLocked(entry: Entry, role: string): boolean {
  if (role !== "head-of-area" && role !== "area-manager") return false
  return entry.month < "2025-08"
}

function canAdjustEntry(entry: Entry, role: string, accessibleSites: string[]): boolean {
  if (!accessibleSites.includes(entry.siteId)) return false
  return !isPayrollLocked(entry, role)
}

function calcHours(ci: string, co: string): number {
  const [h1, m1] = ci.split(":").map(Number)
  const [h2, m2] = co.split(":").map(Number)
  return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 6) / 10
}

function fmtDate(d: string): string {
  if (!d) return ""
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const sd = parseInt(d.slice(8))
  const sm = parseInt(d.slice(5, 7)) - 1
  return `${sd} ${months[sm]}`
}

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

// ─── Date input (right-aligned calendar icon) ────────────────────────────────────

function DateInput({ value, onChange, placeholder, hasError }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hasError?: boolean
}) {
  return (
    <div className="relative">
      <div className={cn(
        "flex h-9 items-center justify-between rounded-md border px-3 text-sm transition-colors bg-muted/50",
        hasError
          ? "border-destructive"
          : "border-input hover:border-input-hover",
        value ? "text-foreground" : "text-muted-foreground"
      )}>
        <span className="truncate">{value ? fmtDate(value) : (placeholder ?? "Select date")}</span>
        <Calendar className="ml-2 size-4 shrink-0 text-foreground/50" />
      </div>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}

// ─── Time input (right-aligned clock icon) ───────────────────────────────────────

function TimeInput({ value, onChange, hasError }: {
  value: string
  onChange: (v: string) => void
  hasError?: boolean
}) {
  return (
    <div className="relative">
      <div className={cn(
        "flex h-9 items-center justify-between rounded-md border px-3 text-sm transition-colors bg-muted/50",
        hasError
          ? "border-destructive"
          : "border-input hover:border-input-hover",
        value ? "text-foreground" : "text-muted-foreground"
      )}>
        <span className="font-mono">{value || "HH:MM"}</span>
        <Clock className="ml-2 size-4 shrink-0 text-foreground/50" />
      </div>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}

// ─── Date range filter ────────────────────────────────────────────────────────────

function DateRangeFilter({ from, to, onChange }: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [])

  const hasValue = !!(from || to)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          hasValue
            ? "border-border bg-background text-foreground hover:bg-accent"
            : "border-dashed border-input bg-background text-foreground hover:bg-accent"
        )}
      >
        <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
        Date range
        {hasValue && (
          <>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
            <span className="max-w-[160px] truncate text-sm">
              {from ? fmtDate(from) : "…"} – {to ? fmtDate(to) : "…"}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-80 rounded-xl border border-border bg-background shadow-lg">
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">From</span>
              <DateInput value={from} onChange={v => onChange(v, to)} placeholder="Select date" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">To</span>
              <DateInput value={to} onChange={v => onChange(from, v)} placeholder="Select date" />
            </div>
          </div>
          {hasValue && (
            <>
              <div className="border-t border-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { onChange("", ""); setOpen(false) }}
                  className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Clear filter
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Primitives ──────────────────────────────────────────────────────────────────

function Dialog({
  open, onClose, title, children, footer, maxWidth = "max-w-lg", lockClose = false,
}: {
  open: boolean; onClose: () => void; title: React.ReactNode
  children: React.ReactNode; footer?: React.ReactNode
  maxWidth?: string; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, onClose, lockClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={lockClose ? undefined : onClose} />
      <div className={cn("relative z-10 flex w-full flex-col rounded-xl bg-background shadow-xl max-h-[90vh]", maxWidth)}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {!lockClose && (
            <button type="button" onClick={onClose}
              className="-mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error
        ? <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3 shrink-0" />{error}</p>
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p>
        : null}
    </div>
  )
}

function inputCls(hasError?: boolean) {
  return cn(
    "flex h-9 w-full rounded-md border bg-muted/50 px-3 text-sm transition-colors",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    hasError ? "border-destructive hover:border-destructive focus:ring-destructive/30" : "border-input hover:border-input-hover"
  )
}

function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/60">
      {children}
    </span>
  )
}

// ─── AdjustDialog ─────────────────────────────────────────────────────────────────

function AdjustDialog({ open, onClose, entry, onSave }: {
  open: boolean; onClose: () => void
  entry: Entry | null
  onSave: (id: string, clockIn: string, clockOut: string) => void
}) {
  const [clockIn, setClockIn]       = useState("")
  const [clockOut, setClockOut]     = useState("")
  const [reason, setReason]         = useState("")
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (open && entry) {
      setClockIn(entry.clockIn)
      setClockOut(entry.clockOut === "23:59" ? "16:00" : entry.clockOut)
      setReason("")
      setErrors({})
      setSubmitting(false)
      setDone(false)
    }
  }, [open, entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e: Record<string, string> = {}
    if (!clockIn)  e.clockIn  = "Clock-in time is required."
    if (!clockOut) e.clockOut = "Clock-out time is required."
    if (clockIn && clockOut && clockIn >= clockOut)
      e.clockIn = "Clock-in time must be before clock-out time."
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setDone(true) }, 1200)
  }

  function handleDone() {
    if (entry) onSave(entry.id, clockIn, clockOut)
    onClose()
  }

  if (!entry) return null

  const previewHours = clockIn && clockOut && clockIn < clockOut ? calcHours(clockIn, clockOut) : null

  if (done) {
    return (
      <Dialog open={open} onClose={handleDone} title="Adjust hours"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={handleDone}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Done
            </button>
          </div>
        }>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <svg className="size-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Hours adjusted</p>
            <p className="mt-1 text-sm text-muted-foreground">{entry.employeeName} · {entry.siteName} · {entry.dateLabel}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">An audit record has been created.</p>
          </div>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title="Adjust hours"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {submitting ? "Saving…" : "Save adjustment"}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-4 p-6">
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">{entry.employeeName}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{entry.taid}</p>
            </div>
            {(entry.isAdjusted || entry.isAutoClockOut) && (
              <div className="flex shrink-0 gap-1">
                {entry.isAdjusted && (
                  <Badge variant="info">Adjusted</Badge>
                )}
                {entry.isAutoClockOut && (
                  <Badge variant="warning">Auto Clock-Out</Badge>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{entry.siteName} · {entry.dateLabel}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <Clock className="size-3.5 shrink-0 text-muted-foreground" />
            Original: {entry.originalClockIn ?? entry.clockIn} – {entry.originalClockOut ?? entry.clockOut} · {entry.totalHours}h
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Clock in" required error={errors.clockIn}>
            <TimeInput value={clockIn}
              onChange={v => { setClockIn(v); setErrors(ev => ({ ...ev, clockIn: "" })) }}
              hasError={!!errors.clockIn} />
          </Field>
          <Field label="Clock out" required error={errors.clockOut}>
            <TimeInput value={clockOut}
              onChange={v => { setClockOut(v); setErrors(ev => ({ ...ev, clockOut: "" })) }}
              hasError={!!errors.clockOut} />
          </Field>
        </div>
        {previewHours !== null && (
          <p className="text-xs text-muted-foreground">
            New total: <span className="font-medium text-foreground">{previewHours}h</span>
          </p>
        )}

        <Field label="Reason for adjustment"
          hint="Optional. Recorded in the audit log. Consider adding a reason for traceability.">
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Reason for adjustment…" rows={3}
            className={cn(inputCls(), "h-auto resize-none py-2")} />
        </Field>
      </div>
    </Dialog>
  )
}

// ─── ExportDialog ─────────────────────────────────────────────────────────────────

function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep]         = useState<ExportStep>("form")
  const [dateFrom, setDateFrom] = useState("2025-08-01")
  const [dateTo, setDateTo]     = useState("2025-08-31")
  const [errors, setErrors]     = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setStep("form")
      setDateFrom("2025-08-01")
      setDateTo("2025-08-31")
      setErrors({})
    }
  }, [open])

  function validate() {
    const e: Record<string, string> = {}
    if (!dateFrom) e.dateFrom = "Date from is required."
    if (!dateTo)   e.dateTo   = "Date to is required."
    if (dateFrom && dateTo && dateFrom >= dateTo)
      e.dateFrom = "Date from must be before date to."
    return e
  }

  function handleExport() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (dateFrom > "2026-01-01") { setStep("no-data"); return }
    setStep("processing")
    setTimeout(() => setStep("success"), 2000)
  }

  const titles: Record<ExportStep, string> = {
    form: "Export payroll", processing: "Export payroll",
    success: "Export ready", "no-data": "Export payroll",
  }

  return (
    <Dialog open={open} onClose={onClose} title={titles[step]} lockClose={step === "processing"}
      footer={
        step === "form" ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </button>
            <button type="button" onClick={handleExport}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Generate export
            </button>
          </div>
        ) : step === "success" ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Close
            </button>
            <button type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Download className="size-4" />Download Excel
            </button>
          </div>
        ) : step === "no-data" ? (
          <div className="flex justify-end">
            <button type="button" onClick={() => setStep("form")}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Adjust dates
            </button>
          </div>
        ) : null
      }>

      {step === "form" && (
        <div className="flex flex-col gap-4 p-6">
          <p className="text-sm text-muted-foreground">
            Generate a Sage 50-compatible Excel export of payroll data for the selected period.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date from" required error={errors.dateFrom}>
              <DateInput
                value={dateFrom}
                onChange={v => { setDateFrom(v); setErrors(prev => ({ ...prev, dateFrom: "" })) }}
                placeholder="Select date"
                hasError={!!errors.dateFrom}
              />
            </Field>
            <Field label="Date to" required error={errors.dateTo}>
              <DateInput
                value={dateTo}
                onChange={v => { setDateTo(v); setErrors(prev => ({ ...prev, dateTo: "" })) }}
                placeholder="Select date"
                hasError={!!errors.dateTo}
              />
            </Field>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2.5">
            <p className="text-sm font-medium text-foreground">Export includes</p>
            <p className="text-xs text-muted-foreground">
              One row per Employee × Legal Company × Pay Rate. Columns include Payroll ID, Legal Company, T&A ID, Employee Name, Period From/To, Job Role, Pay Rate, Total Worked Hours, and Total Holiday Hours.
            </p>
            <p className="text-xs text-muted-foreground">
              Archived site hours are included when they fall within the selected period. Employees with missing Payroll IDs are included with a blank Payroll ID field.
            </p>
          </div>
          <AlertBox variant="error">
            The exact Sage 50 file format is pending client confirmation.
          </AlertBox>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium">Generating Sage 50 export…</p>
          <p className="text-sm text-muted-foreground">Calculating worked and holiday hours for all employees.</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <FileSpreadsheet className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-medium">Export ready</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Payroll export for {fmtDate(dateFrom)} – {fmtDate(dateTo)}
            </p>
          </div>
        </div>
      )}

      {step === "no-data" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No payroll data found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No timesheet data exists for the selected period. Adjust the date range and try again.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  )
}

// ─── Row action menu ────────────────────────────────────────────────────────────

function TimesheetRowActionMenu({ onAdjust }: { onAdjust: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (
        !wrapRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
        items[next]?.focus()
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
          className="w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button role="menuitem" type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); onAdjust() }}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            Adjust hours
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Timesheet row ─────────────────────────────────────────────────────────────────

function TRow({ entry, nameCol, role, accessibleSites, onAdjust }: {
  entry: Entry
  nameCol: "employee" | "site"
  role: string
  accessibleSites: string[]
  onAdjust: (e: Entry) => void
}) {
  const locked     = isPayrollLocked(entry, role)
  const adjustable = canAdjustEntry(entry, role, accessibleSites)
  const altRole    = entry.shiftJobRole !== entry.defaultJobRole

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{entry.dateLabel}</td>
      <td className="py-2.5 pl-6 pr-4 text-sm">
        <span>{nameCol === "employee" ? entry.employeeName : entry.siteName}</span>
        {nameCol === "site" && entry.siteArchived && (
          <span className="ml-1.5 text-xs text-muted-foreground">(archived)</span>
        )}
        {altRole && <span className="ml-1.5 text-xs text-muted-foreground">({entry.shiftJobRole})</span>}
      </td>
      <td className="px-4 py-2.5 font-mono text-sm">{entry.clockIn}</td>
      <td className="px-4 py-2.5 font-mono text-sm">{entry.clockOut}</td>
      <td className="px-4 py-2.5 tabular-nums text-sm">{entry.totalHours}h</td>
      <td className="px-4 py-2.5 tabular-nums text-sm">£{entry.payRate.toFixed(2)}</td>
      <td className="py-2.5 pl-6 pr-4">
        <div className="flex gap-1">
          {entry.isAdjusted && (
            <Badge variant="info">Adjusted</Badge>
          )}
          {entry.isAutoClockOut && (
            <Badge variant="warning">Auto Clock-Out</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end">
          {adjustable ? (
            <TimesheetRowActionMenu onAdjust={() => onAdjust(entry)} />
          ) : locked ? (
            <div title="Payroll period is closed. Worked hours from the previous month can no longer be adjusted."
              className="flex size-7 cursor-help items-center justify-center rounded-md text-muted-foreground/40">
              <Lock className="size-3.5" />
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

// ─── Group section ───────────────────────────────────────────────────────────────

function GroupSection({ label, sublabel, entries, nameCol, role, accessibleSites, onAdjust }: {
  label: string
  sublabel?: string
  entries: Entry[]
  nameCol: "employee" | "site"
  role: string
  accessibleSites: string[]
  onAdjust: (e: Entry) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const groupHours = entries.reduce((s, e) => s + e.totalHours, 0)
  const hasLocked  = entries.some(e => isPayrollLocked(e, role))

  const COLS = ["Date", nameCol === "employee" ? "Employee" : "Site", "Clock in", "Clock out", "Hours", "Pay rate", "Flags", ""]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setCollapsed(v => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 bg-muted/60 px-5 py-4 text-left transition-colors hover:bg-muted/80",
          !collapsed && "border-b border-border"
        )}>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
        <span className="text-base font-semibold leading-snug">{label}</span>
        {sublabel && <CodeBadge>{sublabel}</CodeBadge>}
        <div className="ml-auto flex items-center gap-1.5">
          <CodeBadge>{entries.length} {entries.length === 1 ? "entry" : "entries"}</CodeBadge>
          <CodeBadge>{groupHours}h</CodeBadge>
        </div>
        {hasLocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
            <Lock className="size-2.5" />Payroll closed
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {COLS.map((col, i) => (
                  <th key={col || "actions"} className={cn(
                    "whitespace-nowrap py-2 text-left text-xs font-medium text-muted-foreground",
                    (i === 1 || i === 6) ? "pl-6 pr-4" : "px-4"
                  )}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <TRow key={entry.id} entry={entry} nameCol={nameCol} role={role}
                  accessibleSites={accessibleSites} onAdjust={onAdjust} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────────

function isoWeekBounds(iso: string): [string, string] {
  const d = new Date(`${iso}T00:00:00`)
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() - (dow - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return [fmt(mon), fmt(sun)]
}

function fmtH(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

export default function TimesheetsPage() {
  const { role } = useRole()

  const [entries, setEntries]           = useState<Entry[]>(RAW_ENTRIES)
  const [viewMode, setViewMode]         = useState<ViewMode>("by-site")
  const [dateFrom, setDateFrom]         = useState("")
  const [dateTo, setDateTo]             = useState("")
  const [search, setSearch]             = useState("")
  const [siteFilter, setSiteFilter]     = useState<string[]>([])
  const [areaFilter, setAreaFilter]     = useState<string[]>([])
  const [empFilter, setEmpFilter]       = useState<string[]>([])
  const [flagFilter, setFlagFilter]     = useState<string[]>([])
  const [adjusting, setAdjusting]       = useState<Entry | null>(null)
  const [showExport, setShowExport]     = useState(false)
  const [groupPage, setGroupPage]       = useState(1)
  const [groupPerPage, setGroupPerPage] = useState(5)

  const canExport      = role === "super-admin" || role === "head-office"
  const showAreaFilter = role === "super-admin" || role === "head-office"
  const accessibleSites = ROLE_SITES[role] ?? []
  const titleGroupCount = viewMode === "by-site"
    ? new Set(entries.filter(e => accessibleSites.includes(e.siteId)).map(e => e.siteId)).size
    : new Set(entries.filter(e => accessibleSites.includes(e.siteId)).map(e => e.employeeId)).size

  useEffect(() => {
    setSiteFilter([])
    setAreaFilter([])
    setEmpFilter([])
    setDateFrom("")
    setDateTo("")
    setFlagFilter([])
  }, [role])

  useEffect(() => {
    setGroupPage(1)
  }, [search, dateFrom, dateTo, siteFilter, areaFilter, empFilter, flagFilter, viewMode])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter(e => accessibleSites.includes(e.siteId))
      .filter(e => !dateFrom || e.date >= dateFrom)
      .filter(e => !dateTo   || e.date <= dateTo)
      .filter(e => !q || (
        e.employeeName.toLowerCase().includes(q) ||
        e.taid.toLowerCase().includes(q) ||
        e.siteName.toLowerCase().includes(q) ||
        e.siteCode.includes(q)
      ))
      .filter(e => !siteFilter.length || siteFilter.includes(e.siteId))
      .filter(e => !areaFilter.length || areaFilter.includes(e.area))
      .filter(e => !empFilter.length  || empFilter.includes(e.employeeId))
      .filter(e => {
        if (flagFilter.length === 0) return true
        return flagFilter.some(f =>
          (f === "adjusted" && e.isAdjusted) ||
          (f === "auto-clock-out" && e.isAutoClockOut)
        )
      })
  }, [entries, accessibleSites, dateFrom, dateTo, search, siteFilter, areaFilter, empFilter, flagFilter])

  const SITE_ORDER = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23","s24","s25","s26","s27","s28","s29","s30","s31","s32","s33","s34","s35","s36","s37","s38","s39","s40"]
  const EMP_ORDER  = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","88","89","90","91","92","93","94","95","96","97","98","99","100","101","102","103","104","105","106","107","108","109","110","111","112","113","114","115","116","117","118","119","120","121","122","123","124"]

  const groups = useMemo(() => {
    if (viewMode === "by-site") {
      const map = new Map<string, Entry[]>()
      for (const e of filtered) {
        if (!map.has(e.siteId)) map.set(e.siteId, [])
        map.get(e.siteId)!.push(e)
      }
      return SITE_ORDER
        .filter(id => map.has(id))
        .map(id => {
          const es = map.get(id)!.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName))
          const f = es[0]
          return { key: id, label: f.siteName, sublabel: `SN-${f.siteCode}`, entries: es }
        })
    } else {
      const map = new Map<string, Entry[]>()
      for (const e of filtered) {
        if (!map.has(e.employeeId)) map.set(e.employeeId, [])
        map.get(e.employeeId)!.push(e)
      }
      return EMP_ORDER
        .filter(id => map.has(id))
        .map(id => {
          const es = map.get(id)!.sort((a, b) => a.date.localeCompare(b.date) || a.siteName.localeCompare(b.siteName))
          const f = es[0]
          return { key: id, label: f.employeeName, sublabel: f.taid, entries: es }
        })
    }
  }, [filtered, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalGroupPages = Math.max(1, Math.ceil(groups.length / groupPerPage))
  const safeGroupPage   = Math.min(groupPage, totalGroupPages)
  const paginatedGroups = groups.slice((safeGroupPage - 1) * groupPerPage, safeGroupPage * groupPerPage)

  function handleAdjustSave(id: string, clockIn: string, clockOut: string) {
    const newHours = calcHours(clockIn, clockOut)
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e
      return {
        ...e,
        clockIn,
        clockOut,
        totalHours: newHours,
        isAdjusted: true,
        originalClockIn:  e.originalClockIn  ?? e.clockIn,
        originalClockOut: e.originalClockOut ?? e.clockOut,
      }
    }))
    setAdjusting(null)
  }

  const accessibleSitesList = SITES_LIST.filter(s => accessibleSites.includes(s.id))
  const accessibleAreas     = [...new Set(accessibleSitesList.map(s => s.area))]
  const anyFilter           = !!(search || dateFrom || dateTo || siteFilter.length > 0 || areaFilter.length > 0 || empFilter.length > 0 || flagFilter.length > 0)

  const siteOptions = accessibleSitesList.map(s => ({ value: s.id, label: s.name, sublabel: `SN-${s.code}` }))
  const areaOptions = accessibleAreas.map(a => ({ value: a, label: `${a} Area` }))
  const empOptions  = EMPLOYEES_LIST.map(em => ({ value: em.id, label: em.name, sublabel: em.taid }))

  const refDate = useMemo(() => {
    if (dateFrom) return dateFrom
    if (filtered.length === 0) return ""
    return filtered.reduce((m, e) => e.date > m ? e.date : m, filtered[0].date)
  }, [dateFrom, filtered])

  const { weeklyTotal, monthlyTotal } = useMemo(() => {
    if (!refDate) return { weeklyTotal: 0, monthlyTotal: 0 }
    const [weekStart, weekEnd] = isoWeekBounds(refDate)
    const refMonth = refDate.slice(0, 7)
    return {
      weeklyTotal:  filtered.filter(e => e.date >= weekStart && e.date <= weekEnd).reduce((s, e) => s + e.totalHours, 0),
      monthlyTotal: filtered.filter(e => e.month === refMonth).reduce((s, e) => s + e.totalHours, 0),
    }
  }, [filtered, refDate])

  function clearFilters() {
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setSiteFilter([])
    setAreaFilter([])
    setEmpFilter([])
    setFlagFilter([])
  }

  return (
    <PageShell
      title={`Timesheets (${titleGroupCount})`}
      description="Review and manage worked hours across all sites."
      action={
        canExport ? (
          <button type="button" onClick={() => setShowExport(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <Download className="size-4" />Export payroll
          </button>
        ) : undefined
      }
    >
      {/* View mode switcher — By Site / By Employee */}
      <div className="flex w-fit rounded-lg border border-border bg-muted/30 p-0.5">
        {([ ["by-site","By Site"], ["by-employee","By Employee"] ] as const).map(([val, label]) => (
          <button key={val} type="button" onClick={() => setViewMode(val)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              viewMode === val
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Filter controls — Search → Date range → Site → Area → Employee → Flags */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — matches Employees screen exactly */}
        <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm transition-colors hover:border-input-hover">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee, T&A ID, site…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Date range */}
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t) }} />

        {/* Site */}
        <MultiFilterDropdown label="Site" options={siteOptions} value={siteFilter} onChange={setSiteFilter} searchable searchPlaceholder="Search sites…" searchEmptyMessage="No sites found" />

        {/* Area (SA / HO only) */}
        {showAreaFilter && (
          <MultiFilterDropdown label="Area" options={areaOptions} value={areaFilter} onChange={setAreaFilter} />
        )}

        {/* Employee */}
        <MultiFilterDropdown label="Employee" options={empOptions} value={empFilter} onChange={setEmpFilter} align="right" searchable searchPlaceholder="Search employees…" searchEmptyMessage="No employees found" />

        {/* Flags — multi-select */}
        <MultiFilterDropdown label="Flags" options={FLAG_OPTIONS} value={flagFilter} onChange={setFlagFilter} align="right" />

        {/* Reset — visible when any filter active, matches Employees pattern */}
        {anyFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset filters
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable content: preserves min-width so the group headers and table never over-compress */}
      <div className="overflow-x-auto">
      <div className="min-w-[760px] flex flex-col gap-4">

      {/* Summary stats */}
      <div className="inline-flex self-start divide-x divide-border overflow-hidden rounded-xl border border-border bg-muted/40">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Weekly total</span>
          <span className="text-sm font-semibold tabular-nums">{fmtH(weeklyTotal)}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">Monthly total</span>
          <span className="text-sm font-semibold tabular-nums">{fmtH(monthlyTotal)}</span>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 py-16 text-center">
          <p className="font-medium text-muted-foreground">No timesheet entries found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {anyFilter ? "Try adjusting your search or filters." : "No entries match the current view."}
          </p>
          {anyFilter && (
            <button type="button" onClick={clearFilters}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-3 text-xs font-medium transition-colors hover:bg-accent">
              <RotateCcw className="size-3" />Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {paginatedGroups.map(g => (
            <GroupSection
              key={g.key}
              label={g.label}
              sublabel={g.sublabel}
              entries={g.entries}
              nameCol={viewMode === "by-site" ? "employee" : "site"}
              role={role}
              accessibleSites={accessibleSites}
              onAdjust={setAdjusting}
            />
          ))}

          {/* Pagination */}
          <div className="flex items-center gap-4 py-3">
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={groupPerPage}
                  onChange={e => { setGroupPerPage(Number(e.target.value)); setGroupPage(1) }}
                  className="flex h-8 appearance-none rounded-md border border-input bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-colors hover:border-input-hover">
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">Groups per page</span>
            </div>

            <div className="flex-1" />

            <div className="flex shrink-0 items-center gap-3">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Page {safeGroupPage} of {totalGroupPages}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setGroupPage(1)} disabled={safeGroupPage === 1}
                  aria-label="First page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsLeft className="size-3.5" />
                </button>
                <button type="button" onClick={() => setGroupPage(p => Math.max(1, p - 1))} disabled={safeGroupPage === 1}
                  aria-label="Previous page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-3.5" />
                </button>
                {getPageWindow(safeGroupPage, totalGroupPages).map(n => (
                  <button key={n} type="button" onClick={() => setGroupPage(n)}
                    aria-label={`Page ${n}`}
                    aria-current={n === safeGroupPage ? "page" : undefined}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                      n === safeGroupPage
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-muted/50 text-muted-foreground hover:bg-accent"
                    )}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => setGroupPage(p => Math.min(totalGroupPages, p + 1))} disabled={safeGroupPage === totalGroupPages}
                  aria-label="Next page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="size-3.5" />
                </button>
                <button type="button" onClick={() => setGroupPage(totalGroupPages)} disabled={safeGroupPage === totalGroupPages}
                  aria-label="Last page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronsRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>{/* end min-w inner */}
      </div>{/* end overflow-x-auto */}

      {/* Dialogs */}
      <AdjustDialog
        open={!!adjusting} onClose={() => setAdjusting(null)}
        entry={adjusting} onSave={handleAdjustSave}
      />
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </PageShell>
  )
}
