"use client"
// v2
import { useState, useRef, useEffect, useMemo, Fragment } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  Loader2,
  EllipsisVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { PageShell } from "@/components/page-shell"
import { type EmployeeStatus, EMPLOYEE_STATUS_CONFIG, EmployeeStatusBadge } from "@/components/employee-status-badge"
import { EditEmployeeDialog } from "@/components/edit-employee-dialog"
import { AlertBox } from "@/components/modal-alert"

// ─── Types ────────────────────────────────────────────────────────────────────

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  taid: string
  status: EmployeeStatus
  jobRole: string
  payrollSC: string
  payrollSFM: string
}

type ImportRowAction = "create" | "update" | "skip"

type ImportRow = {
  row: number
  firstName: string
  lastName: string
  email: string
  jobRole: string
  payrollSC: string
  payrollSFM: string
  action: ImportRowAction
  reason: string
  updateNote: string
}

type ImportStep = "upload" | "analysing" | "review" | "processing" | "done"
type ImportResult = { created: number; updated: number; skipped: number }
type RowFilter = "all" | "create" | "update" | "skip"

const IMPORT_EMPTY_STATE: Record<RowFilter, { title: string; description: string }> = {
  all:    { title: "No employees to review",  description: "This file does not contain any employee records." },
  create: { title: "No employees to create",  description: "No new employee records were found in this file." },
  update: { title: "No employees to update",  description: "No existing employee records matched this file." },
  skip:   { title: "No skipped employees",    description: "No rows were skipped during validation." },
}
type ToastItem = { id: number; message: string; variant: "success" | "partial" | "error" }
type DemoScenario = {
  id: string
  label: string
  fileName: string
  emptyFile: boolean
  rows: ImportRow[]
  newEmployees: Employee[]
  updates: Array<{ email: string; changes: Partial<Employee> }>
}

// ─── Initial employee data ────────────────────────────────────────────────────

