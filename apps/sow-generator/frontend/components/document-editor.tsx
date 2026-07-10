"use client";

import React, { useState, useEffect } from "react";
import { FileText, Send, Loader2, ZoomIn, ZoomOut, Plus, Trash2, RefreshCcw, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { API_BASE_URL } from "@/lib/constants"

// --- HELPERS ---
const getRomanMonth = (dateStr: string) => {
  if (!dateStr) return "I";
  const month = new Date(dateStr).getMonth() + 1;
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[month - 1] || "I";
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

// --- TYPES ---
interface CredentialItem {
  sdk_type: string;
  merchant_key: string;
  username: string;
  password: string;
}

// --- STATE DEFAULT ---
const initialFormData = {
  picVeId: "",
  picBdId: "",
  enterpriseName: "",
  enterpriseInitial: "",
  merchantName: "",
  releaseDate: new Date().toISOString().split("T")[0],
  envType: "Staging",
  revisionNumber: "00",
  nomorUrut: "001", // Hanya untuk tampilan visual, nomor asli dihitung backend

  // App & Config
  merchant_app: "", // Single string di UI, nanti jadi list di backend
  rasp: true,
  rgb: false,

  // Dynamic Credentials
  credentials: [] as CredentialItem[],

  // Timeline
  trialPlanStg: "",
  uat: "",
  trialPlanProd: "",
  liveOnMarket: "",
  stgRequest: "",
  expectedApproved: "",
  expectedDeliverStg: "",
  prodReq: "",
  expectedDeliverProd: "",
};

interface FormValueEngineerProps {
  onLogout?: () => void;
  currentUser?: any;
}

export default function FormValueEngineer({ onLogout, currentUser }: FormValueEngineerProps) {
  const [data, setData] = useState(initialFormData);

  // State Data Master (Diisi dari Python)
  const [listPicVe, setListPicVe] = useState<any[]>([]);
  const [listPicBd, setListPicBd] = useState<any[]>([]);

  const [zoom, setZoom] = useState(0.6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. FETCH MASTER DATA DARI PYTHON ---
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/master-data`);
        if (!response.ok) throw new Error("Gagal mengambil data dari Backend");

        const result = await response.json();
        setListPicVe(result.pic_ve || []);
        setListPicBd(result.pic_bd || []);

        // Update nomor urut estimasi
        if (result.next_no_urut) {
          setData(prev => ({ ...prev, nomorUrut: result.next_no_urut }));
        }
      } catch (err) {
        console.error("Error fetching master data:", err);
      }
    };
    fetchMasterData();
  }, []);

  // --- 2. AUTO FILL SAAT LOGIN ---
  useEffect(() => {
    if (currentUser) {
      setData(prev => ({ ...prev, picVeId: String(currentUser.id) }));
    }
  }, [currentUser]);

  // --- HANDLERS UTAMA ---
  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "enterpriseInitial") setData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    else setData(prev => ({ ...prev, [name]: value }));
  }

  // --- HANDLERS CREDENTIALS (DYNAMIC LIST) ---
  const addCredential = () => {
    setData(prev => ({
      ...prev,
      credentials: [...prev.credentials, { sdk_type: "SDK Mobile - Android", merchant_key: "", username: "", password: "" }]
    }));
  };

  const removeCredential = (index: number) => {
    const newCreds = data.credentials.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, credentials: newCreds }));
  };

  const handleCredentialChange = (index: number, field: keyof CredentialItem, value: string) => {
    const newCreds = [...data.credentials];
    newCreds[index] = { ...newCreds[index], [field]: value };
    setData(prev => ({ ...prev, credentials: newCreds }));
  };

  // --- SUBMIT DATA KE PYTHON ---
  const handleSubmit = async () => {
    // Validasi Sederhana
    if (!data.picVeId || !data.picBdId || !data.enterpriseName) {
      alert("Please complete: Enterprise Name, PIC VE, and PIC BD.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Construct Payload sesuai struktur Python SowRequest
      const payload = {
        pic_ve_id: parseInt(data.picVeId),
        pic_bd_id: parseInt(data.picBdId),
        enterprise_name: data.enterpriseName,
        enterprise_initial: data.enterpriseInitial,
        merchant_name: data.merchantName,
        revision_number: data.revisionNumber,
        environment: data.envType,
        release_date: data.releaseDate,

        // Timeline Maps
        plan_stg: data.trialPlanStg || null,
        uat_date: data.uat || null,
        plan_prod: data.trialPlanProd || null,
        live_on_market: data.liveOnMarket || null,
        stg_request: data.stgRequest || null,
        expected_approved: data.expectedApproved || null,
        expected_deliver_stg: data.expectedDeliverStg || null,
        prod_request: data.prodReq || null,
        expected_deliver_prod: data.expectedDeliverProd || null,

        // Configs
        rasp: data.rasp,
        rgb: data.rgb,

        // Lists Construction
        sdk_list: data.credentials, // Strukturnya sudah sama dengan Python
        app_list: data.merchant_app ? [{ app_name: data.merchant_app }] : []
      };

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to generate document");
      }

      // --- AUTO DOWNLOAD BLOB ---
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Nama file output
      a.download = `SOW_${data.enterpriseInitial}_${data.revisionNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      alert("Success! Document downloaded & Backend Excel Log updated.");

      // Refresh halaman agar nomor urut update
      window.location.reload();

    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- GETTERS UNTUK PREVIEW ---
  const getPicVeName = () => listPicVe.find(p => String(p.id) === String(data.picVeId))?.name || "-";
  const getPicBdName = () => listPicBd.find(p => String(p.id) === String(data.picBdId))?.name || "-";
  const getPrivyId = () => listPicVe.find(p => String(p.id) === String(data.picVeId))?.privy_id || "-";

  const year = new Date(data.releaseDate).getFullYear();
  const romanMonth = getRomanMonth(data.releaseDate);
  const documentNumber = `SOW-${data.enterpriseInitial || "XXX"}-${data.nomorUrut}/${data.revisionNumber}/${romanMonth}/${year}`;
  const hasCredentials = data.credentials.length > 0;

  return (
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">

      {/* --- LEFT: FORM INPUT (40%) --- */}
      <div className="w-full md:w-[40%] md:min-w-[500px] bg-white md:border-r flex flex-col z-10 shadow-xl">
        <div className="p-5 border-b bg-white flex justify-between items-center">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-gray-800 text-xl">
              <FileText className="w-6 h-6 text-purple-600" /> SOW Generator
            </h2>
            <div className="mt-2 text-sm font-mono bg-purple-50 text-purple-800 px-3 py-1 rounded border border-purple-200 inline-block font-semibold">
              {documentNumber}
            </div>
          </div>
          {onLogout && <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="w-5 h-5 text-gray-500" /></Button>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* GROUP 1: BASIC INFO */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>PIC VE</Label>
                <Select value={data.picVeId} onValueChange={v => handleChange("picVeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select VE" /></SelectTrigger>
                  <SelectContent>{listPicVe.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>PIC BD</Label>
                <Select value={data.picBdId} onValueChange={v => handleChange("picBdId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select BD" /></SelectTrigger>
                  <SelectContent>{listPicBd.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1"><Label>Enterprise Name</Label><Input name="enterpriseName" value={data.enterpriseName} onChange={handleInputChange} /></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Initial (3 Char)</Label><Input name="enterpriseInitial" value={data.enterpriseInitial} onChange={handleInputChange} maxLength={3} className="uppercase font-mono" /></div>
              <div className="space-y-1"><Label>Merchant Name</Label><Input name="merchantName" value={data.merchantName} onChange={handleInputChange} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>No Urut (Est)</Label>
                <div className="flex gap-2">
                  <Input value={data.nomorUrut} readOnly className="bg-gray-50" />
                  <Button variant="outline" size="icon" onClick={() => window.location.reload()}><RefreshCcw className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-1"><Label>Revision</Label><Input name="revisionNumber" value={data.revisionNumber} onChange={handleInputChange} maxLength={2} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Release Date</Label><Input type="date" name="releaseDate" value={data.releaseDate} onChange={handleInputChange} /></div>
              <div className="space-y-1">
                <Label>Environment</Label>
                <Select onValueChange={v => handleChange("envType", v)} defaultValue={data.envType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Staging", "Production", "UAT"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* GROUP 2: APP CONFIG */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">App Config</h3>
            <div className="space-y-1"><Label>Main App Name</Label><Input value={data.merchant_app} onChange={(e) => handleChange("merchant_app", e.target.value)} placeholder="e.g. SuperApp" /></div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2 border p-3 rounded bg-gray-50">
                <Checkbox id="rasp" checked={data.rasp} onCheckedChange={(c) => handleChange("rasp", c === true)} />
                <Label htmlFor="rasp">Enable RASP</Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded bg-gray-50">
                <Checkbox id="rgb" checked={data.rgb} onCheckedChange={(c) => handleChange("rgb", c === true)} />
                <Label htmlFor="rgb">Enable RGB</Label>
              </div>
            </div>
          </section>

          {/* GROUP 3: CREDENTIALS (DYNAMIC) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Credentials</h3>
              <Button variant="outline" size="sm" onClick={addCredential} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" /> Add</Button>
            </div>

            <div className="space-y-4">
              {data.credentials.map((cred, index) => (
                <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50 relative group shadow-sm transition-all hover:shadow-md">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCredential(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="mb-3">
                    <Label className="text-xs font-semibold text-gray-500">Platform</Label>
                    <Select value={cred.sdk_type} onValueChange={(v) => handleCredentialChange(index, "sdk_type", v)}>
                      <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SDK Mobile - Android">Android</SelectItem>
                        <SelectItem value="SDK Mobile - iOS">iOS</SelectItem>
                        <SelectItem value="SDK Web">Web</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Input value={cred.merchant_key} onChange={(e) => handleCredentialChange(index, "merchant_key", e.target.value)} placeholder="Merchant Key" className="h-8 text-sm font-mono bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={cred.username} onChange={(e) => handleCredentialChange(index, "username", e.target.value)} placeholder="Username" className="h-8 text-sm bg-white" />
                      <Input value={cred.password} onChange={(e) => handleCredentialChange(index, "password", e.target.value)} placeholder="Password" type="password" className="h-8 text-sm bg-white" />
                    </div>
                  </div>
                </div>
              ))}
              {data.credentials.length === 0 && <div className="text-center text-gray-400 text-sm py-4 italic">No credentials added yet.</div>}
            </div>
          </section>

          {/* GROUP 4: TIMELINE */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-xs font-semibold">Trial Plan STG</Label><Input type="date" className="h-9" name="trialPlanStg" value={data.trialPlanStg} onChange={handleInputChange} /></div>
              <div className="space-y-1"><Label className="text-xs font-semibold">UAT</Label><Input type="date" className="h-9" name="uat" value={data.uat} onChange={handleInputChange} /></div>
              <div className="space-y-1"><Label className="text-xs font-semibold">Trial Plan PROD</Label><Input type="date" className="h-9" name="trialPlanProd" value={data.trialPlanProd} onChange={handleInputChange} /></div>
              <div className="space-y-1"><Label className="text-xs font-semibold">Live on Market</Label><Input type="date" className="h-9" name="liveOnMarket" value={data.liveOnMarket} onChange={handleInputChange} /></div>
            </div>

            <div className="p-3 bg-gray-50 rounded border space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase">VE Internal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">STG Req</Label><Input type="date" className="h-8 text-xs" name="stgRequest" value={data.stgRequest} onChange={handleInputChange} /></div>
                <div><Label className="text-xs">Approve</Label><Input type="date" className="h-8 text-xs" name="expectedApproved" value={data.expectedApproved} onChange={handleInputChange} /></div>
              </div>
              <div><Label className="text-xs">Deliver STG</Label><Input type="date" className="h-8 text-xs" name="expectedDeliverStg" value={data.expectedDeliverStg} onChange={handleInputChange} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">PROD Req</Label><Input type="date" className="h-8 text-xs" name="prodReq" value={data.prodReq} onChange={handleInputChange} /></div>
                <div><Label className="text-xs">Deliver PROD</Label><Input type="date" className="h-8 text-xs" name="expectedDeliverProd" value={data.expectedDeliverProd} onChange={handleInputChange} /></div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-5 border-t bg-white shadow-lg">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 h-11 shadow-lg shadow-purple-100 font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />}
            Generate Document
          </Button>
        </div>
      </div>

      {/* --- RIGHT: PREVIEW (Visual SAMA, Logic Updated) --- */}
      <div className="hidden md:flex flex-1 bg-gray-200 relative overflow-hidden flex-col items-center">
        <div className="absolute top-6 z-50 flex gap-3 bg-white p-2 rounded-full shadow-xl border border-gray-100">
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="w-4 h-4 text-gray-600" /></Button>
          <span className="text-xs font-mono self-center w-12 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn className="w-4 h-4 text-gray-600" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto w-full p-10 flex flex-col items-center gap-10">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }} className="flex flex-col gap-10 pb-20">

            {/* PAGE 1: COVER */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] flex flex-col justify-between relative box-border border border-gray-300">
              <div className="absolute top-10 right-10 border-2 border-gray-400 text-gray-500 font-bold text-xs px-4 py-1 tracking-[0.2em] uppercase rotate-[-5deg] opacity-70">Confidential</div>
              <div className="mt-32 text-center">
                <h1 className="text-5xl font-serif font-bold text-black mb-6 tracking-wide leading-tight">SCOPE OF<br />WORKS</h1>
                <div className="w-32 h-1.5 bg-black mx-auto mb-10"></div>
                <h2 className="text-2xl text-gray-600 font-serif italic">SDK Liveness Document Integration</h2>
              </div>
              <div className="text-center space-y-4 mb-20">
                <div className="text-3xl font-bold uppercase tracking-widest text-purple-900">{data.enterpriseName || "[ENTERPRISE]"}</div>
                <div className="text-xl text-gray-500 font-bold tracking-widest">({data.enterpriseInitial || "XXX"})</div>
              </div>
              <div className="mb-20 flex flex-col items-center">
                <div className="border-t-2 border-b-2 border-gray-800 py-6 px-12 w-full max-w-lg">
                  <table className="w-full font-mono text-sm text-gray-700">
                    <tbody>
                      <tr><td className="py-1 font-bold">Document No</td><td className="py-1 pl-4">: {documentNumber}</td></tr>
                      <tr><td className="py-1 font-bold">Date</td><td className="py-1 pl-4">: {formatDateIndo(data.releaseDate)}</td></tr>
                      <tr><td className="py-1 font-bold">Revision</td><td className="py-1 pl-4">: {data.revisionNumber}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center uppercase tracking-wider">Generated by Value Engineering System</div>
              <div className="absolute bottom-6 right-8 text-xs text-gray-300 font-mono">Page 1</div>
            </div>

            {/* PAGE 2 */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] box-border text-[11pt] font-serif leading-snug relative border border-gray-300">
              <h3 className="font-bold border-b-2 border-black mb-6 text-lg">I. DOCUMENT INFORMATION</h3>
              <table className="w-full border-collapse border border-black mb-12 text-sm">
                <tbody>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold w-1/3">Doc No</td><td className="border border-black p-2">{documentNumber}</td></tr>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold">Date</td><td className="border border-black p-2">{formatDateIndo(data.releaseDate)}</td></tr>
                </tbody>
              </table>

              <h3 className="font-bold border-b-2 border-black mb-6 text-lg">II. CLIENT INFORMATION</h3>
              <table className="w-full border-collapse border border-black text-sm mb-12">
                <tbody>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold w-[25%]">Company</td><td className="border border-black p-2" colSpan={3}>{data.enterpriseName}</td></tr>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold">Biz Dev</td><td className="border border-black p-2" colSpan={3}>{getPicBdName()}</td></tr>
                  <tr>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Value Eng</td><td className="border border-black p-2">{getPicVeName()}</td>
                    <td className="border border-black p-2 bg-gray-100 font-bold w-[20%]">PrivyID</td><td className="border border-black p-2">{getPrivyId()}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold border-b-2 border-black mb-6 text-lg">III. CONFIGURATION</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <tbody>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold w-1/3">Apps</td><td className="border border-black p-2">{data.merchant_app || "-"}</td></tr>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold">RASP</td><td className="border border-black p-2">{data.rasp ? "Enable" : "Disable"}</td></tr>
                  <tr><td className="border border-black p-2 bg-gray-100 font-bold">RGB</td><td className="border border-black p-2">{data.rgb ? "Enable" : "Disable"}</td></tr>
                </tbody>
              </table>
              <div className="absolute bottom-6 right-8 text-xs text-gray-300 font-mono">Page 2</div>
            </div>

            {/* PAGE 3: CREDENTIALS */}
            {hasCredentials && (
              <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] box-border text-[11pt] font-serif leading-snug relative border border-gray-300">
                <h3 className="font-bold border-b-2 border-black mb-6 text-lg">IV. SDK CREDENTIALS</h3>
                <div className="space-y-10">
                  {data.credentials.map((cred, i) => (
                    <div key={i}>
                      <div className="font-bold text-sm mb-2 ml-1 capitalize flex items-center gap-2">
                        <span className="w-2 h-2 bg-black rounded-full inline-block"></span>
                        {cred.sdk_type} ({data.envType})
                      </div>
                      <table className="w-full border-collapse border border-black text-sm shadow-sm">
                        <tbody>
                          <tr><td className="border border-black p-2 font-bold bg-gray-100 w-1/3">Key</td><td className="border border-black p-2 font-mono text-xs break-all">{cred.merchant_key || "-"}</td></tr>
                          <tr><td className="border border-black p-2 font-bold bg-gray-100">Username</td><td className="border border-black p-2">{cred.username || "-"}</td></tr>
                          <tr><td className="border border-black p-2 font-bold bg-gray-100">Password</td><td className="border border-black p-2 font-mono">{cred.password ? "******" : "-"}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-6 right-8 text-xs text-gray-300 font-mono">Page 3</div>
              </div>
            )}

            {/* PAGE 4: TIMELINE */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] box-border text-[11pt] font-serif leading-snug relative border border-gray-300">
              <h3 className="font-bold border-b-2 border-black mb-6 text-lg">{hasCredentials ? 'V. TIMELINE' : 'IV. TIMELINE'}</h3>

              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-300">
                    <th className="border border-black p-2 text-center font-bold" colSpan={3}>Merchant Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold w-[40%]">Trial Plan on STG</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanStg)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">UAT</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.uat)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Trial Plan on PROD</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanProd)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Live on Market</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.liveOnMarket)}</td>
                  </tr>

                  <tr className="bg-gray-300">
                    <th className="border border-black p-2 text-center font-bold" colSpan={3}>Value Engineering Timeline</th>
                  </tr>

                  <tr>
                    <td className="border border-black p-2 font-bold">STG Request</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.stgRequest)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Expected Approved</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.expectedApproved)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Expected Deliver STG</td>
                    <td className="border border-black p-2">{formatDateIndo(data.expectedDeliverStg)}</td>
                    <td className="border border-black p-2 italic text-xs w-[25%] text-gray-600">Max D+2 Request</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">PROD Request</td>
                    <td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.prodReq)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Expected Deliver PROD</td>
                    <td className="border border-black p-2">{formatDateIndo(data.expectedDeliverProd)}</td>
                    <td className="border border-black p-2 italic text-xs text-gray-600">Max D+2 Request</td>
                  </tr>
                </tbody>
              </table>

              <div className="absolute bottom-6 right-8 text-xs text-gray-300 font-mono">Page {hasCredentials ? '4' : '3'}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}