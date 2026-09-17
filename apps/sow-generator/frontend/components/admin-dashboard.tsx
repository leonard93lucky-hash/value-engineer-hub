"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, Trash2, Pencil, Zap, LogOut, RefreshCw,
  FileText, ChevronUp, ChevronDown, X, Save,
  AlertTriangle, CheckCircle2, Clock, Loader2, ChevronRight,
  CalendarDays, User, Building2, Settings, Package, Shield,
  Filter, BarChart3, Megaphone
} from "lucide-react"
import { UpdateNotesManager } from "@/components/update-notes-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { API_BASE_URL, LOGO_URL, ENV_TYPE_OPTIONS, formatDateIndo } from "@/lib/constants"

// ----- ADMIN ID → FRIENDLY NAME MAPPING -----
const ADMIN_DISPLAY_NAMES: Record<string, string> = {
  "zradm!n": "ZARADMIN",
  "estadm!n": "ESTADMIN",
};

function getAdminDisplayName(rawId?: string): string {
  if (!rawId) return "-"
  const lower = rawId.toLowerCase().trim()
  return ADMIN_DISPLAY_NAMES[lower] || rawId.toUpperCase()
}

// ----- REVISION DISPLAY: always 2 digits -----
function formatRevision(val?: string): string {
  if (val === undefined || val === null || val === "-" || val === "") return "-"
  const n = Number(val)
  if (isNaN(n)) return val
  return String(n).padStart(2, "0")
}

// ----- TYPES -----
interface SdkItem { sdk_type: string; merchant_key: string; username: string; password: string }
interface AppItem { app_name: string }

interface Submission {
  submission_id: string
  enterprise_name: string
  enterprise_initial: string
  merchant_name: string
  pic_ve_name: string
  pic_bd_name: string
  environment: string
  revision_number: string
  release_date: string
  status: "PENDING" | "GENERATED"
  submitted_at: string
  plan_stg?: string
  uat_date?: string
  plan_prod?: string
  live_on_market?: string
  stg_request?: string
  expected_approved?: string
  expected_deliver_stg?: string
  prod_request?: string
  expected_deliver_prod?: string
  rasp?: string
  rgb?: string
  nfc?: string;
  created_by?: string
  sdk_list?: SdkItem[] | string
  app_list?: AppItem[] | string
  product_config?: Record<string, any> | string
  nomor_surat?: string; // Khusus untuk data dari LOG_SURAT
  nomor_urut?: number; // Khusus urutan LOG_SURAT
  id_form?: string;
  created_at?: string;
  kategori?: string;
}

interface AdminDashboardProps {
  adminId: string
  onLogout: () => void
}

type SortKey = keyof Submission
type SortDir = "asc" | "desc"

function toInputDate(val?: string): string {
  if (!val || val === "-") return ""

  // Jika formatnya ISO (2026-04-08T00:00:00Z) atau string (2026-04-08)
  // Kita cuma ambil 10 karakter pertama: "2026-04-08"
  const clean = String(val).split("T")[0].split(" ")[0]

  // Pastikan formatnya YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean
  }

  return ""
}

// Helper parsing tanggal
function parseDateScore(d: string): number {
  if (!d) return 0
  if (d.includes("T")) return new Date(d).getTime()
  const parts = String(d).split(" ")
  if (parts.length >= 3) {
    const mmap: Record<string, string> = { "januari": "01", "februari": "02", "maret": "03", "april": "04", "mei": "05", "juni": "06", "juli": "07", "agustus": "08", "september": "09", "oktober": "10", "november": "11", "desember": "12" }
    const mo = mmap[parts[1].toLowerCase()]
    if (mo) {
      const timePart = parts[3] ? `T${parts[3]}Z` : "T00:00:00Z"
      return new Date(`${parts[2]}-${mo}-${parts[0].padStart(2, '0')}${timePart}`).getTime()
    }
  }
  return new Date(d).getTime() || 0
}

// ----- HELPER: Parse JSON field (sdk_list / product_config) -----
function parseJsonField<T>(val: T | string | undefined): T | null {
  if (!val) return null
  if (typeof val === "string") {
    try { return JSON.parse(val) as T } catch { return null }
  }
  return val as T
}

