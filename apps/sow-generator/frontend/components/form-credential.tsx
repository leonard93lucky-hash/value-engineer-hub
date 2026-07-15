"use client"

import React, { useState, useEffect } from "react"
import { FileText, Send, Loader2, ZoomIn, ZoomOut, ChevronRight, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/constants"
import { CredentialPreview } from "./credential-preview"

type ServiceCategory = "avengers" | "general" | "connect"
type SelectedService = { name: string; category: ServiceCategory }

// Service lists — dropdown display includes the "API " prefix, but the stored
// name (chip + document output) drops it. Strip via stripApiPrefix() below.
const AVENGERS_SERVICES = [
  "API OCR",
  "API User Verification",
  "API Liveness",
  "API NPWP Verification",
  "API Face Compare",
  "API Watchlist",
  "API Check Mothername",
  "API Telco Score",
  "API Phone Match",
  "API Phone Active",
  "API Location Verification",
  "API Social Economy Status",
  "API Recycle Number",
]

const GENERAL_SERVICES = [
  "API Registration",
  "API Upload Document",
  "API Check Mothername",
  "API Check Privy ID",
  "API Age Verification",
]

const CONNECT_SERVICES = [
  "API Registration",
  "API Upload Document",
]

const stripApiPrefix = (s: string) => s.replace(/^API\s+/i, "")
const SERVICES_BY_CATEGORY: Record<ServiceCategory, string[]> = {
  avengers: AVENGERS_SERVICES,
  general:  GENERAL_SERVICES,
  connect:  CONNECT_SERVICES,
}

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  avengers: "Avengers",
  general:  "General",
  connect:  "Connect",
}

const initialAvengersCredential = { username: "", password: "", merchant_key: "", url: "", channel_id: "" }
const initialGeneralCredential  = { username: "", password: "", api_key: "", secret_key: "", channel_id: "", enterprise_token: "", base_url: "", doc_owner: "", ip_address: "" }
const initialConnectCredential  = { username: "", password: "", merchant_key: "", enterprise_token: "", base_url: "" }

const initialFormData = {
  picVeId: "",
  enterpriseName: "",
  merchantName: "",
  environment: "Staging",
  revisionNumber: "00",
  createdDate: new Date().toISOString().split("T")[0],
}

interface FormCredentialProps {
  onLogout?: () => void
  currentUser?: any
  onBack?: () => void
}

