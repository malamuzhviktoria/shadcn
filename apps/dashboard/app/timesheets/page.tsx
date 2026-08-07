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
  { id:"t43", date:"2025-08-05", dateLabel:"Tue 5 Aug",  month:"2025-08", employeeId:"7",  employeeName:"Yusuf Idris",      taid:"TAA-0007", siteId:"s11", siteCode:"011", siteName:"Northgate House",   siteArchived:false, area:"North", shiftJobRole:"Cleaner",        defaultJobRole:"Cleaner",        clockIn:"07:30", clockOut:"15:30", totalHours:8,   payRate:11.00, isAdjusted:false, isAutoClockOut:false },
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
  { id:"s11", code:"011", name:"Northgate House",   area:"North" },
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
  { id:"16", name:"Nina Petrov",      taid:"TAA-0016" },
]

const ROLE_SITES: Record<string, string[]> = {
  "super-admin":  ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11"],
  "head-office":  ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11"],
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
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
                    Adjusted
                  </span>
                )}
                {entry.isAutoClockOut && (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    Auto Clock-Out
                  </span>
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
          <AlertBox variant="warning">
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
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
              Adjusted
            </span>
          )}
          {entry.isAutoClockOut && (
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Auto Clock-Out
            </span>
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
              <col style={{ width: "11%" }} />
              <col style={{ width: "24%" }} />
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

  const SITE_ORDER = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11"]
  const EMP_ORDER  = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"]

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
      title="Timesheets"
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
        <MultiFilterDropdown label="Site" options={siteOptions} value={siteFilter} onChange={setSiteFilter} />

        {/* Area (SA / HO only) */}
        {showAreaFilter && (
          <MultiFilterDropdown label="Area" options={areaOptions} value={areaFilter} onChange={setAreaFilter} />
        )}

        {/* Employee */}
        <MultiFilterDropdown label="Employee" options={empOptions} value={empFilter} onChange={setEmpFilter} align="right" />

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
          <div className="flex items-center gap-4 border-t border-border px-4 py-3">
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

      {/* Dialogs */}
      <AdjustDialog
        open={!!adjusting} onClose={() => setAdjusting(null)}
        entry={adjusting} onSave={handleAdjustSave}
      />
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </PageShell>
  )
}