// ----- COMPONENT -----
export function AdminDashboard({ adminId, onLogout }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]) // SOW & API
  const [pendingCredentialSubmissions, setPendingCredentialSubmissions] = useState<Submission[]>([]) // CREDENTIAL
  const [generatedLogs, setGeneratedLogs] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")  // default: paling baru di atas
  const [selectedStatus, setSelectedStatus] = useState<"PENDING_SOW" | "PENDING_CREDENTIAL" | "GENERATED">("PENDING_SOW")

  // Date Filter state
  const [filterMode, setFilterMode] = useState<"all" | "year" | "month" | "7days">("all")
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [filterKategori, setFilterKategori] = useState<"all" | "sdk_liveness" | "api_privypass" | "credential">("all")
  const [filterDocType, setFilterDocType] = useState<"all" | "sow_api" | "credential">("all")

  // State panels
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Submission>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  // Generate / Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [updateManagerOpen, setUpdateManagerOpen] = useState(false)
  const prevPendingCount = useRef<number>(0)

  // ----- FETCH -----
  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!adminId) return; // JANGAN LANJUT KALAU ID KOSONG

    if (!silent) setIsLoading(true)
    try {
      console.log("DEBUG: Mengirim request dengan ID:", adminId); // Tambahkan ini buat cek di Console
      const headers = { "X-Admin-Id": adminId, "Content-Type": "application/json" }
      const [resSow, resCred] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/submissions`, { headers }),
        fetch(`${API_BASE_URL}/admin/credential-submissions`, { headers })
      ])

      if (resSow.status === 403 || resCred.status === 403) {
        toast.error("Admin Session Expired", { description: "Please logout and log in again." })
        return
      }

      if (!resSow.ok || !resCred.ok) throw new Error("Failed to fetch data.")

      const dataSow = await resSow.json()
      const dataCred = await resCred.json()

      const pendingList: Submission[] = dataSow.pending_submissions || []
      // generated_logs already includes credential logs (kategori: "credential") merged by backend
      const generatedList: Submission[] = dataSow.generated_logs || []

      // Data credential pending — ONLY from PENDING_CREDENTIAL sheet (separate API)
      const pendingCredList: Submission[] = (dataCred.pending_credentials || []).map((c: any) => ({
        ...c,
        status: "PENDING",
        kategori: "credential"
      }))

      const currentPendingCount = pendingList.length + pendingCredList.length

      if (silent && currentPendingCount > prevPendingCount.current) {
        toast.info("New form data from Value Engineer has arrived!", {
          description: "Please check the PENDING tab.",
          duration: 10000,
        })
      }
      prevPendingCount.current = currentPendingCount
      setSubmissions([...pendingList, ...pendingCredList, ...generatedList])
      setPendingSubmissions(pendingList)
      setPendingCredentialSubmissions(pendingCredList)
      setGeneratedLogs(generatedList)
    } catch (err: any) {
      if (!silent) toast.error("Error", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    if (adminId) { // Hanya jalankan jika adminId sudah ada
      fetchSubmissions()
      const interval = setInterval(() => fetchSubmissions(true), 60000)
      return () => clearInterval(interval)
    }
  }, [fetchSubmissions, adminId])

  // ----- FILTER & SORT -----
  // Gunakan array yang sudah dipisah berdasarkan tab aktif — tidak perlu filter status lagi
  const activeList = selectedStatus === "PENDING_SOW" ? pendingSubmissions
    : selectedStatus === "PENDING_CREDENTIAL" ? pendingCredentialSubmissions
      : generatedLogs

  // Date filter helper
  const applyDateFilter = (list: Submission[]): Submission[] => {
    if (filterMode === "all") return list
    const now = new Date()
    return list.filter(s => {
      const raw = s.submitted_at || ""
      const ts = parseDateScore(raw)
      if (!ts) return true
      const d = new Date(ts)
      if (filterMode === "7days") {
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return d >= sevenDaysAgo
      }
      if (filterMode === "year") {
        return d.getFullYear() === Number(filterYear)
      }
      if (filterMode === "month") {
        return d.getFullYear() === Number(filterYear) && (d.getMonth() + 1) === Number(filterMonth)
      }
      return true
    })
  }

  const dateFilteredList = applyDateFilter(activeList)
  // Filtered generated logs untuk stats breakdown kategori
  const dateFilteredGenerated = applyDateFilter(generatedLogs)

  const filtered = dateFilteredList
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      const safeInclude = (val?: string) => val ? String(val).toLowerCase().includes(q) : false
      return (
        safeInclude(s.enterprise_name) ||
        safeInclude(s.merchant_name) ||
        safeInclude(s.pic_ve_name) ||
        safeInclude(s.submission_id) ||
        safeInclude(s.enterprise_initial) ||
        safeInclude(s.nomor_surat)
      )
    })
    .filter(s => {
      // Filter kategori (only applies on Pending SOW tab)
      if (selectedStatus !== "GENERATED") {
        if (filterKategori === "all") return true
        if (filterKategori === "api_privypass") return s.kategori === "api_privypass"
        if (filterKategori === "credential") return s.kategori === "credential"
        return s.kategori !== "api_privypass" && s.kategori !== "credential"
      }
      // Filter doc type (only applies on Generated tab)
      if (filterDocType === "credential") return s.kategori === "credential"
      if (filterDocType === "sow_api") return s.kategori !== "credential"
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortKey] ?? ""
      const bVal = b[sortKey] ?? ""

      // Untuk tab GENERATED: default sort by nomor_urut dan tahun
      if (selectedStatus === "GENERATED" && sortKey === "submitted_at") {
        const timeA = parseDateScore(String(a.submitted_at))
        const timeB = parseDateScore(String(b.submitted_at))
        const yearA = new Date(timeA).getFullYear() || 0
        const yearB = new Date(timeB).getFullYear() || 0

        if (yearA !== yearB) {
          return sortDir === "asc" ? yearA - yearB : yearB - yearA
        }

        const numA = Number(a.nomor_urut) || 0
        const numB = Number(b.nomor_urut) || 0
        return sortDir === "asc" ? numA - numB : numB - numA
      }

      if (sortKey === "submitted_at") {
        const aTime = parseDateScore(String(aVal))
        const bTime = parseDateScore(String(bVal))
        return sortDir === "asc" ? aTime - bTime : bTime - aTime
      }

      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  // ----- EDIT -----
  const startEdit = (sub: Submission) => {
    setDetailId(null)
    setEditingId(sub.submission_id)

    // Autofill / Rekomendasi Initial Enterprise dari data sebelumnya (jika belum ada)
    let recommendedInitial = sub.enterprise_initial
    if (!recommendedInitial || !recommendedInitial.trim()) {
      const match = submissions.find(s =>
        s.merchant_name?.toLowerCase().trim() === sub.merchant_name?.toLowerCase().trim() &&
        s.enterprise_initial &&
        s.enterprise_initial.trim() !== ""
      )
      if (match) {
        recommendedInitial = match.enterprise_initial.trim()
        toast.info("Initial recommendation found!", {
          description: `Initial '${recommendedInitial}' is suggested based on Merchant name '${sub.merchant_name}'.`
        })
      }
    }

    // Konversi semua field tanggal ke format YYYY-MM-DD untuk input[type=date]
    setEditForm({
      ...sub,
      enterprise_initial: recommendedInitial,
      release_date: toInputDate(sub.release_date),
      plan_stg: toInputDate(sub.plan_stg),
      uat_date: toInputDate(sub.uat_date),
      plan_prod: toInputDate(sub.plan_prod),
      live_on_market: toInputDate(sub.live_on_market),
      stg_request: toInputDate(sub.stg_request),
      expected_approved: toInputDate(sub.expected_approved),
      expected_deliver_stg: toInputDate(sub.expected_deliver_stg),
      prod_request: toInputDate(sub.prod_request),
      expected_deliver_prod: toInputDate(sub.expected_deliver_prod),
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    const toastId = toast.loading("Saving changes...")
    try {
      const ALLOWED_FIELDS = [
        "enterprise_initial", "enterprise_name", "merchant_name",
        "pic_ve_id", "pic_bd_id", "revision_number", "environment",
        "release_date", "plan_stg", "uat_date", "plan_prod",
        "live_on_market", "stg_request", "expected_approved",
        "expected_deliver_stg", "prod_request", "expected_deliver_prod",
        "rasp", "rgb", "nfc" // TAMBAHKAN "nfc" DI SINI
      ] as const

      const payload: Record<string, string> = {}
      ALLOWED_FIELDS.forEach(f => {
        const val = editForm[f as keyof Submission]
        if (val !== undefined && val !== null) {
          payload[f] = String(val)
        }
      })

      // Validasi Initial Merchant
      if (payload.enterprise_initial) {
        const checkInitial = payload.enterprise_initial.trim().toUpperCase()
        const existing = generatedLogs.find(g => g.enterprise_initial?.toUpperCase() === checkInitial)
        const currentSub = submissions.find(s => s.submission_id === editingId)
        const currentEntName = (payload.enterprise_name || currentSub?.enterprise_name || "").trim().toLowerCase()
        const currentMerchantName = (payload.merchant_name || currentSub?.merchant_name || "").trim().toLowerCase()

        const isTrueConflict = existing &&
          existing.enterprise_name?.trim().toLowerCase() !== currentEntName &&
          existing.merchant_name?.trim().toLowerCase() !== currentMerchantName

        if (isTrueConflict) {
          toast.warning(`Initial '${checkInitial}' is also used by '${existing.enterprise_name}'. Continuing to save...`, { id: toastId })
          // Tidak diblokir — admin yang menentukan apakah initial boleh digunakan untuk enterprise group yang sama
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/submissions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Id": adminId },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const e = await response.json()
        // Handle Pydantic validation error array
        const msg = Array.isArray(e.detail)
          ? e.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : (e.detail || "An error occurred")
        throw new Error(msg)
      }
      toast.success("Data updated successfully!", { id: toastId })

      // Optimistic update so user can immediately click Generate
      setSubmissions(prev => prev.map(s =>
        s.submission_id === editingId ? { ...s, ...payload } : s
      ))

      cancelEdit()
      fetchSubmissions(true)
    } catch (err: any) {
      toast.error("Update failed", { id: toastId, description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  // ----- DELETE -----
  const handleDelete = async (id: string, kategori?: string) => {
    const toastId = toast.loading("Deleting data...")
    try {
      // encodeURIComponent ensures slash-containing IDs (e.g. nomor_surat CRD-PRD/WKJ-006/...)
      // are passed safely. For credential-logs we use ?id= (query param) because path params
      // cannot reliably handle slashes across different proxies/runtimes.
      const encodedId = encodeURIComponent(id)
      let endpoint = `${API_BASE_URL}/admin/submissions/${encodedId}`
      if (selectedStatus === "GENERATED") {
        endpoint = kategori === "credential"
          ? `${API_BASE_URL}/admin/credential-logs?id=${encodedId}`   // query param — slash-safe
          : `${API_BASE_URL}/admin/logs/${encodedId}`                  // path param — ID has no slashes
      } else if (selectedStatus === "PENDING_CREDENTIAL") {
        endpoint = `${API_BASE_URL}/admin/credential-pending/${encodedId}`
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "X-Admin-Id": adminId }
      })
      if (!response.ok) { const e = await response.json(); throw new Error(e.detail) }
      toast.success("Data deleted successfully.", { id: toastId })
      setConfirmDeleteId(null)
      if (detailId === id) setDetailId(null)
      fetchSubmissions(true)
    } catch (err: any) {
      toast.error("Delete failed", { id: toastId, description: err.message })
    }
  }

  // ----- GENERATE -----
  const handleGenerate = async (sub: Submission) => {
    if (!sub.enterprise_initial?.trim()) {
      toast.error("Merchant Initial not filled in!", {
        description: "Click edit and fill in the Initial (3 Char) first."
      })
      return
    }
    setGeneratingId(sub.submission_id)
    const isCredential = selectedStatus === "PENDING_CREDENTIAL"
    const toastMessage = isCredential ? "Processing Credential generation. Please wait..." : "Processing SOW generation. Please wait..."
    const toastId = toast.loading(toastMessage)
    try {
      const endpoint = isCredential
        ? `${API_BASE_URL}/admin/credential/generate/${sub.submission_id}`
        : `${API_BASE_URL}/admin/generate/${sub.submission_id}`

      const payload = isCredential && editForm.nomor_surat
        ? { nomor_surat_override: editForm.nomor_surat }
        : undefined

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "X-Admin-Id": adminId,
          ...(payload ? { "Content-Type": "application/json" } : {})
        },
        body: payload ? JSON.stringify(payload) : undefined
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail)
      toast.success("Document generated successfully!", {
        id: toastId,
        description: `${data.nomor_surat} — email has been sent.`,
        duration: 7000
      })
      fetchSubmissions(true)
    } catch (err: any) {
      toast.error("Generate failed", { id: toastId, description: err.message })
    } finally {
      setGeneratingId(null)
    }
  }

  // ----- TABLE HEADER -----
  const SortableTh = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field
          ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3 opacity-30" />}
      </div>
    </th>
  )

  // ----- STATUS BADGE -----
  const StatusBadge = ({ status }: { status: string }) => (
    status === "GENERATED"
      ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success-surface text-success border border-success/30">
        <CheckCircle2 className="w-3 h-3" /> Generated
      </span>
      : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-surface text-warning border border-warning/30">
        <Clock className="w-3 h-3" /> Pending
      </span>
  )

  // ----- RENDER -----
  return (
    <div className="h-screen bg-canvas flex flex-col font-sans overflow-hidden">
      {/* TOP BAR */}
      <header className="border-b border-border px-3 sm:px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-40 shadow-sm gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="hidden sm:inline text-sm font-semibold text-foreground truncate">Admin VE Support</span>
          <Badge className="hidden sm:inline-flex bg-danger-surface text-danger border-danger/30 text-[10px]">Dashboard</Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => fetchSubmissions()}
            className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 cursor-pointer px-2 sm:px-3">
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setUpdateManagerOpen(true)}
            className="text-muted-foreground hover:text-danger hover:bg-danger-surface h-8 w-8 cursor-pointer shrink-0"
            title="Manage Update Notes">
            <Megaphone className="w-4 h-4" />
          </Button>
        </div>
      </header>
      {/* MAIN — flex-col, overflow-hidden, fill remaining height */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden flex flex-col min-h-0">
        {/* 1. STATS — 1 row, 3 kolom */}
        {(() => {
          const filterLabel = filterMode === "all" ? "All Time"
            : filterMode === "7days" ? "Last 7 Days"
              : filterMode === "year" ? `Year ${filterYear}`
                : `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Number(filterMonth) - 1]} ${filterYear}`
          const sdkCount = dateFilteredGenerated.filter(l => l.kategori !== "api_privypass" && l.kategori !== "credential").length
          const apiCount = dateFilteredGenerated.filter(l => l.kategori === "api_privypass").length
          const credCount = dateFilteredGenerated.filter(l => l.kategori === "credential").length
          const totalGenerated = generatedLogs.length
          const totalPending = pendingSubmissions.length + pendingCredentialSubmissions.length
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-5">
              {/* Kolom 1: Pending */}
              <div className="bg-white border border-border rounded-xl p-2.5 sm:p-4 flex flex-col justify-center gap-0.5 sm:gap-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-warning">{totalPending}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pending</div>
                {pendingCredentialSubmissions.length > 0 && (
                  <div className="text-[9px] text-muted-foreground">
                    {pendingSubmissions.length} SOW/API · {pendingCredentialSubmissions.length} Cred
                  </div>
                )}
              </div>
              {/* Kolom 2: Generated */}
              <div className="bg-white border border-border rounded-xl p-2.5 sm:p-4 flex flex-col justify-center gap-0.5 sm:gap-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">{totalGenerated}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Generated</div>
                <div className="text-[9px] text-muted-foreground">
                  {sdkCount + apiCount} SOW/API · {credCount} Cred
                </div>
              </div>
              {/* Kolom 3: breakdown per doc type — desktop only */}
              <div className="hidden sm:flex flex-col gap-2">
                {/* SDK Liveness */}
                <div className="bg-white border border-border rounded-xl px-4 py-2 flex items-center gap-3 flex-1">
                  <Package className="w-4 h-4 text-info flex-shrink-0" />
                  <div className="flex items-baseline gap-2 min-w-0">
                    <div className="text-lg font-bold text-info leading-none">{sdkCount}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground truncate">SDK Liveness</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide truncate">{filterLabel}</div>
                  </div>
                </div>
                {/* API PrivyPass */}
                <div className="bg-white border border-border rounded-xl px-4 py-2 flex items-center gap-3 flex-1">
                  <Shield className="w-4 h-4 text-info flex-shrink-0" />
                  <div className="flex items-baseline gap-2 min-w-0">
                    <div className="text-lg font-bold text-info leading-none">{apiCount}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground truncate">API PrivyPass</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide truncate">{filterLabel}</div>
                  </div>
                </div>
                {/* Credential */}
                <div className="bg-white border border-border rounded-xl px-4 py-2 flex items-center gap-3 flex-1">
                  <Shield className="w-4 h-4 text-success flex-shrink-0" />
                  <div className="flex items-baseline gap-2 min-w-0">
                    <div className="text-lg font-bold text-success leading-none">{credCount}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground truncate">Credential</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide truncate">{filterLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* 2. FILTER & SEARCH AREA */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-5">
          {/* Row 1: Search + Status Tab */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by enterprise, merchant, initial, or letter number"
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white border-input text-foreground h-9 text-sm focus:ring-selection/30"
              />
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg border border-border w-full sm:w-auto overflow-x-auto">
              {(
                [
                  { key: "PENDING_SOW", label: "Pending (SOW/API)", shortLabel: "SOW/API" },
                  { key: "PENDING_CREDENTIAL", label: "Pending (Credential)", shortLabel: "Credential" },
                  { key: "GENERATED", label: "Generated", shortLabel: "Generated" }
                ] as const
              ).map(s => (
                <button key={s.key} onClick={() => setSelectedStatus(s.key as any)}
                  className={`px-2 sm:px-4 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-1 sm:flex-none ${selectedStatus === s.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    }`}>
                  <span className="sm:hidden">{s.shortLabel}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Row 2: Date + Kategori Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Time:</span>
            </div>
            {([
              { key: "all", label: "All" },
              { key: "7days", label: "7 Days" },
              { key: "month", label: "Month" },
              { key: "year", label: "Year" },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterMode(f.key)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${filterMode === f.key
                  ? "bg-danger-surface text-danger border-danger/30 shadow"
                  : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-canvas"
                  }`}
              >
                {f.label}
              </button>
            ))}
            {(filterMode === "year" || filterMode === "month") && (
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-white border border-input text-foreground text-xs rounded-md px-2 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-selection/40 cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={String(y)} className="bg-white text-foreground">{y}</option>
                ))}
              </select>
            )}
            {filterMode === "month" && (
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-white border border-input text-foreground text-xs rounded-md px-2 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-selection/40 cursor-pointer"
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((m, idx) => (
                  <option key={idx + 1} value={String(idx + 1)} className="bg-white text-foreground">{m}</option>
                ))}
              </select>
            )}
            {filterMode !== "all" && (
              <button
                onClick={() => setFilterMode("all")}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-muted mx-1" />

            {/* Filter Kategori — only on PENDING_SOW tab */}
            {selectedStatus === "PENDING_SOW" && (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Category:</span>
                </div>
                {([
                  { key: "all", label: "All" },
                  { key: "sdk_liveness", label: "SDK Liveness" },
                  { key: "api_privypass", label: "API PrivyPass" },
                ] as const).map(k => (
                  <button
                    key={k.key}
                    onClick={() => setFilterKategori(k.key as any)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${filterKategori === k.key
                        ? "bg-danger-surface text-danger border-danger/30 shadow"
                        : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-canvas"
                      }`}
                  >
                    {k.label}
                  </button>
                ))}
              </>
            )}

            {/* Filter Jenis Dokumen — only on GENERATED tab */}
            {selectedStatus === "GENERATED" && (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Type:</span>
                </div>
                {([
                  { key: "all", label: "All" },
                  { key: "sow_api", label: "SOW / API" },
                  { key: "credential", label: "Credential" },
                ] as const).map(k => (
                  <button
                    key={k.key}
                    onClick={() => setFilterDocType(k.key)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${filterDocType === k.key
                        ? "bg-danger-surface text-danger border-danger/30 shadow"
                        : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-canvas"
                      }`}
                  >
                    {k.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 3. TABLE WRAPPER (DESKTOP) — flex-1, overflow-hidden, hanya tbody yang scroll */}
        <div className="hidden md:flex flex-1 bg-white border border-border rounded-xl overflow-hidden flex-col shadow-sm min-h-0">
          {/* scrollable area: overflow-y-auto di sini */}
          <div className="overflow-auto flex-1
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar]:h-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-muted
              hover:[&::-webkit-scrollbar-thumb]:bg-border">

            {/* Kasih min-width agar kolom tidak dempet-dempetan */}
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-border bg-canvas sticky top-0 z-10 shadow-sm">
                  <th className="w-10 px-4 py-3" />
                  {selectedStatus === "GENERATED" ? (
                    <>
                      <SortableTh label="Created" field="submitted_at" />
                      <SortableTh label="Letter Number" field="nomor_surat" />
                      <SortableTh label="Enterprise" field="enterprise_name" />
                      <SortableTh label="Merchant" field="merchant_name" />
                      <SortableTh label="PIC VE" field="pic_ve_name" />
                      <SortableTh label="Rev" field="revision_number" />
                    </>
                  ) : (
                    <>
                      <SortableTh label="Date" field="submitted_at" />
                      <SortableTh label="Enterprise" field="enterprise_name" />
                      <SortableTh label="Initial" field="enterprise_initial" />
                      <SortableTh label="Merchant" field="merchant_name" />
                      <SortableTh label="PIC VE" field="pic_ve_name" />
                      <SortableTh label="Env" field="environment" />
                    </>
                  )}
                  <SortableTh label="Status" field="status" />
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm">Loading data...</div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <div className="text-sm">{search ? "No search results" : "No submissions yet"}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((sub) => (
                    <React.Fragment key={sub.submission_id}>
                      {editingId === sub.submission_id ? (
                        /* --- 1. MODE EDIT (INLINE) --- */
                        <EditRow
                          editForm={editForm}
                          onChange={setEditForm}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                          isSaving={isSaving}
                          allLogs={generatedLogs}
                          originalInitial={sub.enterprise_initial}
                        />
                      ) : sub.status === "GENERATED" ? (
                        /* --- 2. TAMPILAN BARIS GENERATED (LOG SURAT) --- */
                        <tr className="hover:bg-canvas transition-colors group border-l-2 border-input">
                          <td className="px-2 py-3 text-center">
                            <span className="text-muted-foreground/60 text-xs">-</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateIndo(sub.submitted_at || "")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-[10px] font-bold text-success bg-success-surface border border-success/30 px-2 py-1 rounded shadow-sm whitespace-nowrap">
                              {sub.nomor_surat}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-foreground">{sub.enterprise_name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{sub.enterprise_initial}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{sub.merchant_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{sub.pic_ve_name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center font-mono">
                            {formatRevision(sub.revision_number)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {confirmDeleteId === sub.submission_id ? (
                                <div className="flex items-center gap-1 bg-danger-surface p-0.5 rounded-lg border border-danger/30">
                                  <button onClick={() => handleDelete(sub.submission_id, sub.kategori)} className="px-2 py-1 text-danger text-[10px] font-bold hover:bg-danger hover:text-white rounded cursor-pointer">YES</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-muted-foreground text-[10px] hover:bg-muted rounded cursor-pointer">NO</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(sub.submission_id)}
                                  className="p-1.5 rounded-lg bg-danger-surface hover:bg-danger-surface text-danger border border-danger/30 transition-all cursor-pointer"
                                  title="Delete Log"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        /* --- 3. TAMPILAN BARIS PENDING (DRAFT) --- */
                        <tr className="hover:bg-canvas transition-colors group">
                          <td className="px-2 py-3">
                            <button
                              onClick={() => setDetailId(detailId === sub.submission_id ? null : sub.submission_id)}
                              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${detailId === sub.submission_id ? "rotate-90" : ""}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateIndo(sub.submitted_at?.split(" ")[0] || "")}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground text-sm">
                            {sub.enterprise_name}
                            <div className="text-[10px] text-muted-foreground font-normal">by {getAdminDisplayName(sub.created_by)}</div>
                          </td>
                          <td className="px-4 py-3">
                            {sub.enterprise_initial ? (
                              <span className="font-mono text-xs font-bold text-danger bg-danger-surface border border-danger/30 px-2 py-0.5 rounded">
                                {sub.enterprise_initial}
                              </span>
                            ) : (
                              <span className="text-[10px] italic text-warning/70 bg-warning-surface border border-warning/20 px-2 py-0.5 rounded">
                                Empty
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{sub.merchant_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{sub.pic_ve_name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sub.environment === "Production"
                              ? "bg-info-surface text-info border-info/30"
                              : "bg-info-surface text-info border-info/30"
                              }`}>
                              {sub.environment}
                            </span>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(sub)}
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleGenerate(sub)}
                                disabled={!!generatingId}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold px-2 ${sub.enterprise_initial?.trim()
                                  ? "bg-success-surface hover:bg-success-surface text-success border border-success/30"
                                  : "bg-canvas text-muted-foreground/60 border border-border cursor-not-allowed"
                                  }`}
                              >
                                {generatingId === sub.submission_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                GENERATE
                              </button>

                              {confirmDeleteId === sub.submission_id ? (
                                <div className="flex items-center gap-1 bg-danger-surface p-0.5 rounded-lg border border-danger/30">
                                  <button onClick={() => handleDelete(sub.submission_id, sub.kategori)} className="px-2 py-1 text-danger text-[10px] font-bold hover:bg-danger hover:text-white rounded cursor-pointer">YES</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-muted-foreground text-[10px] hover:bg-muted rounded cursor-pointer">NO</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(sub.submission_id)} className="p-1.5 rounded-lg bg-danger-surface hover:bg-danger-surface text-danger border border-danger/30 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* --- DETAIL PANEL (COLLAPSIBLE) --- */}
                      {detailId === sub.submission_id && editingId !== sub.submission_id && (
                        <tr>
                          <td colSpan={9} className="bg-canvas border-l-2 border-danger/50 px-6 py-6 shadow-inner">
                            <DetailPanel sub={sub} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3b. MOBILE CARD LIST — visible < md only */}
        <div className="md:hidden flex-1 overflow-auto min-h-0 space-y-3">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <div className="text-sm">Loading data...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-xl border border-border">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div className="text-sm">{search ? "No search results" : "No submissions yet"}</div>
            </div>
          ) : (
            filtered.map((sub) => (
              <div key={sub.submission_id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${sub.status === "GENERATED" ? "border-success/30" : "border-border"}`}>
                {editingId === sub.submission_id ? (
                  /* --- MOBILE: INLINE EDIT FORM --- */
                  <div className="p-4 bg-danger-surface border-l-4 border-danger/50 space-y-3">
                    <div className="text-[10px] font-bold text-danger uppercase tracking-widest mb-2">Editing Submission</div>
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Enterprise Name</Label>
                      <Input value={editForm.enterprise_name || ""} onChange={e => setEditForm({ ...editForm, enterprise_name: e.target.value })}
                        className="h-9 text-sm bg-white" placeholder="Enterprise Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Initial</Label>
                        <Input value={editForm.enterprise_initial || ""} onChange={e => setEditForm({ ...editForm, enterprise_initial: e.target.value.toUpperCase() })}
                          maxLength={3} className="h-9 text-sm font-mono uppercase bg-danger-surface border-danger/40 text-danger" placeholder="XXX" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Environment</Label>
                        <Select value={editForm.environment || "Staging"} onValueChange={v => setEditForm({ ...editForm, environment: v })}>
                          <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>{ENV_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Merchant Name</Label>
                      <Input value={editForm.merchant_name || ""} onChange={e => setEditForm({ ...editForm, merchant_name: e.target.value })}
                        className="h-9 text-sm bg-white" placeholder="Merchant Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Revision</Label>
                        <Input value={editForm.revision_number || ""} onChange={e => setEditForm({ ...editForm, revision_number: e.target.value })}
                          className="h-9 text-sm bg-white" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Release Date</Label>
                        <Input type="date" value={editForm.release_date || ""} onChange={e => setEditForm({ ...editForm, release_date: e.target.value })}
                          className="h-9 text-sm bg-white" />
                      </div>
                    </div>
                    <details className="bg-white rounded-md border border-border">
                      <summary className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">Timeline (tap to expand)</summary>
                      <div className="p-3 grid grid-cols-2 gap-2 border-t border-border">
                        {[
                          { label: "Plan STG", field: "plan_stg" as keyof Submission },
                          { label: "UAT", field: "uat_date" as keyof Submission },
                          { label: "Plan PROD", field: "plan_prod" as keyof Submission },
                          { label: "Live on Market", field: "live_on_market" as keyof Submission },
                          { label: "STG Request", field: "stg_request" as keyof Submission },
                          { label: "Expected Approved", field: "expected_approved" as keyof Submission },
                          { label: "Deliver STG", field: "expected_deliver_stg" as keyof Submission },
                          { label: "PROD Request", field: "prod_request" as keyof Submission },
                          { label: "Deliver PROD", field: "expected_deliver_prod" as keyof Submission },
                        ].map(({ label, field }) => (
                          <div key={field} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">{label}</Label>
                            <Input type="date"
                              value={editForm[field] !== undefined && editForm[field] !== null ? String(editForm[field]) : ""}
                              onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                              className="h-8 text-xs bg-white" />
                          </div>
                        ))}
                      </div>
                    </details>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-success hover:bg-[#1C4E30] text-white text-sm font-semibold disabled:opacity-60">
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                      </button>
                      <button onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : sub.status === "GENERATED" ? (
                  /* --- MOBILE: GENERATED CARD --- */
                  <div className="p-4 space-y-3 border-l-4 border-success/50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-success bg-success-surface border border-success/30 px-2 py-1 rounded break-all">
                        {sub.nomor_surat}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{sub.enterprise_name}</div>
                      <div className="text-[11px] text-muted-foreground">{sub.enterprise_initial}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Merchant</div>
                        <div className="text-foreground">{sub.merchant_name || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">PIC VE</div>
                        <div className="text-foreground">{sub.pic_ve_name || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Rev</div>
                        <div className="text-foreground font-mono">{formatRevision(sub.revision_number)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Created</div>
                        <div className="text-foreground">{formatDateIndo(sub.submitted_at || "")}</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-end">
                      {confirmDeleteId === sub.submission_id ? (
                        <div className="flex items-center gap-1 bg-danger-surface p-1 rounded-lg border border-danger/30">
                          <button onClick={() => handleDelete(sub.submission_id, sub.kategori)} className="px-3 py-1 text-danger text-xs font-bold hover:bg-danger hover:text-white rounded">YES, DELETE</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 text-muted-foreground text-xs hover:bg-muted rounded">NO</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(sub.submission_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-surface text-danger border border-danger/30 text-xs font-semibold">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* --- MOBILE: PENDING CARD --- */
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground break-words">{sub.enterprise_name}</div>
                        <div className="text-[10px] text-muted-foreground">by {getAdminDisplayName(sub.created_by)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={sub.status} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sub.environment === "Production" ? "bg-info-surface text-info border-info/30" : "bg-info-surface text-info border-info/30"}`}>
                          {sub.environment}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Initial</div>
                        {sub.enterprise_initial ? (
                          <span className="inline-block font-mono text-xs font-bold text-danger bg-danger-surface border border-danger/30 px-2 py-0.5 rounded mt-0.5">{sub.enterprise_initial}</span>
                        ) : (
                          <span className="inline-block text-[10px] italic text-warning bg-warning-surface border border-warning/30 px-2 py-0.5 rounded mt-0.5">Empty</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Merchant</div>
                        <div className="text-foreground">{sub.merchant_name || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">PIC VE</div>
                        <div className="text-foreground">{sub.pic_ve_name || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</div>
                        <div className="text-foreground">{formatDateIndo(sub.submitted_at?.split(" ")[0] || "")}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailId(detailId === sub.submission_id ? null : sub.submission_id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${detailId === sub.submission_id ? "rotate-90" : ""}`} />
                      {detailId === sub.submission_id ? "Hide details" : "Show details"}
                    </button>
                    {detailId === sub.submission_id && (
                      <div className="bg-canvas rounded-lg border border-border p-3">
                        <DetailPanel sub={sub} />
                      </div>
                    )}
                    <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                      <button onClick={() => startEdit(sub)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border text-xs font-semibold">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleGenerate(sub)} disabled={!!generatingId || !sub.enterprise_initial?.trim()}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center ${sub.enterprise_initial?.trim() ? "bg-success-surface text-success border border-success/30" : "bg-canvas text-muted-foreground/60 border border-border cursor-not-allowed"}`}>
                        {generatingId === sub.submission_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} GENERATE
                      </button>
                      {confirmDeleteId === sub.submission_id ? (
                        <div className="flex items-center gap-1 bg-danger-surface p-1 rounded-lg border border-danger/30">
                          <button onClick={() => handleDelete(sub.submission_id, sub.kategori)} className="px-2 py-1 text-danger text-xs font-bold hover:bg-danger hover:text-white rounded">YES</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-muted-foreground text-xs hover:bg-muted rounded">NO</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(sub.submission_id)}
                          className="flex items-center justify-center w-9 h-9 rounded-lg bg-danger-surface text-danger border border-danger/30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <Toaster position="top-right" richColors closeButton />
      <UpdateNotesManager adminId={adminId} open={updateManagerOpen} onClose={() => setUpdateManagerOpen(false)} />
    </div>
  )
}

// =====================================================
// DETAIL PANEL — Preview semua data submission
// =====================================================
function DetailPanel({ sub }: { sub: Submission }) {
  // Gunakan optional chaining (?.) agar tidak error jika field null
  const sdkList = parseJsonField<SdkItem[]>(sub.sdk_list) || []
  const appList = parseJsonField<AppItem[]>(sub.app_list) || []
  const productConfig = parseJsonField<Record<string, any>>(sub.product_config)

  const dateRow = (label: string, val?: string) => (
    <div className="space-y-0.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xs text-foreground font-medium">
        {val && val !== "-" ? val : <span className="text-muted-foreground/60 italic">—</span>}
      </div>
    </div>
  )

  const boolBadge = (val?: string | boolean) => {
    const isTrue = String(val).toLowerCase() === "true"
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isTrue ? "bg-success-surface text-success border-success/30" : "bg-muted text-muted-foreground border-border"
        }`}>{isTrue ? "Yes" : "No"}</span>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER KHUSUS JIKA SUDAH GENERATED */}
      {sub.status === "GENERATED" && (
        <div className="bg-success-surface border border-success/30 rounded-lg p-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-success/70 uppercase font-bold tracking-widest">Document Status</div>
            <div className="text-lg font-mono font-bold text-success">{sub.nomor_surat}</div>
          </div>
          <Badge className="bg-success text-white border-none">GENERATED</Badge>
        </div>
      )}

      {/* Row 1: Informasi Utama */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-3.5 h-3.5 text-danger" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Basic Information</span>
        </div>
        <div className="grid grid-cols-4 gap-x-8 gap-y-4 bg-canvas p-4 rounded-xl border border-border">
          {dateRow("Submission ID", sub.submission_id)}
          {dateRow("Enterprise Name", sub.enterprise_name)}
          {dateRow("Merchant Name", sub.merchant_name)}
          {dateRow("Environment", sub.environment)}
          {dateRow("PIC VE", sub.pic_ve_name)}
          {dateRow("PIC BD", sub.pic_bd_name)}
          {dateRow("Revision", sub.revision_number)}
          {dateRow("Initial Merchant", sub.enterprise_initial || "Not Set")}

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">RASP / RGB</div>
            <div className="flex gap-2">
              {boolBadge(sub.rasp)}
              {boolBadge(sub.rgb)}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Timeline (Hanya tampil jika ada datanya) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-3.5 h-3.5 text-info" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project Timeline</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {dateRow("Release Date", formatDateIndo(sub.release_date || ""))}
          {dateRow("Plan STG", formatDateIndo(sub.plan_stg || ""))}
          {dateRow("UAT", formatDateIndo(sub.uat_date || ""))}
          {dateRow("Plan PROD", formatDateIndo(sub.plan_prod || ""))}
          {dateRow("Live Market", formatDateIndo(sub.live_on_market || ""))}
        </div>
      </div>

      {/* Row 3: Product Config (PENTING: Gunakan pengecekan &&) */}
      {productConfig && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-3.5 h-3.5 text-info" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Configuration Preview</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-canvas rounded-lg p-3 border border-border">
              <div className="text-[10px] text-info font-bold mb-2 uppercase">Liveness Setup</div>
              <div className="text-xs text-muted-foreground">
                Threshold: {productConfig.basic?.livenessThreshold || "-"} <br />
                Providers: {Array.isArray(productConfig.basic?.livenessProviders) ? productConfig.basic.livenessProviders.join(", ") : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// EDIT ROW — inline edit dalam table
// =====================================================
function EditRow({
  editForm, onChange, onSave, onCancel, isSaving, allLogs, originalInitial
}: {
  editForm: Partial<Submission>
  onChange: (data: Partial<Submission>) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  allLogs: Submission[]
  originalInitial?: string
}) {
  const upd = (field: keyof Submission, val: string) => onChange({ ...editForm, [field]: val })

  return (
    <>
      {/* Row 1: field utama */}
      <tr className="bg-danger-surface border-l-2 border-danger/50">
        <td className="px-2 py-2" />
        <td className="px-4 py-2 text-xs text-muted-foreground">{editForm.submitted_at?.split(" ")[0] || "-"}</td>
        <td className="px-4 py-2">
          <Input value={editForm.enterprise_name || ""} onChange={e => upd("enterprise_name", e.target.value)}
            className="h-7 text-xs bg-white border-input text-foreground w-full" placeholder="Enterprise Name" />
        </td>
        <td className="px-4 py-2">
          {(() => {
            // Real-time conflict check: cari initial yang sama tapi merchant/enterprise BERBEDA
            const typedInitial = (editForm.enterprise_initial || "").trim().toUpperCase()
            const currentEntName = (editForm.enterprise_name || "").trim().toLowerCase()
            const currentMerchantName = (editForm.merchant_name || "").trim().toLowerCase()
            // Tidak tampilkan conflict jika initial tidak berubah dari nilai awal (autofill / sudah ada)
            const initialChanged = typedInitial !== (originalInitial || "").trim().toUpperCase()
            const conflict = typedInitial.length === 3 && initialChanged
              ? allLogs.find(g =>
                  g.enterprise_initial?.toUpperCase() === typedInitial &&
                  g.enterprise_name?.trim().toLowerCase() !== currentEntName &&
                  g.merchant_name?.trim().toLowerCase() !== currentMerchantName
                )
              : null
            return (
              <Tooltip open={!!conflict}>
                <TooltipTrigger asChild>
                  <Input
                    value={editForm.enterprise_initial || ""}
                    onChange={e => upd("enterprise_initial", e.target.value.toUpperCase())}
                    className={`h-7 text-xs font-mono w-20 uppercase ${
                      conflict
                        ? "bg-warning-surface border-warning/50 text-warning ring-1 ring-warning/40"
                        : "bg-danger-surface border-danger/40 text-danger"
                    }`}
                    placeholder="XXX"
                    maxLength={3}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-warning text-white border-0 text-[10px] leading-snug max-w-[160px]">
                  ⚠️ Initial <b>{typedInitial}</b> is already used by{" "}
                  <span className="font-semibold">{conflict?.enterprise_name}</span>.
                  Please use a different initial.
                </TooltipContent>
              </Tooltip>
            )
          })()}
        </td>
        <td className="px-4 py-2">
          <Input value={editForm.merchant_name || ""} onChange={e => upd("merchant_name", e.target.value)}
            className="h-7 text-xs bg-white border-input text-foreground w-full" placeholder="Merchant Name" />
        </td>
        <td className="px-4 py-2 text-xs text-muted-foreground">{editForm.pic_ve_name || "-"}</td>
        <td className="px-4 py-2">
          <Select value={editForm.environment || "Staging"} onValueChange={v => upd("environment", v)}>
            <SelectTrigger className="h-7 text-xs bg-white border-input text-foreground w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{ENV_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </td>
        <td className="px-4 py-2 text-xs text-muted-foreground">{editForm.status}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button onClick={onSave} disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success hover:bg-[#1C4E30] text-white text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
            <button onClick={onCancel}
              className="px-2 py-1.5 rounded-lg bg-muted hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-all cursor-pointer">
              Cancel
            </button>
          </div>
        </td>
      </tr>
      {/* Row 2: timeline fields */}
      <tr className="bg-danger-surface border-l-2 border-danger/40">
        <td colSpan={9} className="px-6 py-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Edit Timeline &amp; Configuration</div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Revision", field: "revision_number" as keyof Submission },
              { label: "Release Date", field: "release_date" as keyof Submission, type: "date" },
              { label: "Plan STG", field: "plan_stg" as keyof Submission, type: "date" },
              { label: "UAT", field: "uat_date" as keyof Submission, type: "date" },
              { label: "Plan PROD", field: "plan_prod" as keyof Submission, type: "date" },
              { label: "Live on Market", field: "live_on_market" as keyof Submission, type: "date" },
              { label: "STG Request", field: "stg_request" as keyof Submission, type: "date" },
              { label: "Expected Approved", field: "expected_approved" as keyof Submission, type: "date" },
              { label: "Deliver STG", field: "expected_deliver_stg" as keyof Submission, type: "date" },
              { label: "PROD Request", field: "prod_request" as keyof Submission, type: "date" },
              { label: "Deliver PROD", field: "expected_deliver_prod" as keyof Submission, type: "date" },
            ].map(({ label, field, type }) => (
              <div key={field} className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                <Input
                  type={type || "text"}
                  value={editForm[field] !== undefined && editForm[field] !== null ? String(editForm[field]) : ""}
                  onChange={e => upd(field, e.target.value)}
                  className="h-7 text-xs bg-white border-input text-foreground"
                />
              </div>
            ))}
          </div>
        </td>
      </tr>
    </>
  )
}