export default function FormCredential({ onLogout, currentUser, onBack }: FormCredentialProps) {
  const [data, setData] = useState(initialFormData)
  const [listPicVe, setListPicVe] = useState<any[]>([])
  const [zoom, setZoom] = useState(0.9)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isIframe, setIsIframe] = useState(false)

  useEffect(() => {
    setIsIframe(window !== window.top)
  }, [])
  const [selectedServicesTemp, setSelectedServicesTemp] = useState<SelectedService[]>([])
  // 2-step dropdown: pick category, then pick sub-service (or Other → custom input)
  const [dropdownCategory, setDropdownCategory] = useState<ServiceCategory | "">("")
  const [dropdownSubService, setDropdownSubService] = useState<string>("")
  const [customServiceName, setCustomServiceName] = useState("")
  const [avengersCredential, setAvengersCredential] = useState({ ...initialAvengersCredential })
  const [generalCredential, setGeneralCredential]   = useState({ ...initialGeneralCredential })
  const [connectCredential, setConnectCredential]   = useState({ ...initialConnectCredential })

  useEffect(() => {
    if (data.environment === "Staging") {
      setData(prev => ({ ...prev, revisionNumber: "00" }))
    } else {
      setData(prev => ({ ...prev, revisionNumber: "01" }))
    }
  }, [data.environment])

  // Autofill General credentials when environment is Staging, clear when switching away
  useEffect(() => {
    if (data.environment === "Staging") {
      setGeneralCredential(prev => ({
        ...prev,
        base_url:         prev.base_url         || process.env.NEXT_PUBLIC_STAGING_BASE_URL         || "",
        ip_address:       prev.ip_address        || process.env.NEXT_PUBLIC_STAGING_IP_ADDRESS       || "",
        doc_owner:        prev.doc_owner         || process.env.NEXT_PUBLIC_STAGING_DOC_OWNER        || "",
        enterprise_token: prev.enterprise_token  || process.env.NEXT_PUBLIC_STAGING_ENTERPRISE_TOKEN || "",
      }))
    } else {
      setGeneralCredential(prev => ({
        ...prev,
        base_url:         "",
        ip_address:       "",
        doc_owner:        "",
        enterprise_token: "",
      }))
    }
  }, [data.environment])

  useEffect(() => {
    fetchMasterData()
  }, [])

  useEffect(() => {
    if (currentUser?.privy_id) {
      setData(prev => ({ ...prev, picVeId: currentUser.privy_id }))
    }
  }, [currentUser])

  const fetchMasterData = async () => {
    try {
      const url = currentUser?.id ? `${API_BASE_URL}/master-data?user_id=${encodeURIComponent(currentUser.id)}` : `${API_BASE_URL}/master-data`
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        if (result.pic_ve) setListPicVe(result.pic_ve)
      }
    } catch (err) { console.error(err) }
  }

  const handleChange = (field: string, value: any) => setData((prev) => ({ ...prev, [field]: value }))
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const isServicePicked = (category: ServiceCategory, name: string) =>
    selectedServicesTemp.some(s => s.category === category && s.name === name)

  // Picking a sub-service from the second dropdown:
  // - "Other" keeps the dropdown selection so the custom input shows below
  // - any other value strips the "API " prefix and adds it immediately
  const handleSubServicePick = (value: string) => {
    setDropdownSubService(value)
    if (!dropdownCategory || !value || value === "__OTHER__") return
    const name = stripApiPrefix(value)
    if (isServicePicked(dropdownCategory, name)) {
      toast.error("Service Already Added", { description: `'${name}' is already selected under ${CATEGORY_LABEL[dropdownCategory]}.` })
      setDropdownSubService("")
      return
    }
    setSelectedServicesTemp(prev => [...prev, { name, category: dropdownCategory }])
    setDropdownSubService("")
  }

  const removeService = (svc: SelectedService) => {
    setSelectedServicesTemp(prev => prev.filter(s => !(s.name === svc.name && s.category === svc.category)))
  }

  const addCustomService = () => {
    const name = customServiceName.trim()
    if (!name || !dropdownCategory) return
    if (isServicePicked(dropdownCategory, name)) {
      toast.error("Service Already Added", { description: `'${name}' is already selected under ${CATEGORY_LABEL[dropdownCategory]}.` })
      return
    }
    setSelectedServicesTemp(prev => [...prev, { name, category: dropdownCategory }])
    setCustomServiceName("")
    setDropdownSubService("")
  }

  const buildGroupedServices = (selected: SelectedService[]) => {
    const avengersSelected = selected.filter(s => s.category === "avengers").map(s => s.name)
    const generalSelected  = selected.filter(s => s.category === "general").map(s => s.name)
    const connectSelected  = selected.filter(s => s.category === "connect").map(s => s.name)
    const result: any[] = []
    if (avengersSelected.length > 0)
      result.push({ service_type: avengersSelected.join(", "), ...avengersCredential, avengers: true, general: false, connect: false })
    if (generalSelected.length > 0)
      result.push({ service_type: generalSelected.join(", "), ...generalCredential, avengers: false, general: true, connect: false })
    if (connectSelected.length > 0)
      result.push({ service_type: connectSelected.join(", "), ...connectCredential, avengers: false, general: false, connect: true })
    return result
  }

  const handleSubmit = async () => {
    if (!data.enterpriseName || !data.merchantName || selectedServicesTemp.length === 0) {
      toast.error("Data Incomplete", {
        description: "Enterprise, Merchant, and at least 1 Service are required.",
      })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Saving Credential Draft...")

    try {
      const payload = {
        pic_ve_id: data.picVeId,
        enterprise_name: data.enterpriseName,
        merchant_name: data.merchantName,
        enterprise_initial: "",
        environment: data.environment,
        revision_number: data.revisionNumber,
        created_date: data.createdDate,
        services: buildGroupedServices(selectedServicesTemp),
      }

      const response = await fetch(`${API_BASE_URL}/credential/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const e = await response.json()
        throw new Error(e.detail)
      }

      toast.success("Credential Draft Saved!", {
        id: toastId,
        description: "Credential draft successfully sent to the Admin queue.",
        duration: 5000,
      })

      setData({ ...initialFormData, picVeId: currentUser?.privy_id || "" })
      setSelectedServicesTemp([])
      setAvengersCredential({ ...initialAvengersCredential })
      setGeneralCredential({ ...initialGeneralCredential })
      setConnectCredential({ ...initialConnectCredential })

    } catch (err: any) {
      toast.error("Failed to Submit Data", {
        id: toastId,
        description: err.message || "An error occurred.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
      {/* --- LEFT PANEL: FORM --- */}
      <div className="w-full md:w-[500px] bg-white md:border-r flex flex-col z-10 shadow-xl h-full">
        {!isIframe && (
        <div className="p-5 border-b bg-white flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              title="Back to Product Selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <h2 className="flex items-center gap-2 font-bold text-gray-800 text-xl">
            <LockIcon className="w-6 h-6 text-emerald-500" /> Credential Document
          </h2>
        </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Basic Info</h3>
            
            <div className="space-y-1">
              <Label>PIC VE</Label>
              <Select value={data.picVeId} onValueChange={v => handleChange("picVeId", v)}>
                <SelectTrigger><SelectValue placeholder="Select PIC VE" /></SelectTrigger>
                <SelectContent>
                  {listPicVe.map((p) => <SelectItem key={p.privy_id} value={p.privy_id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Enterprise Name</Label>
              <Input name="enterpriseName" value={data.enterpriseName} onChange={handleInputChange} placeholder="PT. XYZ" />
            </div>

            <div className="space-y-1">
              <Label>Merchant Name</Label>
              <Input name="merchantName" value={data.merchantName} onChange={handleInputChange} placeholder="Merchant XYZ" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Environment</Label>
                <Select onValueChange={v => handleChange("environment", v)} value={data.environment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staging">Staging</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Revision</Label>
                <Input name="revisionNumber" value={data.revisionNumber} onChange={handleInputChange} maxLength={2} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Created Date</Label>
                <Input type="date" name="createdDate" value={data.createdDate} onChange={handleInputChange} />
              </div>
            </div>
          </section>

          {/* Section 2: Services */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Select Services</h3>
            
            <div className="space-y-3">
              {/* Two-step dropdown: Category → Sub-service (with "Other" option) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Service</Label>
                  <Select
                    value={dropdownCategory}
                    onValueChange={v => {
                      setDropdownCategory(v as ServiceCategory)
                      setDropdownSubService("")
                      setCustomServiceName("")
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:ring-emerald-500">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avengers">Avengers</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="connect">Connect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Sub-Service</Label>
                  <Select
                    value={dropdownSubService}
                    onValueChange={handleSubServicePick}
                    disabled={!dropdownCategory}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder={dropdownCategory ? "Select sub-service..." : "Pick a category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownCategory && SERVICES_BY_CATEGORY[dropdownCategory]
                        .filter(n => !isServicePicked(dropdownCategory, stripApiPrefix(n)))
                        .map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      {dropdownCategory && <SelectSeparator />}
                      {dropdownCategory && (
                        <SelectItem value="__OTHER__" className="text-emerald-600 font-semibold">
                          Other (custom)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom input — only when "Other" is picked */}
              {dropdownSubService === "__OTHER__" && dropdownCategory && (
                <div className="p-3 bg-emerald-50/50 border border-dashed border-emerald-300 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
                    Custom service name for {CATEGORY_LABEL[dropdownCategory]}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="e.g. My Custom Endpoint"
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomService() } }}
                      autoFocus
                      className="h-9 text-sm bg-white flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomService}
                      disabled={!customServiceName.trim()}
                      className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setDropdownSubService(""); setCustomServiceName("") }}
                      className="h-9 text-xs text-gray-500"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedServicesTemp.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedServicesTemp.map(svc => {
                    const presetNames = SERVICES_BY_CATEGORY[svc.category].map(stripApiPrefix)
                    const isCustom = !presetNames.includes(svc.name)
                    return (
                      <div key={`${svc.category}:${svc.name}`} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-200">
                        <span>{svc.name}</span>
                        <span className="text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                          {CATEGORY_LABEL[svc.category]}{isCustom ? " · custom" : ""}
                        </span>
                        <button
                          onClick={() => removeService(svc)}
                          className="p-0.5 hover:bg-emerald-200 rounded-full transition-colors text-emerald-500 hover:text-emerald-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Service Credentials — grouped by category */}
            {selectedServicesTemp.some(s => s.category === "avengers") && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Avengers Credentials</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="text-xs text-gray-400 font-medium">
                    {selectedServicesTemp.filter(s => s.category === "avengers").map(s => s.name).join(", ")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Username</Label><Input className="h-8 text-xs bg-white" value={avengersCredential.username} onChange={e => setAvengersCredential(p => ({ ...p, username: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Password</Label><Input className="h-8 text-xs bg-white" value={avengersCredential.password} onChange={e => setAvengersCredential(p => ({ ...p, password: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Merchant Key</Label><Input className="h-8 text-xs bg-white" value={avengersCredential.merchant_key} onChange={e => setAvengersCredential(p => ({ ...p, merchant_key: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">URL</Label><Input className="h-8 text-xs bg-white" value={avengersCredential.url} onChange={e => setAvengersCredential(p => ({ ...p, url: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Channel ID</Label><Input className="h-8 text-xs bg-white" value={avengersCredential.channel_id} onChange={e => setAvengersCredential(p => ({ ...p, channel_id: e.target.value }))} /></div>
                </div>
              </div>
            )}

            {selectedServicesTemp.some(s => s.category === "general") && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">General Credentials</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="text-xs text-gray-400 font-medium">
                    {selectedServicesTemp.filter(s => s.category === "general").map(s => s.name).join(", ")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Username</Label><Input className="h-8 text-xs bg-white" value={generalCredential.username} onChange={e => setGeneralCredential(p => ({ ...p, username: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Password</Label><Input className="h-8 text-xs bg-white" value={generalCredential.password} onChange={e => setGeneralCredential(p => ({ ...p, password: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">API Key</Label><Input className="h-8 text-xs bg-white" value={generalCredential.api_key} onChange={e => setGeneralCredential(p => ({ ...p, api_key: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Secret Key</Label><Input className="h-8 text-xs bg-white" value={generalCredential.secret_key} onChange={e => setGeneralCredential(p => ({ ...p, secret_key: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Channel ID</Label><Input className="h-8 text-xs bg-white" value={generalCredential.channel_id} onChange={e => setGeneralCredential(p => ({ ...p, channel_id: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Enterprise Token</Label><Input className="h-8 text-xs bg-white" value={generalCredential.enterprise_token} onChange={e => setGeneralCredential(p => ({ ...p, enterprise_token: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Base URL</Label><Input className="h-8 text-xs bg-white" value={generalCredential.base_url} onChange={e => setGeneralCredential(p => ({ ...p, base_url: e.target.value }))} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Doc Owner</Label><Input className="h-8 text-xs bg-white" value={generalCredential.doc_owner} onChange={e => setGeneralCredential(p => ({ ...p, doc_owner: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">IP Address</Label><Input className="h-8 text-xs bg-white" value={generalCredential.ip_address} onChange={e => setGeneralCredential(p => ({ ...p, ip_address: e.target.value }))} /></div>
                  </div>
                </div>
              </div>
            )}

            {selectedServicesTemp.some(s => s.category === "connect") && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Connect Credentials</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="text-xs text-gray-400 font-medium">
                    {selectedServicesTemp.filter(s => s.category === "connect").map(s => s.name).join(", ")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Username</Label><Input className="h-8 text-xs bg-white" value={connectCredential.username} onChange={e => setConnectCredential(p => ({ ...p, username: e.target.value }))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Password</Label><Input className="h-8 text-xs bg-white" value={connectCredential.password} onChange={e => setConnectCredential(p => ({ ...p, password: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Merchant Key</Label><Input className="h-8 text-xs bg-white" value={connectCredential.merchant_key} onChange={e => setConnectCredential(p => ({ ...p, merchant_key: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Enterprise Token</Label><Input className="h-8 text-xs bg-white" value={connectCredential.enterprise_token} onChange={e => setConnectCredential(p => ({ ...p, enterprise_token: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Base URL</Label><Input className="h-8 text-xs bg-white" value={connectCredential.base_url} onChange={e => setConnectCredential(p => ({ ...p, base_url: e.target.value }))} /></div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* BOTTOM FIXED BAR */}
        <div className="p-5 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-white shadow-md hover:shadow-lg transition-all rounded-xl font-bold flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Submit Credential Draft</>}
          </Button>
        </div>
      </div>

      {/* --- RIGHT PANEL: PREVIEW --- */}
      <div className="hidden md:flex flex-1 bg-gray-100 relative overflow-hidden flex-col items-center">
        <div className="absolute top-6 z-50 flex gap-3 bg-white p-2 rounded-full shadow-xl border border-gray-100">
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="w-4 h-4 text-gray-600" /></Button>
          <span className="text-xs font-mono self-center w-12 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn className="w-4 h-4 text-gray-600" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto w-full pt-20 pb-10 flex flex-col items-center">
          <CredentialPreview data={{ ...data, services: buildGroupedServices(selectedServicesTemp) }} zoom={zoom} listPicVe={listPicVe} />
        </div>
      </div>

      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}

function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