const INITIAL_EMPLOYEES: Employee[] = [
  // ── existing records (1–15) ────────────────────────────────────────────────
  { id: "1",   firstName: "James",    lastName: "Mitchell",    email: "james.mitchell@spectrumclean.co.uk",    taid: "TAA-0001", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-001",  payrollSFM: "SFM-001" },
  { id: "2",   firstName: "Sarah",    lastName: "Okonkwo",     email: "sarah.okonkwo@spectrumclean.co.uk",     taid: "TAA-0002", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-002",  payrollSFM: ""        },
  { id: "3",   firstName: "Daniel",   lastName: "Foster",      email: "daniel.foster@spectrumclean.co.uk",     taid: "TAA-0003", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "4",   firstName: "Aisha",    lastName: "Patel",       email: "aisha.patel@spectrumclean.co.uk",       taid: "TAA-0004", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-004",  payrollSFM: ""        },
  { id: "5",   firstName: "Tom",      lastName: "Wright",      email: "tom.wright@spectrumclean.co.uk",        taid: "TAA-0005", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "6",   firstName: "Maria",    lastName: "Santos",      email: "maria.santos@spectrumclean.co.uk",      taid: "TAA-0006", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-006",  payrollSFM: "SFM-006" },
  { id: "7",   firstName: "Kevin",    lastName: "Huang",       email: "kevin.huang@spectrumclean.co.uk",       taid: "TAA-0007", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-007",  payrollSFM: ""        },
  { id: "8",   firstName: "Priya",    lastName: "Singh",       email: "priya.singh@spectrumclean.co.uk",       taid: "TAA-0008", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-008",  payrollSFM: ""        },
  { id: "9",   firstName: "Luke",     lastName: "Adams",       email: "luke.adams@spectrumclean.co.uk",        taid: "TAA-0009", status: "invited",  jobRole: "Supervisor",     payrollSC: "",        payrollSFM: ""        },
  { id: "10",  firstName: "Emma",     lastName: "Clarke",      email: "emma.clarke@spectrumclean.co.uk",       taid: "TAA-0010", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-010",  payrollSFM: ""        },
  { id: "11",  firstName: "Robert",   lastName: "Taylor",      email: "robert.taylor@spectrumclean.co.uk",     taid: "TAA-0011", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-011",  payrollSFM: ""        },
  { id: "12",  firstName: "Fatima",   lastName: "Ahmed",       email: "fatima.ahmed@spectrumclean.co.uk",      taid: "TAA-0012", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-012",  payrollSFM: "SFM-012" },
  { id: "13",  firstName: "Callum",   lastName: "Robertson",   email: "callum.robertson@spectrumclean.co.uk",  taid: "TAA-0013", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-013",  payrollSFM: ""        },
  { id: "14",  firstName: "Yuki",     lastName: "Tanaka",      email: "yuki.tanaka@spectrumclean.co.uk",       taid: "TAA-0014", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "15",  firstName: "Grace",    lastName: "Mensah",      email: "grace.mensah@spectrumclean.co.uk",      taid: "TAA-0015", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-015",  payrollSFM: "SFM-015" },
  // ── active (16–78) ────────────────────────────────────────────────────────
  { id: "16",  firstName: "Sophie",   lastName: "Brown",       email: "sophie.brown@spectrumclean.co.uk",      taid: "TAA-0016", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-016",  payrollSFM: ""        },
  { id: "17",  firstName: "Mohammed", lastName: "Hassan",      email: "mohammed.hassan@spectrumclean.co.uk",   taid: "TAA-0017", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-017",  payrollSFM: "SFM-017" },
  { id: "18",  firstName: "David",    lastName: "Cooper",      email: "david.cooper@spectrumclean.co.uk",      taid: "TAA-0018", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-018",  payrollSFM: ""        },
  { id: "19",  firstName: "Gemma",    lastName: "Bailey",      email: "gemma.bailey@spectrumclean.co.uk",      taid: "TAA-0019", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-019",  payrollSFM: ""        },
  { id: "20",  firstName: "Leon",     lastName: "Turner",      email: "leon.turner@spectrumclean.co.uk",       taid: "TAA-0020", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-020",  payrollSFM: ""        },
  { id: "21",  firstName: "Patricia", lastName: "Williams",    email: "patricia.williams@spectrumclean.co.uk", taid: "TAA-0021", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-021",  payrollSFM: "SFM-021" },
  { id: "22",  firstName: "Connor",   lastName: "Walsh",       email: "connor.walsh@spectrumclean.co.uk",      taid: "TAA-0022", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-022",  payrollSFM: ""        },
  { id: "23",  firstName: "Beatrice", lastName: "King",        email: "beatrice.king@spectrumclean.co.uk",     taid: "TAA-0023", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-023",  payrollSFM: ""        },
  { id: "24",  firstName: "Tariq",    lastName: "Hussain",     email: "tariq.hussain@spectrumclean.co.uk",     taid: "TAA-0024", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-024",  payrollSFM: "SFM-024" },
  { id: "25",  firstName: "Sandra",   lastName: "Phillips",    email: "sandra.phillips@spectrumclean.co.uk",   taid: "TAA-0025", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-025",  payrollSFM: ""        },
  { id: "26",  firstName: "Joseph",   lastName: "Campbell",    email: "joseph.campbell@spectrumclean.co.uk",   taid: "TAA-0026", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-026",  payrollSFM: ""        },
  { id: "27",  firstName: "Nadia",    lastName: "Carter",      email: "nadia.carter@spectrumclean.co.uk",      taid: "TAA-0027", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-027",  payrollSFM: "SFM-027" },
  { id: "28",  firstName: "Ryan",     lastName: "Morris",      email: "ryan.morris@spectrumclean.co.uk",       taid: "TAA-0028", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-028",  payrollSFM: ""        },
  { id: "29",  firstName: "Chloe",    lastName: "Bennett",     email: "chloe.bennett@spectrumclean.co.uk",     taid: "TAA-0029", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-029",  payrollSFM: ""        },
  { id: "30",  firstName: "Hassan",   lastName: "Ali",         email: "hassan.ali@spectrumclean.co.uk",        taid: "TAA-0030", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-030",  payrollSFM: ""        },
  { id: "31",  firstName: "Diane",    lastName: "Richardson",  email: "diane.richardson@spectrumclean.co.uk",  taid: "TAA-0031", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-031",  payrollSFM: ""        },
  { id: "32",  firstName: "Marcus",   lastName: "Powell",      email: "marcus.powell@spectrumclean.co.uk",     taid: "TAA-0032", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-032",  payrollSFM: ""        },
  { id: "33",  firstName: "Elena",    lastName: "Petrov",      email: "elena.petrov@spectrumclean.co.uk",      taid: "TAA-0033", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-033",  payrollSFM: ""        },
  { id: "34",  firstName: "Peter",    lastName: "Hughes",      email: "peter.hughes@spectrumclean.co.uk",      taid: "TAA-0034", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-034",  payrollSFM: ""        },
  { id: "35",  firstName: "Amy",      lastName: "Brooks",      email: "amy.brooks@spectrumclean.co.uk",        taid: "TAA-0035", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-035",  payrollSFM: ""        },
  { id: "36",  firstName: "Kofi",     lastName: "Mensah",      email: "kofi.mensah@spectrumclean.co.uk",       taid: "TAA-0036", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-036",  payrollSFM: "SFM-036" },
  { id: "37",  firstName: "Helen",    lastName: "Watson",      email: "helen.watson@spectrumclean.co.uk",      taid: "TAA-0037", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-037",  payrollSFM: ""        },
  { id: "38",  firstName: "Trevor",   lastName: "Grant",       email: "trevor.grant@spectrumclean.co.uk",      taid: "TAA-0038", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-038",  payrollSFM: ""        },
  { id: "39",  firstName: "Jasmine",  lastName: "Reid",        email: "jasmine.reid@spectrumclean.co.uk",      taid: "TAA-0039", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-039",  payrollSFM: ""        },
  { id: "40",  firstName: "Benson",   lastName: "Osei",        email: "benson.osei@spectrumclean.co.uk",       taid: "TAA-0040", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-040",  payrollSFM: "SFM-040" },
  { id: "41",  firstName: "Laura",    lastName: "Dixon",       email: "laura.dixon@spectrumclean.co.uk",       taid: "TAA-0041", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-041",  payrollSFM: ""        },
  { id: "42",  firstName: "George",   lastName: "Fletcher",    email: "george.fletcher@spectrumclean.co.uk",   taid: "TAA-0042", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-042",  payrollSFM: ""        },
  { id: "43",  firstName: "Zara",     lastName: "Mohammed",    email: "zara.mohammed@spectrumclean.co.uk",     taid: "TAA-0043", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-043",  payrollSFM: ""        },
  { id: "44",  firstName: "Andre",    lastName: "Dubois",      email: "andre.dubois@spectrumclean.co.uk",      taid: "TAA-0044", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-044",  payrollSFM: ""        },
  { id: "45",  firstName: "Clare",    lastName: "Hawkins",     email: "clare.hawkins@spectrumclean.co.uk",     taid: "TAA-0045", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-045",  payrollSFM: ""        },
  { id: "46",  firstName: "Hannah",   lastName: "Hart",        email: "hannah.hart@spectrumclean.co.uk",       taid: "TAA-0046", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-046",  payrollSFM: ""        },
  { id: "47",  firstName: "Keith",    lastName: "Gibson",      email: "keith.gibson@spectrumclean.co.uk",      taid: "TAA-0047", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-047",  payrollSFM: "SFM-047" },
  { id: "48",  firstName: "Molly",    lastName: "Chambers",    email: "molly.chambers@spectrumclean.co.uk",    taid: "TAA-0048", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-048",  payrollSFM: ""        },
  { id: "49",  firstName: "Michael",  lastName: "Stone",       email: "michael.stone@spectrumclean.co.uk",     taid: "TAA-0049", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-049",  payrollSFM: ""        },
  { id: "50",  firstName: "Victoria", lastName: "Price",       email: "victoria.price@spectrumclean.co.uk",    taid: "TAA-0050", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-050",  payrollSFM: "SFM-050" },
  { id: "51",  firstName: "Dennis",   lastName: "Nkosi",       email: "dennis.nkosi@spectrumclean.co.uk",      taid: "TAA-0051", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-051",  payrollSFM: ""        },
  { id: "52",  firstName: "Fiona",    lastName: "Barker",      email: "fiona.barker@spectrumclean.co.uk",      taid: "TAA-0052", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-052",  payrollSFM: ""        },
  { id: "53",  firstName: "Ade",      lastName: "Adeyemi",     email: "ade.adeyemi@spectrumclean.co.uk",       taid: "TAA-0053", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-053",  payrollSFM: ""        },
  { id: "54",  firstName: "Julia",    lastName: "Marsh",       email: "julia.marsh@spectrumclean.co.uk",       taid: "TAA-0054", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-054",  payrollSFM: "SFM-054" },
  { id: "55",  firstName: "Nick",     lastName: "Freeman",     email: "nick.freeman@spectrumclean.co.uk",      taid: "TAA-0055", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-055",  payrollSFM: ""        },
  { id: "56",  firstName: "Rebecca",  lastName: "Lawson",      email: "rebecca.lawson@spectrumclean.co.uk",    taid: "TAA-0056", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-056",  payrollSFM: ""        },
  { id: "57",  firstName: "Darren",   lastName: "Page",        email: "darren.page@spectrumclean.co.uk",       taid: "TAA-0057", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-057",  payrollSFM: ""        },
  { id: "58",  firstName: "Katherine",lastName: "Fox",         email: "katherine.fox@spectrumclean.co.uk",     taid: "TAA-0058", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-058",  payrollSFM: ""        },
  { id: "59",  firstName: "Kwame",    lastName: "Asante",      email: "kwame.asante@spectrumclean.co.uk",      taid: "TAA-0059", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-059",  payrollSFM: ""        },
  { id: "60",  firstName: "Leah",     lastName: "Nicholls",    email: "leah.nicholls@spectrumclean.co.uk",     taid: "TAA-0060", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-060",  payrollSFM: ""        },
  { id: "61",  firstName: "Stewart",  lastName: "Hogg",        email: "stewart.hogg@spectrumclean.co.uk",      taid: "TAA-0061", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-061",  payrollSFM: ""        },
  { id: "62",  firstName: "Anna",     lastName: "Kowalski",    email: "anna.kowalski@spectrumclean.co.uk",     taid: "TAA-0062", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-062",  payrollSFM: ""        },
  { id: "63",  firstName: "Paul",     lastName: "Griffiths",   email: "paul.griffiths@spectrumclean.co.uk",    taid: "TAA-0063", status: "active",   jobRole: "Window Cleaner", payrollSC: "SC-063",  payrollSFM: ""        },
  { id: "64",  firstName: "Idris",    lastName: "Keita",       email: "idris.keita@spectrumclean.co.uk",       taid: "TAA-0064", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-064",  payrollSFM: "SFM-064" },
  { id: "65",  firstName: "Raj",      lastName: "Kumar",       email: "raj.kumar@spectrumclean.co.uk",         taid: "TAA-0065", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-065",  payrollSFM: ""        },
  { id: "66",  firstName: "Olivia",   lastName: "Nash",        email: "olivia.nash@spectrumclean.co.uk",       taid: "TAA-0066", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-066",  payrollSFM: ""        },
  { id: "67",  firstName: "Anthony",  lastName: "Martin",      email: "anthony.martin@spectrumclean.co.uk",    taid: "TAA-0067", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-067",  payrollSFM: "SFM-067" },
  { id: "68",  firstName: "Mia",      lastName: "Fitzgerald",  email: "mia.fitzgerald@spectrumclean.co.uk",    taid: "TAA-0068", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-068",  payrollSFM: ""        },
  { id: "69",  firstName: "Brendan",  lastName: "Kelly",       email: "brendan.kelly@spectrumclean.co.uk",     taid: "TAA-0069", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-069",  payrollSFM: ""        },
  { id: "70",  firstName: "Kenneth",  lastName: "Wright",      email: "kenneth.wright@spectrumclean.co.uk",    taid: "TAA-0070", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-070",  payrollSFM: ""        },
  { id: "71",  firstName: "Donna",    lastName: "Ross",        email: "donna.ross@spectrumclean.co.uk",        taid: "TAA-0071", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-071",  payrollSFM: ""        },
  { id: "72",  firstName: "Kwabena",  lastName: "Boateng",     email: "kwabena.boateng@spectrumclean.co.uk",   taid: "TAA-0072", status: "active",   jobRole: "Team Leader",    payrollSC: "SC-072",  payrollSFM: "SFM-072" },
  { id: "73",  firstName: "Ivan",     lastName: "Novak",       email: "ivan.novak@spectrumclean.co.uk",        taid: "TAA-0073", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-073",  payrollSFM: ""        },
  { id: "74",  firstName: "Francis",  lastName: "Doherty",     email: "francis.doherty@spectrumclean.co.uk",   taid: "TAA-0074", status: "active",   jobRole: "Supervisor",     payrollSC: "SC-074",  payrollSFM: ""        },
  { id: "75",  firstName: "Timothy",  lastName: "Walsh",       email: "timothy.walsh@spectrumclean.co.uk",     taid: "TAA-0075", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-075",  payrollSFM: ""        },
  { id: "76",  firstName: "Gabriel",  lastName: "Moreau",      email: "gabriel.moreau@spectrumclean.co.uk",    taid: "TAA-0076", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-076",  payrollSFM: ""        },
  { id: "77",  firstName: "Emeka",    lastName: "Chukwu",      email: "emeka.chukwu@spectrumclean.co.uk",      taid: "TAA-0077", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-077",  payrollSFM: ""        },
  { id: "78",  firstName: "Boris",    lastName: "Petrov",      email: "boris.petrov@spectrumclean.co.uk",      taid: "TAA-0078", status: "active",   jobRole: "Cleaner",        payrollSC: "SC-078",  payrollSFM: ""        },
  // ── invited (79–101) ──────────────────────────────────────────────────────
  { id: "79",  firstName: "Tendai",   lastName: "Moyo",        email: "tendai.moyo@spectrumclean.co.uk",       taid: "TAA-0079", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "80",  firstName: "Liam",     lastName: "Brennan",     email: "liam.brennan@spectrumclean.co.uk",      taid: "TAA-0080", status: "invited",  jobRole: "Supervisor",     payrollSC: "",        payrollSFM: ""        },
  { id: "81",  firstName: "Richard",  lastName: "Hammond",     email: "richard.hammond@spectrumclean.co.uk",   taid: "TAA-0081", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "82",  firstName: "Owen",     lastName: "Parry",       email: "owen.parry@spectrumclean.co.uk",        taid: "TAA-0082", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "83",  firstName: "Suki",     lastName: "Nakamura",    email: "suki.nakamura@spectrumclean.co.uk",     taid: "TAA-0083", status: "invited",  jobRole: "Team Leader",    payrollSC: "",        payrollSFM: ""        },
  { id: "84",  firstName: "Sam",      lastName: "Okafor",      email: "sam.okafor@spectrumclean.co.uk",        taid: "TAA-0084", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "85",  firstName: "Rosa",     lastName: "Delgado",     email: "rosa.delgado@spectrumclean.co.uk",      taid: "TAA-0085", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "86",  firstName: "Curtis",   lastName: "Bowen",       email: "curtis.bowen@spectrumclean.co.uk",      taid: "TAA-0086", status: "invited",  jobRole: "Window Cleaner", payrollSC: "",        payrollSFM: ""        },
  { id: "87",  firstName: "Yusuf",    lastName: "Diallo",      email: "yusuf.diallo@spectrumclean.co.uk",      taid: "TAA-0087", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "88",  firstName: "Charlotte",lastName: "Day",         email: "charlotte.day@spectrumclean.co.uk",     taid: "TAA-0088", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "89",  firstName: "Tasha",    lastName: "Butler",      email: "tasha.butler@spectrumclean.co.uk",      taid: "TAA-0089", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "90",  firstName: "Kwesi",    lastName: "Acheampong",  email: "kwesi.acheampong@spectrumclean.co.uk",  taid: "TAA-0090", status: "invited",  jobRole: "Supervisor",     payrollSC: "",        payrollSFM: ""        },
  { id: "91",  firstName: "Natasha",  lastName: "Patel",       email: "natasha.patel@spectrumclean.co.uk",     taid: "TAA-0091", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "92",  firstName: "Penny",    lastName: "Blackwood",   email: "penny.blackwood@spectrumclean.co.uk",   taid: "TAA-0092", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "93",  firstName: "Stacey",   lastName: "Coleman",     email: "stacey.coleman@spectrumclean.co.uk",    taid: "TAA-0093", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "94",  firstName: "Lorraine", lastName: "Burke",       email: "lorraine.burke@spectrumclean.co.uk",    taid: "TAA-0094", status: "invited",  jobRole: "Team Leader",    payrollSC: "",        payrollSFM: ""        },
  { id: "95",  firstName: "Beverley", lastName: "Nwosu",       email: "beverley.nwosu@spectrumclean.co.uk",    taid: "TAA-0095", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "96",  firstName: "Tracy",    lastName: "Okonjo",      email: "tracy.okonjo@spectrumclean.co.uk",      taid: "TAA-0096", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "97",  firstName: "Minh",     lastName: "Nguyen",      email: "minh.nguyen@spectrumclean.co.uk",       taid: "TAA-0097", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "98",  firstName: "Sheryl",   lastName: "Reeves",      email: "sheryl.reeves@spectrumclean.co.uk",     taid: "TAA-0098", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "99",  firstName: "Wendy",    lastName: "Osei",        email: "wendy.osei@spectrumclean.co.uk",        taid: "TAA-0099", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "100", firstName: "Jenny",    lastName: "Abara",       email: "jenny.abara@spectrumclean.co.uk",       taid: "TAA-0100", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  { id: "101", firstName: "Alison",   lastName: "Trent",       email: "alison.trent@spectrumclean.co.uk",      taid: "TAA-0101", status: "invited",  jobRole: "Cleaner",        payrollSC: "",        payrollSFM: ""        },
  // ── archived (102–124) ────────────────────────────────────────────────────
  { id: "102", firstName: "Marcus",   lastName: "Webb",        email: "marcus.webb@spectrumclean.co.uk",       taid: "TAA-0102", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-102",  payrollSFM: ""        },
  { id: "103", firstName: "Linda",    lastName: "Fraser",      email: "linda.fraser@spectrumclean.co.uk",      taid: "TAA-0103", status: "archived", jobRole: "Supervisor",     payrollSC: "SC-103",  payrollSFM: "SFM-103" },
  { id: "104", firstName: "Derek",    lastName: "Booth",       email: "derek.booth@spectrumclean.co.uk",       taid: "TAA-0104", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-104",  payrollSFM: ""        },
  { id: "105", firstName: "Pauline",  lastName: "Hughes",      email: "pauline.hughes@spectrumclean.co.uk",    taid: "TAA-0105", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-105",  payrollSFM: ""        },
  { id: "106", firstName: "Clive",    lastName: "Atkins",      email: "clive.atkins@spectrumclean.co.uk",      taid: "TAA-0106", status: "archived", jobRole: "Team Leader",    payrollSC: "SC-106",  payrollSFM: ""        },
  { id: "107", firstName: "Sharon",   lastName: "Hewitt",      email: "sharon.hewitt@spectrumclean.co.uk",     taid: "TAA-0107", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-107",  payrollSFM: ""        },
  { id: "108", firstName: "Gareth",   lastName: "Lloyd",       email: "gareth.lloyd@spectrumclean.co.uk",      taid: "TAA-0108", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-108",  payrollSFM: ""        },
  { id: "109", firstName: "Denise",   lastName: "Carpenter",   email: "denise.carpenter@spectrumclean.co.uk",  taid: "TAA-0109", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-109",  payrollSFM: ""        },
  { id: "110", firstName: "Ray",      lastName: "Summers",     email: "ray.summers@spectrumclean.co.uk",       taid: "TAA-0110", status: "archived", jobRole: "Supervisor",     payrollSC: "SC-110",  payrollSFM: "SFM-110" },
  { id: "111", firstName: "Tracey",   lastName: "Simmons",     email: "tracey.simmons@spectrumclean.co.uk",    taid: "TAA-0111", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-111",  payrollSFM: ""        },
  { id: "112", firstName: "Barry",    lastName: "Gordon",      email: "barry.gordon@spectrumclean.co.uk",      taid: "TAA-0112", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-112",  payrollSFM: ""        },
  { id: "113", firstName: "Judith",   lastName: "Blake",       email: "judith.blake@spectrumclean.co.uk",      taid: "TAA-0113", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-113",  payrollSFM: ""        },
  { id: "114", firstName: "Nigel",    lastName: "Pearson",     email: "nigel.pearson@spectrumclean.co.uk",     taid: "TAA-0114", status: "archived", jobRole: "Window Cleaner", payrollSC: "SC-114",  payrollSFM: ""        },
  { id: "115", firstName: "Angela",   lastName: "Curtis",      email: "angela.curtis@spectrumclean.co.uk",     taid: "TAA-0115", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-115",  payrollSFM: ""        },
  { id: "116", firstName: "Malcolm",  lastName: "Reid",        email: "malcolm.reid@spectrumclean.co.uk",      taid: "TAA-0116", status: "archived", jobRole: "Team Leader",    payrollSC: "SC-116",  payrollSFM: "SFM-116" },
  { id: "117", firstName: "Brenda",   lastName: "Walsh",       email: "brenda.walsh@spectrumclean.co.uk",      taid: "TAA-0117", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-117",  payrollSFM: ""        },
  { id: "118", firstName: "Roger",    lastName: "Hunt",        email: "roger.hunt@spectrumclean.co.uk",        taid: "TAA-0118", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-118",  payrollSFM: ""        },
  { id: "119", firstName: "Sandra",   lastName: "Pearce",      email: "sandra.pearce@spectrumclean.co.uk",     taid: "TAA-0119", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-119",  payrollSFM: ""        },
  { id: "120", firstName: "Colin",    lastName: "Griffith",    email: "colin.griffith@spectrumclean.co.uk",    taid: "TAA-0120", status: "archived", jobRole: "Supervisor",     payrollSC: "SC-120",  payrollSFM: ""        },
  { id: "121", firstName: "Debbie",   lastName: "Haig",        email: "debbie.haig@spectrumclean.co.uk",       taid: "TAA-0121", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-121",  payrollSFM: ""        },
  { id: "122", firstName: "Neil",     lastName: "Sutton",      email: "neil.sutton@spectrumclean.co.uk",       taid: "TAA-0122", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-122",  payrollSFM: ""        },
  { id: "123", firstName: "Christine",lastName: "Morgan",      email: "christine.morgan@spectrumclean.co.uk",  taid: "TAA-0123", status: "archived", jobRole: "Cleaner",        payrollSC: "SC-123",  payrollSFM: ""        },
  { id: "124", firstName: "Peter",    lastName: "Ramsay",      email: "peter.ramsay@spectrumclean.co.uk",      taid: "TAA-0124", status: "archived", jobRole: "Window Cleaner", payrollSC: "SC-124",  payrollSFM: ""        },
]

const JOB_ROLES = ["Cleaner", "Supervisor", "Team Leader", "Window Cleaner"]
const STATUS_ORDER: EmployeeStatus[] = ["invited", "active", "archived"]

function getPageWindow(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 1) return [1, 2, 3]
  if (current >= total) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
}

// ─── Demo scenarios (simulate different file-analysis results) ────────────────

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "mixed",
    label: "Mixed: creates, updates & skips",
    fileName: "employees-import.xlsx",
    emptyFile: false,
    rows: [
      { row: 2,  firstName: "Oliver", lastName: "Reed",           email: "oliver.reed@parkside.co.uk",          jobRole: "Cleaner",    payrollSC: "",         payrollSFM: "",        action: "create", reason: "",                                               updateNote: "" },
      { row: 3,  firstName: "Amara",  lastName: "Nwosu",          email: "amara.nwosu@brightcare.co.uk",         jobRole: "Team Leader",payrollSC: "",         payrollSFM: "SFM-101", action: "create", reason: "",                                               updateNote: "" },
      { row: 4,  firstName: "Ben",    lastName: "Hargreaves",     email: "ben.hargreaves@swiftclean.co.uk",      jobRole: "Cleaner",    payrollSC: "SC-101",   payrollSFM: "",        action: "create", reason: "",                                               updateNote: "" },
      { row: 5,  firstName: "Sarah",  lastName: "Okonkwo",        email: "sarah.okonkwo@spectrumclean.co.uk",    jobRole: "Supervisor", payrollSC: "",         payrollSFM: "",        action: "update", reason: "",                                               updateNote: "Job role → Supervisor" },
      { row: 6,  firstName: "James",  lastName: "Mitchell-Jones", email: "james.mitchell@spectrumclean.co.uk",   jobRole: "",           payrollSC: "",         payrollSFM: "",        action: "update", reason: "",                                               updateNote: "Last name → Mitchell-Jones" },
      { row: 7,  firstName: "",       lastName: "Harper",         email: "c.harper@brightcare.co.uk",            jobRole: "",           payrollSC: "",         payrollSFM: "",        action: "skip",   reason: "First name is required for a new employee.",     updateNote: "" },
      { row: 8,  firstName: "Lucy",   lastName: "Owen",           email: "notanemail@@",                          jobRole: "",           payrollSC: "",         payrollSFM: "",        action: "skip",   reason: "Enter a valid email address.",                   updateNote: "" },
      { row: 9,  firstName: "Oliver", lastName: "Reed",           email: "oliver.reed@parkside.co.uk",           jobRole: "Cleaner",    payrollSC: "",         payrollSFM: "",        action: "skip",   reason: "This email appears more than once in the file.", updateNote: "" },
      { row: 10, firstName: "Lisa",   lastName: "Tran",           email: "lisa.tran@swiftclean.co.uk",           jobRole: "Operative",  payrollSC: "",         payrollSFM: "",        action: "skip",   reason: "Job role does not exist.",                       updateNote: "" },
    ],
    newEmployees: [
      { id: "201", firstName: "Oliver", lastName: "Reed",       email: "oliver.reed@parkside.co.uk",     taid: "TAA-0201", status: "invited", jobRole: "Cleaner",     payrollSC: "",       payrollSFM: "" },
      { id: "202", firstName: "Amara",  lastName: "Nwosu",      email: "amara.nwosu@brightcare.co.uk",   taid: "TAA-0202", status: "invited", jobRole: "Team Leader", payrollSC: "",       payrollSFM: "SFM-101" },
      { id: "203", firstName: "Ben",    lastName: "Hargreaves", email: "ben.hargreaves@swiftclean.co.uk",taid: "TAA-0203", status: "invited", jobRole: "Cleaner",     payrollSC: "SC-101", payrollSFM: "" },
    ],
    updates: [
      { email: "sarah.okonkwo@spectrumclean.co.uk",  changes: { jobRole: "Supervisor" } },
      { email: "james.mitchell@spectrumclean.co.uk", changes: { lastName: "Mitchell-Jones" } },
    ],
  },
  {
    id: "valid",
    label: "All valid (creates only)",
    fileName: "new-employees.xlsx",
    emptyFile: false,
    rows: [
      { row: 2, firstName: "Chloe",  lastName: "Evans",    email: "chloe.evans@cleanpro.co.uk",   jobRole: "Supervisor",  payrollSC: "SC-201", payrollSFM: "",        action: "create", reason: "", updateNote: "" },
      { row: 3, firstName: "Dan",    lastName: "Murphy",   email: "dan.murphy@brightcare.co.uk",  jobRole: "Cleaner",     payrollSC: "",       payrollSFM: "",        action: "create", reason: "", updateNote: "" },
      { row: 4, firstName: "Emily",  lastName: "Zhao",     email: "emily.zhao@swiftclean.co.uk",  jobRole: "Cleaner",     payrollSC: "",       payrollSFM: "SFM-201", action: "create", reason: "", updateNote: "" },
      { row: 5, firstName: "George", lastName: "Williams", email: "g.williams@parkside.co.uk",    jobRole: "Team Leader", payrollSC: "",       payrollSFM: "",        action: "create", reason: "", updateNote: "" },
      { row: 6, firstName: "Hannah", lastName: "Patel",    email: "h.patel@cleanpro.co.uk",       jobRole: "Cleaner",     payrollSC: "SC-205", payrollSFM: "",        action: "create", reason: "", updateNote: "" },
    ],
    newEmployees: [
      { id: "211", firstName: "Chloe",  lastName: "Evans",    email: "chloe.evans@cleanpro.co.uk",   taid: "TAA-0211", status: "invited", jobRole: "Supervisor",  payrollSC: "SC-201", payrollSFM: "" },
      { id: "212", firstName: "Dan",    lastName: "Murphy",   email: "dan.murphy@brightcare.co.uk",  taid: "TAA-0212", status: "invited", jobRole: "Cleaner",     payrollSC: "",       payrollSFM: "" },
      { id: "213", firstName: "Emily",  lastName: "Zhao",     email: "emily.zhao@swiftclean.co.uk",  taid: "TAA-0213", status: "invited", jobRole: "Cleaner",     payrollSC: "",       payrollSFM: "SFM-201" },
      { id: "214", firstName: "George", lastName: "Williams", email: "g.williams@parkside.co.uk",    taid: "TAA-0214", status: "invited", jobRole: "Team Leader", payrollSC: "",       payrollSFM: "" },
      { id: "215", firstName: "Hannah", lastName: "Patel",    email: "h.patel@cleanpro.co.uk",       taid: "TAA-0215", status: "invited", jobRole: "Cleaner",     payrollSC: "SC-205", payrollSFM: "" },
    ],
    updates: [],
  },
  {
    id: "empty",
    label: "Empty file",
    fileName: "empty-file.xlsx",
    emptyFile: true,
    rows: [],
    newEmployees: [],
    updates: [],
  },
  {
    id: "missing-fields",
    label: "Missing required fields",
    fileName: "missing-fields.xlsx",
    emptyFile: false,
    rows: [
      { row: 2, firstName: "",      lastName: "Harper",  email: "c.harper@brightcare.co.uk",  jobRole: "Cleaner", payrollSC: "", payrollSFM: "", action: "skip",   reason: "First name is required for a new employee.",    updateNote: "" },
      { row: 3, firstName: "Lucy",  lastName: "",        email: "lucy.owen@swiftclean.co.uk", jobRole: "Cleaner", payrollSC: "", payrollSFM: "", action: "skip",   reason: "Last name is required for a new employee.",     updateNote: "" },
      { row: 4, firstName: "Mark",  lastName: "Young",   email: "",                           jobRole: "Cleaner", payrollSC: "", payrollSFM: "", action: "skip",   reason: "Email address is required for a new employee.", updateNote: "" },
      { row: 5, firstName: "Lucy",  lastName: "Owen",    email: "notanemail@@",               jobRole: "Cleaner", payrollSC: "", payrollSFM: "", action: "skip",   reason: "Enter a valid email address.",                  updateNote: "" },
      { row: 6, firstName: "Oliver",lastName: "Reed",    email: "oliver.reed@parkside.co.uk", jobRole: "Cleaner", payrollSC: "", payrollSFM: "", action: "create", reason: "",                                              updateNote: "" },
    ],
    newEmployees: [
      { id: "221", firstName: "Oliver", lastName: "Reed", email: "oliver.reed@parkside.co.uk", taid: "TAA-0221", status: "invited", jobRole: "Cleaner", payrollSC: "", payrollSFM: "" },
    ],
    updates: [],
  },
  {
    id: "duplicate-emails",
    label: "Duplicate emails in file",
    fileName: "duplicate-emails.xlsx",
    emptyFile: false,
    rows: [
      { row: 2, firstName: "Oliver", lastName: "Reed",    email: "oliver.reed@parkside.co.uk",        jobRole: "Cleaner",    payrollSC: "", payrollSFM: "", action: "create", reason: "",                                               updateNote: "" },
      { row: 3, firstName: "Oliver", lastName: "Reed",    email: "oliver.reed@parkside.co.uk",        jobRole: "Cleaner",    payrollSC: "", payrollSFM: "", action: "skip",   reason: "This email appears more than once in the file.", updateNote: "" },
      { row: 4, firstName: "Sarah",  lastName: "Okonkwo", email: "sarah.okonkwo@spectrumclean.co.uk", jobRole: "Supervisor", payrollSC: "", payrollSFM: "", action: "update", reason: "",                                               updateNote: "Job role → Supervisor" },
      { row: 5, firstName: "Sarah",  lastName: "Okonkwo", email: "sarah.okonkwo@spectrumclean.co.uk", jobRole: "Supervisor", payrollSC: "", payrollSFM: "", action: "skip",   reason: "This email appears more than once in the file.", updateNote: "" },
    ],
    newEmployees: [
      { id: "231", firstName: "Oliver", lastName: "Reed", email: "oliver.reed@parkside.co.uk", taid: "TAA-0231", status: "invited", jobRole: "Cleaner", payrollSC: "", payrollSFM: "" },
    ],
    updates: [
      { email: "sarah.okonkwo@spectrumclean.co.uk", changes: { jobRole: "Supervisor" } },
    ],
  },
  {
    id: "payroll-dups",
    label: "Duplicate Payroll IDs",
    fileName: "payroll-errors.xlsx",
    emptyFile: false,
    rows: [
      { row: 2, firstName: "Oliver", lastName: "Reed",       email: "oliver.reed@parkside.co.uk",    jobRole: "Cleaner",    payrollSC: "SC-NEW-1",  payrollSFM: "",          action: "create", reason: "",                                                                  updateNote: "" },
      { row: 3, firstName: "Amara",  lastName: "Nwosu",      email: "amara.nwosu@brightcare.co.uk",  jobRole: "Team Leader",payrollSC: "SC-NEW-1",  payrollSFM: "",          action: "skip",   reason: "Payroll ID (SC) SC-NEW-1 is used more than once in this file.",     updateNote: "" },
      { row: 4, firstName: "Ben",    lastName: "Hargreaves", email: "ben.hargreaves@swiftclean.co.uk",jobRole: "Cleaner",   payrollSC: "",          payrollSFM: "SFM-NEW-1", action: "create", reason: "",                                                                  updateNote: "" },
      { row: 5, firstName: "Chloe",  lastName: "Evans",      email: "chloe.evans@cleanpro.co.uk",    jobRole: "Supervisor", payrollSC: "",          payrollSFM: "SFM-NEW-1", action: "skip",   reason: "Payroll ID (SFM) SFM-NEW-1 is used more than once in this file.",   updateNote: "" },
      { row: 6, firstName: "Dan",    lastName: "Murphy",     email: "dan.murphy@brightcare.co.uk",   jobRole: "Cleaner",    payrollSC: "SC-001",    payrollSFM: "",          action: "skip",   reason: "Payroll ID (SC) SC-001 is already assigned to an existing employee.", updateNote: "" },
    ],
    newEmployees: [
      { id: "241", firstName: "Oliver", lastName: "Reed",       email: "oliver.reed@parkside.co.uk",    taid: "TAA-0241", status: "invited", jobRole: "Cleaner",    payrollSC: "SC-NEW-1",  payrollSFM: "" },
      { id: "242", firstName: "Ben",    lastName: "Hargreaves", email: "ben.hargreaves@swiftclean.co.uk",taid: "TAA-0242", status: "invited", jobRole: "Cleaner",    payrollSC: "",          payrollSFM: "SFM-NEW-1" },
    ],
    updates: [],
  },
  {
    id: "invalid-roles",
    label: "Invalid roles & update not found",
    fileName: "invalid-roles.xlsx",
    emptyFile: false,
    rows: [
      { row: 2, firstName: "Lisa",   lastName: "Tran",  email: "lisa.tran@swiftclean.co.uk",   jobRole: "Operative", payrollSC: "",     payrollSFM: "", action: "skip",   reason: "Job role does not exist.",                              updateNote: "" },
      { row: 3, firstName: "Jack",   lastName: "Mills", email: "jack.mills@brightcare.co.uk",  jobRole: "??",        payrollSC: "",     payrollSFM: "", action: "skip",   reason: "Invalid value in 'Job role': '??'.",                    updateNote: "" },
      { row: 4, firstName: "",       lastName: "",      email: "unknown.user@example.com",     jobRole: "",          payrollSC: "SC-999",payrollSFM: "",action: "skip",   reason: "No existing employee found with this email address.",   updateNote: "" },
      { row: 5, firstName: "Oliver", lastName: "Reed",  email: "oliver.reed@parkside.co.uk",   jobRole: "Cleaner",   payrollSC: "",     payrollSFM: "", action: "create", reason: "",                                                      updateNote: "" },
    ],
    newEmployees: [
      { id: "251", firstName: "Oliver", lastName: "Reed", email: "oliver.reed@parkside.co.uk", taid: "TAA-0251", status: "invited", jobRole: "Cleaner", payrollSC: "", payrollSFM: "" },
    ],
    updates: [],
  },
]

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {firstName[0]}{lastName[0]}
    </div>
  )
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3 shrink-0" />{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
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

// ─── Import action badge ──────────────────────────────────────────────────────

function ImportActionBadge({ action, hasIssue }: { action: ImportRowAction; hasIssue?: boolean }) {
  const map: Record<ImportRowAction, { label: string; cls: string }> = {
    create: { label: "Create",  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" },
    update: { label: "Update",  cls: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20" },
    skip:   { label: "Skipped", cls: "bg-muted text-muted-foreground ring-1 ring-inset ring-border" },
  }
  const { label, cls } = map[action]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      {action === "skip" && hasIssue && <AlertCircle className="size-3 shrink-0" />}
      {label}
    </span>
  )
}

// ─── Dialog primitive ─────────────────────────────────────────────────────────

function Dialog({
  open, onClose, title, children, footer, maxWidth = "max-w-lg", lockClose = false,
}: {
  open: boolean; onClose: () => void; title: React.ReactNode
  children: React.ReactNode; footer?: React.ReactNode
  maxWidth?: string; lockClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockClose) onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
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

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium min-w-72 max-w-sm",
          t.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
          t.variant === "partial" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
          t.variant === "error"   && "border-destructive/20 bg-destructive/5 text-destructive"
        )}>
          {t.variant === "success" && <CheckCircle2 className="size-4 shrink-0" />}
          {(t.variant === "partial" || t.variant === "error") && <AlertCircle className="size-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── File upload area ─────────────────────────────────────────────────────────

function FileUploadArea({
  fileName, fileError, onFile, onRemove,
}: {
  fileName: string; fileError: string
  onFile: (name: string) => void; onRemove: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (fileName) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        fileError ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"
      )}>
        <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fileName}</p>
          {fileError
            ? <p className="text-xs text-destructive">{fileError}</p>
            : <p className="text-xs text-muted-foreground">Ready to analyse</p>
          }
        </div>
        <button type="button" onClick={onRemove}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f.name) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/40"
        )}
      >
        <Upload className="mb-3 size-6 text-muted-foreground/60" />
        <p className="text-sm font-medium">Drop your Excel file here</p>
        <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
      </div>
      <input ref={inputRef} type="file" accept=".xlsx" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f.name) }} />
      {fileError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3 shrink-0" />{fileError}
        </div>
      )}
    </div>
  )
}

// ─── Import employees dialog ──────────────────────────────────────────────────

function ImportEmployeesDialog({
  open, onClose, onImportComplete,
}: {
  open: boolean
  onClose: () => void
  onImportComplete: (
    result: ImportResult,
    newEmployees: Employee[],
    updates: Array<{ email: string; changes: Partial<Employee> }>
  ) => void
}) {
  const [step, setStep]               = useState<ImportStep>("upload")
  const [scenarioId, setScenarioId]   = useState("mixed")
  const [fileName, setFileName]       = useState(() => DEMO_SCENARIOS[0].fileName)
  const [fileError, setFileError]     = useState("")
  const [rowFilter, setRowFilter]     = useState<RowFilter>("all")
  const [result, setResult]           = useState<ImportResult | null>(null)
  const [showSkipped, setShowSkipped] = useState(false)
  const [progress, setProgress]       = useState(0)

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId) ?? DEMO_SCENARIOS[0]
  const activeRows     = activeScenario.rows

  useEffect(() => {
    if (step === "processing") {
      const t = setTimeout(() => setProgress(88), 50)
      return () => clearTimeout(t)
    }
    setProgress(0)
  }, [step])

  function reset() {
    setStep("upload"); setFileName(""); setFileError("")
    setRowFilter("all"); setResult(null); setShowSkipped(false)
    setScenarioId("mixed"); setProgress(0)
  }

  function handleClose() {
    if (step === "processing") return
    reset(); onClose()
  }

  function handleFile(name: string) {
    setScenarioId("mixed")
    setFileName(name)
    setFileError(name.toLowerCase().endsWith(".xlsx")
      ? ""
      : "Unsupported file format. Please upload an Excel file (.xlsx).")
  }

  function handleScenarioSelect(id: string) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === id)
    if (!scenario) return
    setScenarioId(id)
    setFileName(scenario.fileName)
    setFileError(scenario.emptyFile
      ? "The uploaded file contains no data. Please check the file and try again."
      : "")
  }

  function handleContinue() {
    if (!fileName || fileError) return
    setStep("analysing")
    setTimeout(() => setStep("review"), 1500)
  }

  function handleImport() {
    const r: ImportResult = {
      created: activeRows.filter((r) => r.action === "create").length,
      updated: activeRows.filter((r) => r.action === "update").length,
      skipped: activeRows.filter((r) => r.action === "skip").length,
    }
    setStep("processing")
    setTimeout(() => { setResult(r); setStep("done") }, 1800)
  }

  function handleDone() {
    if (result) onImportComplete(result, activeScenario.newEmployees, activeScenario.updates)
    reset(); onClose()
  }

  const creates     = activeRows.filter((r) => r.action === "create").length
  const updates     = activeRows.filter((r) => r.action === "update").length
  const skipped     = activeRows.filter((r) => r.action === "skip").length
  const validCount  = creates + updates
  const skippedRows = activeRows.filter((r) => r.action === "skip")

  const filteredRows = rowFilter === "all"
    ? activeRows
    : activeRows.filter((r) => r.action === rowFilter)

  const dialogTitle = {
    upload:     "Import employees",
    analysing:  "Import employees",
    review:     "Review employee import",
    processing: "Importing employees",
    done:       "Employee import complete",
  }[step]

  const dialogMaxWidth = step === "review" ? "max-w-[45rem]" : step === "done" ? "max-w-[40rem]" : "max-w-lg"

  const footer = step === "upload" ? (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={handleClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleContinue}
        disabled={!fileName || !!fileError}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Continue
      </button>
    </div>
  ) : step === "review" ? (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={() => { setStep("upload"); setRowFilter("all") }}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Back
      </button>
      <button type="button" onClick={handleClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Cancel
      </button>
      <button type="button" onClick={handleImport} disabled={validCount === 0}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Import {validCount > 0 ? `${validCount} employee${validCount !== 1 ? "s" : ""}` : "employees"}
      </button>
    </div>
  ) : step === "done" ? (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={handleClose}
        className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
        Close
      </button>
      <button type="button" onClick={handleDone}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
        Done
      </button>
    </div>
  ) : null

  return (
    <Dialog open={open} onClose={handleClose} title={dialogTitle}
      footer={footer} maxWidth={dialogMaxWidth} lockClose={step === "processing"}>

      {/* ── Upload (and analysing sub-state) ── */}
      {(step === "upload" || step === "analysing") && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file to create new employees or update existing records. Errors are flagged before any changes are applied.
          </p>

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

          {/* Demo scenario picker */}
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3">
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">Demo scenario</p>
            <div className="relative flex items-center">
              <select
                value={scenarioId}
                onChange={(e) => handleScenarioSelect(e.target.value)}
                disabled={step === "analysing"}
                className="flex h-8 appearance-none rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DEMO_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>
          </div>

          {step === "analysing" ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analysing file…</p>
            </div>
          ) : (
            <FileUploadArea
              fileName={fileName}
              fileError={fileError}
              onFile={handleFile}
              onRemove={() => { setFileName(""); setFileError(""); setScenarioId("mixed") }}
            />
          )}
        </div>
      )}

      {/* ── Review ── */}
      {step === "review" && (
        <div className="flex flex-col gap-5 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            New employees will be invited by email. Existing employees will be updated using only the values provided in the file.
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">{activeRows.length} row{activeRows.length !== 1 ? "s" : ""} in file</p>
            </div>
            <button type="button" onClick={() => { setStep("upload"); setRowFilter("all") }}
              className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline">
              Replace file
            </button>
          </div>

          {validCount === 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>No valid rows to import. All rows have been skipped. Correct the errors in your file and upload again.</p>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
            {([
              { key: "all",    label: `All (${activeRows.length})` },
              { key: "create", label: `Create (${creates})` },
              { key: "update", label: `Update (${updates})` },
              { key: "skip",   label: `Skipped (${skipped})` },
            ] as { key: RowFilter; label: string }[]).map((f) => (
              <button key={f.key} type="button" onClick={() => setRowFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  rowFilter === f.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-6 text-muted-foreground/40" aria-hidden="true" />
                        <p className="text-sm font-medium text-muted-foreground">{IMPORT_EMPTY_STATE[rowFilter].title}</p>
                        <p className="text-xs text-muted-foreground">{IMPORT_EMPTY_STATE[rowFilter].description}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.map((row) => {
                  const name = (row.firstName || row.lastName)
                    ? `${row.firstName} ${row.lastName}`.trim()
                    : "—"
                  const hasIssue = !!row.reason
                  return (
                    <tr key={row.row} className={cn(
                      "border-b border-border last:border-0",
                      row.action === "skip" && "opacity-70"
                    )}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{row.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.jobRole || "—"}</td>
                      <td className="px-4 py-3"><ImportActionBadge action={row.action} hasIssue={hasIssue} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Processing ── */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center gap-6 px-8 py-20">
          <Loader2 className="size-9 animate-spin text-primary" />
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-medium">Importing employees</p>
            <p className="text-sm text-muted-foreground">Processing your file. Please do not close this window.</p>
          </div>
          <div className="h-1 w-64 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[1600ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === "done" && result && (
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Import complete</p>
              <p className="text-sm text-muted-foreground">
                {result.created > 0 && "New employees have been invited by email. "}
                {result.updated > 0 && "Existing employee records have been updated."}
              </p>
            </div>
          </div>

          <div className="flex divide-x divide-border rounded-lg border border-border bg-card">
            {[
              { label: "Employees created", value: result.created, color: "text-emerald-700 dark:text-emerald-400" },
              { label: "Employees updated", value: result.updated, color: "text-blue-700 dark:text-blue-400" },
              { label: "Rows skipped",      value: result.skipped, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-4 py-3 text-center">
                <p className={cn("text-lg font-semibold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {result.skipped > 0 && (
            <div className="rounded-lg border border-border">
              <button type="button" onClick={() => setShowSkipped((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg">
                <span>View {result.skipped} skipped row{result.skipped !== 1 ? "s" : ""}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showSkipped && "rotate-180")} />
              </button>
              {showSkipped && (
                <div className="border-t border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedRows.map((row) => {
                        const name = (row.firstName || row.lastName)
                          ? `${row.firstName} ${row.lastName}`.trim()
                          : "—"
                        return (
                          <tr key={row.row} className="border-b border-border last:border-0 opacity-70">
                            <td className="px-4 py-3">
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">{row.email || "—"}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.jobRole || "—"}</td>
                            <td className="px-4 py-3">
                              <ImportActionBadge action="skip" hasIssue={!!row.reason} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

// ─── Create employee sheet ────────────────────────────────────────────────────

type CreateForm   = { firstName: string; lastName: string; email: string; jobRole: string }
type CreateErrors = Partial<Record<keyof CreateForm, string>>
type CreateStep   = "form" | "submitting" | "done"

function CreateEmployeeDialog({
  open, onClose, existingEmails,
}: {
  open: boolean; onClose: () => void; existingEmails: Set<string>
}) {
  const router = useRouter()
  const [step, setStep]   = useState<CreateStep>("form")
  const [form, setForm]   = useState<CreateForm>({ firstName: "", lastName: "", email: "", jobRole: "" })
  const [errors, setErrors] = useState<CreateErrors>({})
  const savedName = useRef("")

  function reset() {
    setStep("form"); setForm({ firstName: "", lastName: "", email: "", jobRole: "" }); setErrors({})
    savedName.current = ""
  }
  function handleClose() { reset(); onClose() }

  function field(key: keyof CreateForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }))
      setErrors((p) => ({ ...p, [key]: undefined }))
    }
  }

  function validate(): CreateErrors {
    const e: CreateErrors = {}
    if (!form.firstName.trim()) e.firstName = "First name is required."
    if (!form.lastName.trim())  e.lastName  = "Last name is required."
    if (!form.email.trim())     e.email = "Email address is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address."
    else if (existingEmails.has(form.email.trim().toLowerCase())) e.email = "An employee with this email address already exists."
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    savedName.current = `${form.firstName} ${form.lastName}`
    setStep("submitting")
    setTimeout(() => setStep("done"), 1500)
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create employee"
      footer={
        step === "form" ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
              Cancel
            </button>
            <button form="create-emp-form" type="submit"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
              Create employee
            </button>
          </div>
        ) : step === "done" ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
              Close
            </button>
            <button type="button" onClick={() => { handleClose(); router.push("/employees/1") }}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
              View employee profile
            </button>
          </div>
        ) : null
      }
    >
      {step === "form" && (
        <form id="create-emp-form" onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6" noValidate>
          <p className="text-sm text-muted-foreground">
            The employee will receive an invitation email with their T&A ID and PIN.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required error={errors.firstName}>
              <input type="text" value={form.firstName} onChange={field("firstName")}
                placeholder="Jane" className={inputCls(!!errors.firstName)} />
            </Field>
            <Field label="Last name" required error={errors.lastName}>
              <input type="text" value={form.lastName} onChange={field("lastName")}
                placeholder="Smith" className={inputCls(!!errors.lastName)} />
            </Field>
          </div>
          <Field label="Email address" required error={errors.email}>
            <input type="email" value={form.email} onChange={field("email")}
              placeholder="jane.smith@example.co.uk" className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Job role">
            <div className="relative">
              <select value={form.jobRole} onChange={field("jobRole")} className={cn(inputCls(), "appearance-none pr-8")}>
                <option value="">Cleaner (default)</option>
                {JOB_ROLES.filter((r) => r !== "Cleaner").map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground/70" />
            </div>
          </Field>
        </form>
      )}
      {step === "submitting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Creating employee…</p>
        </div>
      )}
      {step === "done" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold">Employee created</p>
            <p className="text-sm text-muted-foreground">
              {savedName.current} has been added with status Invited. An invitation email with their T&A ID and PIN has been sent to their registered address.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  )
}

// ─── Row action menu ─────────────────────────────────────────────────────────

function RowActionMenu({
  employee, onEdit, onArchive, onReinstate,
}: {
  employee: Employee
  onEdit: () => void
  onArchive: () => void
  onReinstate: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const items = Array.from(ref.current?.querySelectorAll('[role="menuitem"]') ?? []) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
        items[next]?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    setTimeout(() => {
      const first = ref.current?.querySelector('[role="menuitem"]') as HTMLElement | null
      first?.focus()
    }, 10)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  function pick(action: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
      action()
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={cn(
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-accent text-accent-foreground",
        )}
      >
        <EllipsisVertical className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {employee.status !== "archived" && (
            <button
              role="menuitem"
              type="button"
              onClick={pick(onEdit)}
              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
              Edit employee
            </button>
          )}
          {employee.status === "active" && (
            <div className="-mx-1 my-1 h-px bg-border" />
          )}
          {employee.status === "active" && (
            <button
              role="menuitem"
              type="button"
              onClick={pick(onArchive)}
              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <Archive className="size-3.5 shrink-0" />
              Archive employee
            </button>
          )}
          {employee.status === "archived" && (
            <button
              role="menuitem"
              type="button"
              onClick={pick(onReinstate)}
              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" />
              Reinstate employee
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Archive employee dialog ──────────────────────────────────────────────────

function ArchiveEmployeeDialog({
  open, onClose, employee, onConfirm,
}: {
  open: boolean; onClose: () => void; employee: Employee; onConfirm: () => void
}) {
  // Prototype: employee "1" (James Mitchell) has an open shift
  const hasActiveShift = employee.id === "1" && employee.status === "active"
  const [loading, setLoading] = useState(false)

  function handle() { setLoading(true); setTimeout(() => { setLoading(false); onConfirm() }, 1000) }

  return (
    <Dialog open={open} onClose={onClose} title="Archive employee"
      footer={
        hasActiveShift ? (
          <div className="flex justify-end">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Close
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </button>
            <button type="button" onClick={handle} disabled={loading}
              className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50">
              {loading ? "Archiving…" : "Archive employee"}
            </button>
          </div>
        )
      }>
      <div className="flex flex-col gap-4 p-6">
        {hasActiveShift ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Active shift must be closed first</p>
              <p className="mt-0.5 text-destructive/80">
                {employee.firstName} {employee.lastName} is currently clocked in. Close their active shift
                before archiving this employee.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Archiving <span className="font-medium text-foreground">{employee.firstName} {employee.lastName}</span> will
              immediately remove their access to the Spectrum Clean PWA. Their work history and pay rate data will be retained.
            </p>
            <AlertBox variant="warning" title="PWA access will be removed immediately.">
              If {employee.firstName} is currently clocked in, their shift will be closed at the time of archiving.
            </AlertBox>
          </>
        )}
      </div>
    </Dialog>
  )
}

// ─── Reinstate employee dialog ────────────────────────────────────────────────

function ReinstateEmployeeDialog({
  open, onClose, employee, onConfirm,
}: {
  open: boolean; onClose: () => void; employee: Employee; onConfirm: () => void
}) {
  const [loading, setLoading] = useState(false)
  function handle() { setLoading(true); setTimeout(() => { setLoading(false); onConfirm() }, 1000) }

  return (
    <Dialog open={open} onClose={onClose} title="Reinstate employee"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-input bg-muted/50 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
          <button type="button" onClick={handle} disabled={loading}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            {loading ? "Reinstating…" : "Reinstate employee"}
          </button>
        </div>
      }>
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Reinstating <span className="font-medium text-foreground">{employee.firstName} {employee.lastName}</span> will
          restore their status to Active and re-enable their PWA access using their existing credentials.
          All historical data will be preserved.
        </p>
      </div>
    </Dialog>
  )
}

// ─── Employees page ───────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const router = useRouter()
  const { role } = useRole()
  const canImport        = role === "super-admin" || role === "head-office"
  const canManageEmployee = role === "super-admin" || role === "head-office"

  const [employees, setEmployees]         = useState<Employee[]>(INITIAL_EMPLOYEES)
  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState<EmployeeStatus[]>([])
  const [page, setPage]                   = useState(1)
  const [perPage, setPerPage]             = useState(10)
  const [statusOpen, setStatusOpen]       = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [showImport, setShowImport]       = useState(false)
  const [toasts, setToasts]               = useState<ToastItem[]>([])
  const [editTarget, setEditTarget]       = useState<Employee | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null)
  const [reinstateTarget, setReinstateTarget] = useState<Employee | null>(null)
  const toastId = useRef(0)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  function addToast(message: string, variant: ToastItem["variant"]) {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }

  function handleImportComplete(
    result: ImportResult,
    newEmployees: Employee[],
    updates: Array<{ email: string; changes: Partial<Employee> }>
  ) {
    setEmployees((prev) => {
      const next = prev.map((emp) => {
        const upd = updates.find((u) => u.email === emp.email)
        return upd ? { ...emp, ...upd.changes } : emp
      })
      return [...next, ...newEmployees]
    })
    setStatusFilter([])
    setPage(1)
    const msg = result.skipped > 0 && result.created + result.updated > 0
      ? "Employee import completed with skipped rows."
      : result.created + result.updated > 0
      ? "Employee import completed successfully."
      : "The employee import could not be completed."
    const variant: ToastItem["variant"] = result.skipped > 0 && result.created + result.updated > 0
      ? "partial"
      : result.created + result.updated > 0
      ? "success"
      : "error"
    addToast(msg, variant)
  }

  function handleEditSave(updates: Partial<Employee>) {
    if (!editTarget) return
    setEmployees((prev) => prev.map((e) => e.id === editTarget.id ? { ...e, ...updates } : e))
    addToast(`${updates.firstName ?? editTarget.firstName} ${updates.lastName ?? editTarget.lastName} updated successfully.`, "success")
  }

  function handleArchiveConfirm() {
    if (!archiveTarget) return
    setEmployees((prev) => prev.map((e) => e.id === archiveTarget.id ? { ...e, status: "archived" } : e))
    addToast(`${archiveTarget.firstName} ${archiveTarget.lastName} has been archived.`, "success")
    setArchiveTarget(null)
  }

  function handleReinstateConfirm() {
    if (!reinstateTarget) return
    setEmployees((prev) => prev.map((e) => e.id === reinstateTarget.id ? { ...e, status: "active" } : e))
    addToast(`${reinstateTarget.firstName} ${reinstateTarget.lastName} has been reinstated.`, "success")
    setReinstateTarget(null)
  }

  function toggleStatus(s: EmployeeStatus) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  const existingEmails = new Set(employees.map((e) => e.email.toLowerCase()))

  const statusCounts = useMemo(() => ({
    active:   employees.filter((e) => e.status === "active").length,
    invited:  employees.filter((e) => e.status === "invited").length,
    archived: employees.filter((e) => e.status === "archived").length,
  }), [employees])

  const filtered = employees.filter((emp) => {
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(emp.status)
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q)
      || emp.taid.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const paged       = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
  const hasFilters  = statusFilter.length > 0 || search.trim() !== ""

  return (
    <>
      <PageShell
        title={`Employees (${employees.length})`}
        description="Manage your workforce across all areas and sites."
        action={
          <div className="flex items-center gap-2">
            {canImport && (
              <button type="button" onClick={() => setShowImport(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                <Upload className="size-4" />Import employees
              </button>
            )}
            <button type="button" onClick={() => setShowCreate(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Plus className="size-4" />Create employee
            </button>
          </div>
        }
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 px-3 text-sm">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or T&A ID…"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status faceted filter */}
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              aria-label="Filter employees by status"
              aria-expanded={statusOpen}
              onClick={() => setStatusOpen((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
                statusFilter.length > 0
                  ? "border-border bg-background text-foreground hover:bg-accent"
                  : "border-dashed border-input bg-background text-foreground hover:bg-accent"
              )}
            >
              <CirclePlus className="size-3.5 shrink-0 text-muted-foreground" />
              Status
              {statusFilter.length > 0 && (
                <>
                  <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
                  {STATUS_ORDER.filter((s) => statusFilter.includes(s)).map((s) => (
                    <EmployeeStatusBadge key={s} status={s} />
                  ))}
                </>
              )}
            </button>

            {statusOpen && (
              <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-border bg-background shadow-lg">
                <div className="p-1" role="group" aria-label="Filter by status">
                  {STATUS_ORDER.map((s) => {
                    const checked = statusFilter.includes(s)
                    return (
                      <label
                        key={s}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                          )}
                          aria-hidden
                        >
                          {checked && <Check className="size-2.5" />}
                        </div>
                        <span className="flex-1">{EMPLOYEE_STATUS_CONFIG[s].label}</span>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {statusCounts[s]}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStatus(s)}
                          aria-label={`Filter by ${EMPLOYEE_STATUS_CONFIG[s].label}`}
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
                {statusFilter.length > 0 && (
                  <>
                    <div className="border-t border-border" />
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => { setStatusFilter([]); setStatusOpen(false) }}
                        className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        Clear filters
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reset filters — visible only when a status is selected */}
          {statusFilter.length > 0 && (
            <button
              type="button"
              onClick={() => { setStatusFilter([]); setPage(1) }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset filters
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Table */}
        {paged.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "32%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">T&A ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((emp) => (
                  <tr key={emp.id} onClick={() => router.push(`/employees/${emp.id}`)}
                    className="group cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar firstName={emp.firstName} lastName={emp.lastName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium hover:underline">{emp.firstName} {emp.lastName}</p>
                          <p className="truncate text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{emp.taid}</td>
                    <td className="truncate px-4 py-3 text-muted-foreground">{emp.jobRole}</td>
                    <td className="px-4 py-3"><EmployeeStatusBadge status={emp.status} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        {canManageEmployee ? (
                          <RowActionMenu
                            employee={emp}
                            onEdit={() => setEditTarget(emp)}
                            onArchive={() => setArchiveTarget(emp)}
                            onReinstate={() => setReinstateTarget(emp)}
                          />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground/40" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-4 border-t border-border px-4 py-3">
              {/* Left: rows per page — shrink-0 so it never compresses */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative flex items-center">
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                    className="flex h-8 appearance-none rounded-md border border-input transition-colors hover:border-input-hover bg-muted/50 pl-2.5 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {[10, 20, 30, 40, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">Rows per page</span>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right: page label + navigation together */}
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
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex size-7 items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-3.5" />
                </button>
                {getPageWindow(currentPage, totalPages).map((n) => (
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
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-16 text-center">
            {hasFilters ? (
              <>
                <Search className="mb-3 size-8 text-muted-foreground/40" />
                <p className="font-medium">No employees match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search term or status filter.</p>
                <button type="button" onClick={() => { setSearch(""); setStatusFilter([]) }}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted/50 px-4 text-sm font-medium hover:bg-accent transition-colors">
                  <RotateCcw className="size-3.5" />Reset filters
                </button>
              </>
            ) : (
              <>
                <Users className="mb-3 size-8 text-muted-foreground/40" />
                <p className="font-medium">No employees yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add your first employee to get started.</p>
                <button type="button" onClick={() => setShowCreate(true)}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="size-4" />Create employee
                </button>
              </>
            )}
          </div>
        )}
      </PageShell>

      <CreateEmployeeDialog open={showCreate} onClose={() => setShowCreate(false)} existingEmails={existingEmails} />
      <ImportEmployeesDialog open={showImport} onClose={() => setShowImport(false)} onImportComplete={handleImportComplete} />
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {editTarget && (
        <EditEmployeeDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          employee={editTarget}
          onSave={handleEditSave}
        />
      )}
      {archiveTarget && (
        <ArchiveEmployeeDialog
          open={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          employee={archiveTarget}
          onConfirm={handleArchiveConfirm}
        />
      )}
      {reinstateTarget && (
        <ReinstateEmployeeDialog
          open={!!reinstateTarget}
          onClose={() => setReinstateTarget(null)}
          employee={reinstateTarget}
          onConfirm={handleReinstateConfirm}
        />
      )}
    </>
  )
}
