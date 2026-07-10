"use client";

import React, { useState, useEffect } from "react";
import { FileText, Send, Loader2, ZoomIn, ZoomOut, RefreshCcw, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import {
    DEFAULTS,
    PROVIDER_OPTIONS,
    getRomanMonth,
    formatDateIndo,
    API_BASE_URL,
    ENV_TYPE_OPTIONS,
    MERCHANT_APPS_OPTIONS,
    THRESHOLD_OPTIONS,
    MASKING_THRESHOLD_OPTIONS, // TAMBAHKAN INI
    FACEFLOW_OPTIONS,
    LOGO_URL,
    LOGO_HEADER      // TAMBAHKAN INI SEKALIAN
} from "@/lib/constants";
import { DocumentPreview } from "./document-preview"; // Import preview

// ─── Komponen DateTBC — Field tanggal dengan toggle TBC ───────────────────────
function DateTBC({
    label,
    name,
    value,
    isTbc,
    onToggleTbc,
    onChange,
    small = false,
}: {
    label: string;
    name: string;
    value: string;
    isTbc: boolean;
    onToggleTbc: (v: boolean) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    small?: boolean;
}) {
    const labelCls = small ? "text-xs text-gray-600" : "text-xs font-semibold text-gray-600";
    const heightCls = small ? "h-8" : "h-10";

    return (
        <div className="space-y-1">
            <Label className={labelCls}>{label}</Label>
            <div className="flex items-center gap-2">
                {isTbc ? (
                    <div className={`flex-1 flex items-center justify-center rounded-md border-2 border-dashed border-[#F8001A]/40 bg-red-50 text-[#F8001A] font-bold text-xs tracking-widest ${heightCls}`}>
                        TBC
                    </div>
                ) : (
                    <Input type="date" name={name} value={value} onChange={onChange} className={`flex-1 ${small ? "h-8 text-xs bg-white" : ""}`} />
                )}
                <button
                    type="button"
                    onClick={() => onToggleTbc(!isTbc)}
                    title={isTbc ? "Click to enter a date" : "Click if the date is not yet confirmed"}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all duration-150 ${heightCls} ${isTbc
                        ? "bg-[#F8001A] border-[#F8001A] text-white shadow-sm"
                        : "bg-white border-gray-300 text-gray-400 hover:border-[#F8001A] hover:text-[#F8001A]"
                        }`}
                >
                    TBC
                </button>
            </div>
        </div>
    );
}
// ──────────────────────────────────────────────────────────────────────────────


const initialFormData = {
    picVeId: "",
    picBdId: "",
    enterpriseName: "",
    enterpriseInitial: "",
    merchantName: "",
    releaseDate: new Date().toISOString().split("T")[0],
    envType: "Staging",
    revisionNumber: "00",
    rasp: true,
    rgb: false,
    nfc: "Non Active",
    sdkType: [] as string[],
    merchantMainApps: [] as string[],
    sdkCredentials: {
        ios: { merchantKey: "", username: "", password: "" },
        android: { merchantKey: "", username: "", password: "" },
        web: { merchantKey: "", username: "", password: "" },
    },
    trialPlanStg: "",
    uat: "",
    trialPlanProd: "",
    liveOnMarket: "",
    stgRequest: "",
    expectedApproved: "",
    expectedDeliverStg: "",
    prodReq: "",
    expectedDeliverProd: "",
    // TBC flags — field mana yang belum pasti tanggalnya
    tbcFields: {} as Record<string, boolean>,

    productConfig: {
        basic: { ...DEFAULTS.basic },
        ui: { ...DEFAULTS.ui },
        liveness: { ...DEFAULTS.liveness },
        assets: { ...DEFAULTS.assets }
    },
};

interface FormValueEngineerProps {
    onLogout?: () => void;
    currentUser?: any;
    userName?: string;
    onBack?: () => void;
}

export default function FormValueEngineer({ onLogout, currentUser, onBack }: FormValueEngineerProps) {
    const [data, setData] = useState(initialFormData);
    const [activeTab, setActiveTab] = useState("basic");
    const [listPicVe, setListPicVe] = useState<any[]>([]);
    const [listPicBd, setListPicBd] = useState<any[]>([]);
    const [zoom, setZoom] = useState(0.9);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- LOGIKA REVISION NUMBER OTOMATIS ---
    useEffect(() => {
        if (data.envType === "Staging") {
            setData(prev => ({ ...prev, revisionNumber: "00" }));
        } else {
            setData(prev => ({ ...prev, revisionNumber: "01" }));
        }
    }, [data.envType]);

    // --- FETCH MASTER DATA ---
    const fetchMasterData = async () => {
        try {
            const url = currentUser?.id ? `${API_BASE_URL}/master-data?user_id=${encodeURIComponent(currentUser.id)}` : `${API_BASE_URL}/master-data`
            const response = await fetch(url)
            if (response.ok) {
                const result = await response.json();
                if (result.pic_ve) setListPicVe(result.pic_ve);
                if (result.pic_bd) setListPicBd(result.pic_bd);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    // --- AUTO FILL LOGIN ---
    useEffect(() => {
        // Cek apakah currentUser dan privy_id tersedia
        if (currentUser && currentUser.privy_id) {
            setData(prev => ({
                ...prev,
                picVeId: currentUser.privy_id // Gunakan privy_id
            }));
        } else {
            // Jika tidak ada, pastikan kembali ke string kosong agar placeholder muncul
            setData(prev => ({ ...prev, picVeId: "" }));
        }
    }, [currentUser]);

    // --- HANDLERS ---
    const handleChange = (field: string, value: any) => setData((prev) => ({ ...prev, [field]: value }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "enterpriseInitial") setData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        else setData(prev => ({ ...prev, [name]: value }));
    }

    const handleCredential = (platform: "ios" | "android" | "web", field: string, value: string) => {
        setData((prev) => ({
            ...prev,
            sdkCredentials: { ...prev.sdkCredentials, [platform]: { ...prev.sdkCredentials[platform], [field]: value } },
        }));
    };

    const toggleList = (field: "sdkType" | "merchantMainApps", item: string) => {
        const list = data[field];
        handleChange(field, list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
    };

    // --- GETTERS (Untuk Preview) ---
    const getPicVeName = () => listPicVe.find(p => p.privy_id === data.picVeId)?.name || "-";
    const getPicBdName = () => listPicBd.find(p => p.name === data.picBdId)?.name || "-";
    const getPrivyId = () => listPicVe.find(p => p.privy_id === data.picVeId)?.privy_id || "-";

    const hasCredentials = data.sdkType.length > 0;
    const appCleanName = data.sdkType.map(p => p === 'ios' ? 'SDK iOS' : p === 'android' ? 'SDK Android' : 'SDK Web').join(", ");

    // --- SUBMIT HANDLER (SAVE DRAFT) ---
    const handleSubmit = async () => {
        // 1. VALIDASI FIELD WAJIB
        const mandatoryFields = [
            { key: "picVeId", label: "PIC VE" },
            { key: "picBdId", label: "PIC BD" },
            { key: "enterpriseName", label: "Enterprise Name" },
            { key: "merchantName", label: "Merchant Name" },
            { key: "trialPlanStg", label: "Trial Plan STG" },
            { key: "uat", label: "UAT Date" },
            { key: "trialPlanProd", label: "Trial Plan PROD" },
            { key: "liveOnMarket", label: "Live on Market" },
            { key: "stgRequest", label: "STG Request Date" },
            { key: "expectedApproved", label: "Expected Approved Date" },
            { key: "expectedDeliverStg", label: "Expected Deliver STG" },
        ];

        for (const field of mandatoryFields) {
            const isTbc = data.tbcFields?.[field.key];
            if (!isTbc && !data[field.key as keyof typeof data]) {
                toast.error("Data Incomplete", {
                    description: `${field.label} is required, or check TBC if not yet confirmed.`,
                    duration: 4000
                });
                setActiveTab("basic");
                return;
            }
        }

        if (data.sdkType.length === 0) {
            toast.error("Please select at least one SDK Platform (iOS/Android/Web) first!");
            setActiveTab("basic");
            return;
        }

        if (data.merchantMainApps.length === 0) {
            toast.error("Please check at least one Merchant Main App!");
            setActiveTab("basic");
            return;
        }

        // --- SIMPAN DRAFT --- 
        setIsSubmitting(true);
        const toastId = toast.loading("Processing data. Please wait...");
        try {
            const payload = {
                pic_ve_id: data.picVeId,
                pic_bd_id: data.picBdId,
                created_by: getPrivyId(),
                enterprise_name: data.enterpriseName,
                enterprise_initial: "",   // Tidak diisi VE — admin yang mengisi
                merchant_name: data.merchantName,
                revision_number: data.revisionNumber,
                environment: data.envType,
                release_date: data.releaseDate,
                plan_stg: data.tbcFields?.trialPlanStg ? "TBC" : (data.trialPlanStg || null),
                uat_date: data.tbcFields?.uat ? "TBC" : (data.uat || null),
                plan_prod: data.tbcFields?.trialPlanProd ? "TBC" : (data.trialPlanProd || null),
                live_on_market: data.tbcFields?.liveOnMarket ? "TBC" : (data.liveOnMarket || null),
                stg_request: data.tbcFields?.stgRequest ? "TBC" : (data.stgRequest || null),
                expected_approved: data.tbcFields?.expectedApproved ? "TBC" : (data.expectedApproved || null),
                expected_deliver_stg: data.tbcFields?.expectedDeliverStg ? "TBC" : (data.expectedDeliverStg || null),
                prod_request: data.tbcFields?.prodReq ? "TBC" : (data.prodReq || null),
                expected_deliver_prod: data.tbcFields?.expectedDeliverProd ? "TBC" : (data.expectedDeliverProd || null),
                rasp: data.rasp,
                rgb: data.rgb,
                nfc: data.nfc,
                sdk_list: data.sdkType.map(platform => ({
                    sdk_type: platform === 'ios' ? 'SDK Mobile - iOS' : platform === 'android' ? 'SDK Mobile - Android' : 'SDK Web',
                    merchant_key: (data.sdkCredentials as any)[platform].merchantKey,
                    username: (data.sdkCredentials as any)[platform].username,
                    password: (data.sdkCredentials as any)[platform].password
                })),
                app_list: data.merchantMainApps.map(app => ({ app_name: app })),
                product_config: data.productConfig,
            };

            const response = await fetch(`${API_BASE_URL}/save-draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const e = await response.json();
                throw new Error(e.detail);
            }

            toast.success("Data Submitted Successfully!", {
                id: toastId,
                description: "Your data has been added to the Admin VE Support queue to be processed and generated.",
                duration: 5000,
            });

            // Reset form
            setData({
                ...initialFormData,
                picVeId: currentUser?.privy_id || "",
            });
            setActiveTab("basic");
            fetchMasterData();

        } catch (err: any) {
            toast.error("Failed to Submit Data", {
                id: toastId,
                description: err.message || "An error occurred while sending data to the server.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- HEADER COMPONENT (Untuk Preview) ---
    const RunningHeader = () => (
        <div className="absolute top-0 left-0 w-full px-[20mm] pt-[10mm]">
            <table className="w-full border-collapse border-b-2 border-black">
                <tbody>
                    <tr>
                        <td className="pb-2 align-bottom w-1/2">
                            <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" />
                        </td>
                        <td className="pb-2 align-bottom w-1/2 text-right">
                            <div className="text-[10pt] font-bold text-gray-700 uppercase">Scope of Works</div>
                            <div className="text-[9pt] text-gray-500 italic">SDK Liveness Document - {data.enterpriseName || "Enterprise"}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    // --- 1. Fungsi Get Status ---
    const getStatusBadge = (section: keyof typeof DEFAULTS) => {
        const current = data.productConfig[section];
        const defaultValue = DEFAULTS[section];

        // Bandingkan data sekarang dengan default
        const isDefault = JSON.stringify(current) === JSON.stringify(defaultValue);

        return isDefault ? (
            <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">Default</span>
        ) : (
            <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">Custom</span>
        );
    };

    // --- 2. Fungsi Handle Product Change ---
    const handleProductChange = (section: keyof typeof DEFAULTS, field: string, value: any) => {
        setData((prev) => ({
            ...prev,
            productConfig: {
                ...prev.productConfig,
                [section]: {
                    ...prev.productConfig[section],
                    [field]: value
                }
            }
        }));
    };

    // --- 3. Fungsi Toggle Product List ---
    const toggleProductList = (section: keyof typeof DEFAULTS, field: string, item: string) => {
        const currentList = (data.productConfig[section] as any)[field] as string[];
        const newList = currentList.includes(item)
            ? currentList.filter(i => i !== item)
            : [...currentList, item];

        handleProductChange(section, field, newList);
    };

    return (
        <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">

            {/* --- LEFT PANEL: FORM INPUT --- */}
            <div className="w-full md:w-[40%] md:min-w-[500px] bg-white md:border-r flex flex-col z-10 shadow-xl">
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
                        <FileText className="w-6 h-6 text-[#F8001A]" /> SOW SDK Liveness
                    </h2>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col px-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="sticky top-0 z-30 bg-white border-b px-6 pt-4 pb-2 shadow-sm">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="product" className="gap-2">
                                    Product Config
                                    {/* Logika sederhana untuk badge di tab utama */}
                                    <Badge
                                        variant={JSON.stringify(data.productConfig) === JSON.stringify(DEFAULTS) ? 'secondary' : 'destructive'}
                                        className="h-4 text-[10px]"
                                    >
                                        {JSON.stringify(data.productConfig) === JSON.stringify(DEFAULTS) ? 'Default' : 'Custom'}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <TabsContent value="basic" className="mt-0 space-y-8 pb-10 focus-visible:outline-none">
                                <section className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>PIC VE</Label>
                                            <Select value={data.picVeId} onValueChange={v => handleChange("picVeId", v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select PIC VE" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {listPicVe.map((p) => (
                                                        <SelectItem key={p.privy_id} value={p.privy_id}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>PIC BD</Label>
                                            <Select value={data.picBdId} onValueChange={v => handleChange("picBdId", v)}>
                                                <SelectTrigger><SelectValue placeholder="Select PIC BD" /></SelectTrigger>
                                                <SelectContent>{listPicBd.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1"><Label>Enterprise Name</Label><Input name="enterpriseName" value={data.enterpriseName} onChange={handleInputChange} /></div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label>Initial (3 Char)</Label><Input name="enterpriseInitial" value={data.enterpriseInitial} onChange={handleInputChange} maxLength={3} className="uppercase font-mono" placeholder="Filled in by Admin" disabled /></div>
                                        <div className="space-y-1"><Label>Merchant Name</Label><Input name="merchantName" value={data.merchantName} onChange={handleInputChange} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label>Release Date</Label><Input type="date" name="releaseDate" value={data.releaseDate} onChange={handleInputChange} /></div>
                                        <div className="space-y-1"><Label>Revision</Label><Input name="revisionNumber" value={data.revisionNumber} onChange={handleInputChange} maxLength={2} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Environment</Label>
                                            <Select onValueChange={v => handleChange("envType", v)} value={data.envType}>
                                                <SelectTrigger className="w-full"><SelectValue placeholder="Select Env" /></SelectTrigger>
                                                <SelectContent>
                                                    {ENV_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </section>

                                {/* GROUP 2: CONFIGURATION */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">System Config</h3>

                                    {/* SDK Platforms */}
                                    <div>
                                        <Label className="mb-3 block font-semibold text-xs text-gray-500">SDK PLATFORM</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {["ios", "android", "web"].map(p => (
                                                <div key={p} className={`flex items-center gap-2 border px-3 py-2 rounded cursor-pointer transition-colors ${data.sdkType.includes(p) ? 'bg-[#F8001A]/10 border-[#F8001A]' : 'bg-gray-50 border-gray-200'}`} onClick={() => toggleList("sdkType", p)}>
                                                    <Checkbox checked={data.sdkType.includes(p)} className="data-[state=checked]:bg-[#F8001A] data-[state=checked]:border-[#F8001A]" />
                                                    <Label className="capitalize cursor-pointer">{p}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Credentials Inputs (Password Visible) */}
                                    <div className="space-y-4">
                                        {data.sdkType.map(p => (
                                            <div key={p} className="p-3 bg-[#F8001A]/5 border border-[#F8001A]/20 rounded-lg text-sm space-y-2">
                                                <span className="font-bold capitalize text-[#F8001A] flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#F8001A]"></div> {p} Credentials
                                                </span>
                                                <Input placeholder="Merchant Key" value={(data.sdkCredentials as any)[p].merchantKey} onChange={e => handleCredential(p as any, "merchantKey", e.target.value)} className="bg-white" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input placeholder="Username" value={(data.sdkCredentials as any)[p].username} onChange={e => handleCredential(p as any, "username", e.target.value)} className="bg-white" />
                                                    {/* PASSWORD PLAIN TEXT (Tidak disensor) */}
                                                    <Input type="text" placeholder="Password" value={(data.sdkCredentials as any)[p].password} onChange={e => handleCredential(p as any, "password", e.target.value)} className="bg-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Merchant App with Title */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-gray-700 block border-b pb-1 mb-2">Merchant Main Apps</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {MERCHANT_APPS_OPTIONS.map(a => (
                                                <div key={a} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                                    <Checkbox id={a} checked={data.merchantMainApps.includes(a)} onCheckedChange={() => toggleList("merchantMainApps", a)} className="data-[state=checked]:bg-[#F8001A] data-[state=checked]:border-[#F8001A]" />
                                                    <Label htmlFor={a} className="cursor-pointer">{a}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2 p-3 border rounded bg-gray-50">
                                            <Label className="font-bold text-gray-700">RASP Config</Label>
                                            <RadioGroup value={data.rasp ? "enable" : "disable"} onValueChange={v => handleChange("rasp", v === "enable")} className="flex gap-4 pt-1">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="enable" id="rasp-en" className="border-gray-300 text-gray-900 focus:border-gray-400" />
                                                    <Label htmlFor="rasp-en">Enable</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="disable" id="rasp-dis" className="border-gray-300 text-gray-900 focus:border-gray-400" />
                                                    <Label htmlFor="rasp-dis">Disable</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2 p-3 border rounded bg-gray-50">
                                            <Label className="font-bold text-gray-700">RGB Config</Label>
                                            <RadioGroup value={data.rgb ? "enable" : "disable"} onValueChange={v => handleChange("rgb", v === "enable")} className="flex gap-4 pt-1">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="enable" id="rgb-en" className="border-gray-300 text-gray-900 focus:border-gray-400" />
                                                    <Label htmlFor="rgb-en">Enable</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="disable" id="rgb-dis" className="border-gray-300 text-gray-900 focus:border-gray-400" />
                                                    <Label htmlFor="rgb-dis">Disable</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2 p-3 border rounded bg-gray-50">
                                            <Label className="font-bold text-gray-700">NFC Feature</Label>
                                            <RadioGroup value={data.nfc} onValueChange={v => handleChange("nfc", v)} className="flex gap-4 pt-1">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Active" id="nfc-active" className="border-gray-300 text-gray-900" />
                                                    <Label htmlFor="nfc-active">Active</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Non Active" id="nfc-nonactive" className="border-gray-300 text-gray-900" />
                                                    <Label htmlFor="nfc-nonactive">Non Active</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </section>

                                {/* GROUP 3: TIMELINE */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Timeline</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <DateTBC label="Trial Plan on STG" name="trialPlanStg" value={data.trialPlanStg} isTbc={!!data.tbcFields?.trialPlanStg} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, trialPlanStg: v })} onChange={handleInputChange} />
                                        <DateTBC label="UAT" name="uat" value={data.uat} isTbc={!!data.tbcFields?.uat} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, uat: v })} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <DateTBC label="Trial Plan on PROD" name="trialPlanProd" value={data.trialPlanProd} isTbc={!!data.tbcFields?.trialPlanProd} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, trialPlanProd: v })} onChange={handleInputChange} />
                                        <DateTBC label="Live on Market" name="liveOnMarket" value={data.liveOnMarket} isTbc={!!data.tbcFields?.liveOnMarket} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, liveOnMarket: v })} onChange={handleInputChange} />
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mt-2">
                                        <h4 className="text-xs font-bold text-[#F8001A] uppercase tracking-wide border-b border-[#F8001A]/20 pb-2">Internal VE Timeline</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <DateTBC label="STG Request" name="stgRequest" value={data.stgRequest} isTbc={!!data.tbcFields?.stgRequest} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, stgRequest: v })} onChange={handleInputChange} small />
                                            <DateTBC label="Expected Approved" name="expectedApproved" value={data.expectedApproved} isTbc={!!data.tbcFields?.expectedApproved} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, expectedApproved: v })} onChange={handleInputChange} small />
                                        </div>
                                        <DateTBC label="Expected Deliver STG" name="expectedDeliverStg" value={data.expectedDeliverStg} isTbc={!!data.tbcFields?.expectedDeliverStg} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, expectedDeliverStg: v })} onChange={handleInputChange} small />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <DateTBC label="PROD Request" name="prodReq" value={data.prodReq} isTbc={!!data.tbcFields?.prodReq} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, prodReq: v })} onChange={handleInputChange} small />
                                            <DateTBC label="Expected Deliver PROD" name="expectedDeliverProd" value={data.expectedDeliverProd} isTbc={!!data.tbcFields?.expectedDeliverProd} onToggleTbc={v => handleChange("tbcFields", { ...data.tbcFields, expectedDeliverProd: v })} onChange={handleInputChange} small />
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            {/* PRODUCT CHANGE */}
                            <TabsContent value="product" className="mt-0 space-y-6 pb-10 focus-visible:outline-none">
                                <Accordion type="single" collapsible className="w-full space-y-4">

                                    {/* --- SECTION: BASIC SETUP --- */}
                                    <AccordionItem value="provider" className="border rounded-lg bg-gray-50 overflow-hidden">
                                        <AccordionTrigger className="flex items-center justify-between py-4 px-5 hover:no-underline group data-[state=open]:border-b data-[state=open]:bg-white transition-all">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Basic Setup</span>
                                                {getStatusBadge('basic')} {/* TAMBAHKAN INI */}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-5 space-y-6">
                                            {/* 1. Liveness Provider */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Liveness Provider</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {PROVIDER_OPTIONS.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.basic.livenessProviders.includes(p.id) ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => toggleProductList('basic', 'livenessProviders', p.id)}
                                                        >
                                                            <Checkbox checked={data.productConfig.basic.livenessProviders.includes(p.id)} />
                                                            <Label className="text-xs cursor-pointer">{p.label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 2. Liveness Threshold */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Liveness Threshold</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {THRESHOLD_OPTIONS.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.basic.livenessThreshold === p.id ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => {
                                                                handleProductChange('basic', 'livenessThreshold', p.id);
                                                                handleProductChange('basic', 'isOtherChecked', false); // Matikan "Other" jika pilih opsi standar
                                                            }}
                                                        >
                                                            <Checkbox checked={data.productConfig.basic.livenessThreshold === p.id && !data.productConfig.basic.isOtherChecked} />
                                                            <Label className="text-xs cursor-pointer">{p.label}</Label>
                                                        </div>
                                                    ))}

                                                    {/* Opsi Other untuk Threshold */}
                                                    <div className={`col-span-2 flex items-center space-x-2 bg-white p-2 border rounded transition-all ${data.productConfig.basic.isOtherChecked ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}>
                                                        <Checkbox
                                                            id="other-threshold"
                                                            checked={data.productConfig.basic.isOtherChecked}
                                                            onCheckedChange={(checked) => {
                                                                handleProductChange('basic', 'isOtherChecked', !!checked);
                                                                if (checked) handleProductChange('basic', 'livenessThreshold', ""); // Kosongkan id standar
                                                            }}
                                                        />
                                                        <Label htmlFor="other-threshold" className="text-xs mr-2">Other</Label>
                                                        {data.productConfig.basic.isOtherChecked && (
                                                            <Input
                                                                className="h-7 text-xs flex-1 border-none focus-visible:ring-0 p-0"
                                                                placeholder="Input custom threshold..."
                                                                value={data.productConfig.basic.livenessThreshold}
                                                                onChange={(e) => handleProductChange('basic', 'livenessThreshold', e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Masking Threshold (DARI PDF) */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Masking Threshold</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {MASKING_THRESHOLD_OPTIONS.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.basic.maskingThreshold === p.id ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => handleProductChange('basic', 'maskingThreshold', p.id)}
                                                        >
                                                            <Checkbox checked={data.productConfig.basic.maskingThreshold === p.id} />
                                                            <Label className="text-xs cursor-pointer">{p.label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 4. Liveness Face Flow */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Liveness Face Flow</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {FACEFLOW_OPTIONS.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.basic.livenessFaceFlow === p.id ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => handleProductChange('basic', 'livenessFaceFlow', p.id)}
                                                        >
                                                            <Checkbox checked={data.productConfig.basic.livenessFaceFlow === p.id} />
                                                            <Label className="text-xs cursor-pointer">{p.label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* --- SECTION: UI SETUP --- */}
                                    <AccordionItem value="ui-setup" className="border rounded-lg bg-gray-50 overflow-hidden">
                                        <AccordionTrigger className="flex items-center justify-between py-4 px-5 hover:no-underline group data-[state=open]:border-b data-[state=open]:bg-white transition-all">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">UI Customization</span>
                                                {getStatusBadge('ui')} {/* TAMBAHKAN INI */}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-5 space-y-6">
                                            {/* 1. Toggle Screens (Show/Hide/Custom) */}
                                            {/* Onboarding, Loading, Result, Nav Bar, Footnote, Footer — dengan opsi Custom text */}
                                            {[
                                                { id: 'onboardingScreen', label: 'Onboarding Screen' },
                                                { id: 'loadingScreen', label: 'Loading Screen' },
                                                { id: 'resultScreen', label: 'Result Screen' },
                                                { id: 'navigationBar', label: 'Navigation Bar' },
                                                { id: 'footnote', label: 'Footnote' },
                                                { id: 'footer', label: 'Footer' },
                                            ].map((item) => {
                                                const currentVal = data.productConfig.ui[item.id as keyof typeof data.productConfig.ui] as string;
                                                const customTextKey = `${item.id}CustomText` as keyof typeof data.productConfig.ui;
                                                const isCustom = currentVal !== 'Show' && currentVal !== 'Hide';
                                                return (
                                                    <div key={item.id} className="space-y-2">
                                                        <Label className="font-bold text-gray-700 text-xs">{item.label}</Label>
                                                        <div className="flex gap-2">
                                                            {['Show', 'Hide'].map((val) => (
                                                                <div
                                                                    key={val}
                                                                    onClick={() => {
                                                                        handleProductChange('ui', item.id, val);
                                                                        handleProductChange('ui', customTextKey, '');
                                                                    }}
                                                                    className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${currentVal === val ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                        }`}
                                                                >
                                                                    <Checkbox checked={currentVal === val} />
                                                                    <Label className="text-xs cursor-pointer">{val}{val === 'Show' ? ' (Default)' : ''}</Label>
                                                                </div>
                                                            ))}
                                                            {/* Opsi Custom */}
                                                            <div
                                                                onClick={() => {
                                                                    if (!isCustom) handleProductChange('ui', item.id, 'Custom');
                                                                }}
                                                                className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${isCustom ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                    }`}
                                                            >
                                                                <Checkbox checked={isCustom} />
                                                                <Label className="text-xs cursor-pointer">Custom</Label>
                                                            </div>
                                                        </div>
                                                        {isCustom && (
                                                            <Input
                                                                className="h-7 text-xs bg-white"
                                                                placeholder={`Custom text for ${item.label}...`}
                                                                value={data.productConfig.ui[customTextKey] as string || ''}
                                                                onChange={(e) => handleProductChange('ui', customTextKey, e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* 2. Button Color Setup  */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Button Color (Hex)</Label>
                                                <div className="flex gap-2">
                                                    <div
                                                        onClick={() => handleProductChange('ui', 'buttonColor', 'Red')}
                                                        className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer ${data.productConfig.ui.buttonColor === 'Red' ? 'border-[#F8001A]' : ''}`}
                                                    >
                                                        <Checkbox checked={data.productConfig.ui.buttonColor === 'Red'} />
                                                        <Label className="text-xs">Red (Default)</Label>
                                                    </div>
                                                    <div className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white ${data.productConfig.ui.buttonColor !== 'Red' ? 'border-[#F8001A]' : ''}`}>
                                                        <Input
                                                            type="color"
                                                            className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                                            value={data.productConfig.ui.buttonColor === 'Red' ? '#F8001A' : data.productConfig.ui.buttonColor}
                                                            onChange={(e) => handleProductChange('ui', 'buttonColor', e.target.value)}
                                                        />
                                                        <Input
                                                            className="h-7 text-[10px] border-none p-0 focus-visible:ring-0"
                                                            placeholder="#Hex..."
                                                            value={data.productConfig.ui.buttonColor === 'Red' ? '' : data.productConfig.ui.buttonColor}
                                                            onChange={(e) => handleProductChange('ui', 'buttonColor', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Button Wording Setup  */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Button Wording</Label>
                                                <div className="flex gap-2">
                                                    <div
                                                        onClick={() => handleProductChange('ui', 'buttonWording', "I'm Ready!")}
                                                        className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer ${data.productConfig.ui.buttonWording === "I'm Ready!" ? 'border-[#F8001A]' : ''}`}
                                                    >
                                                        <Checkbox checked={data.productConfig.ui.buttonWording === "I'm Ready!"} />
                                                        <Label className="text-xs">"I'm Ready!" (Default)</Label>
                                                    </div>
                                                    <div className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white ${data.productConfig.ui.buttonWording !== "I'm Ready!" ? 'border-[#F8001A]' : ''}`}>
                                                        <Input
                                                            className="h-7 text-[10px] border-none p-0 focus-visible:ring-0"
                                                            placeholder="Custom wording..."
                                                            value={data.productConfig.ui.buttonWording === "I'm Ready!" ? '' : data.productConfig.ui.buttonWording}
                                                            onChange={(e) => handleProductChange('ui', 'buttonWording', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Face Scanner Shape  */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Face Scanner Shape</Label>
                                                <div className="flex gap-3">
                                                    {['Ellipse', 'Circle'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'faceScannerShape', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.faceScannerShape === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.faceScannerShape === val} />
                                                            <Label className="text-xs cursor-pointer">{val} {val === 'Ellipse' && '(Default)'}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Face Camera Overlay</Label>
                                                <div className="flex gap-3">
                                                    {['White', 'Transparent'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'frameOverlay', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.frameOverlay === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.frameOverlay === val} />
                                                            <Label className="text-xs cursor-pointer">{val} {val === 'Ellipse' && '(Default)'}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 5. Instruction Colors (Wording & Background)  */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Instruction Wording Color</Label>
                                                <div className="flex gap-3">
                                                    {['Black', 'White'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'instructionColor', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.instructionColor === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.instructionColor === val} />
                                                            <Label className="text-xs cursor-pointer">{val} {val === 'Black' && '(Default)'}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Instruction BG Color</Label>
                                                <div className="flex gap-3">
                                                    {['White', 'Black'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'instructionBg', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.instructionBg === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.instructionBg === val} />
                                                            <Label className="text-xs cursor-pointer">{val} {val === 'White' && '(Default)'}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Liveness Animation</Label>
                                                <div className="flex gap-3">
                                                    {['Show', 'Hide'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'livenessAnimation', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.livenessAnimation === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.livenessAnimation === val} />
                                                            <Label className="text-xs cursor-pointer">{val} {val === 'Show' && '(Default)'}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Liveness Countdown</Label>
                                                <div className="flex gap-3">
                                                    {['Show', 'Hide'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'livenessCountdown', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.livenessCountdown === val ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.livenessCountdown === val} />
                                                            <Label className="text-xs cursor-pointer">{val}{val === 'Show' ? ' (Default)' : ''}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Default Language */}
                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">Default Language</Label>
                                                <div className="flex gap-2">
                                                    {['Bahasa Indonesia', 'English'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => {
                                                                handleProductChange('ui', 'defaultLanguage', val);
                                                                handleProductChange('ui', 'defaultLanguageCustomText', '');
                                                            }}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.defaultLanguage === val ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                }`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.defaultLanguage === val} />
                                                            <Label className="text-xs cursor-pointer">{val}{val === 'Bahasa Indonesia' ? ' (Default)' : ''}</Label>
                                                        </div>
                                                    ))}
                                                    <div
                                                        onClick={() => {
                                                            if (data.productConfig.ui.defaultLanguage === 'Bahasa Indonesia' || data.productConfig.ui.defaultLanguage === 'English') {
                                                                handleProductChange('ui', 'defaultLanguage', 'Other');
                                                            }
                                                        }}
                                                        className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.defaultLanguage !== 'Bahasa Indonesia' && data.productConfig.ui.defaultLanguage !== 'English'
                                                            ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                            }`}
                                                    >
                                                        <Checkbox checked={data.productConfig.ui.defaultLanguage !== 'Bahasa Indonesia' && data.productConfig.ui.defaultLanguage !== 'English'} />
                                                        <Label className="text-xs cursor-pointer">Other</Label>
                                                    </div>
                                                </div>
                                                {data.productConfig.ui.defaultLanguage !== 'Bahasa Indonesia' && data.productConfig.ui.defaultLanguage !== 'English' && (
                                                    <Input
                                                        className="h-7 text-xs bg-white"
                                                        placeholder="Custom language..."
                                                        value={data.productConfig.ui.defaultLanguageCustomText || ''}
                                                        onChange={(e) => {
                                                            handleProductChange('ui', 'defaultLanguage', e.target.value || 'Other');
                                                            handleProductChange('ui', 'defaultLanguageCustomText', e.target.value);
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Support Android */}
                                            <div className="space-y-2">
                                                <Label className="font-bold text-gray-700 text-xs">Support Android</Label>
                                                <div className="flex gap-3">
                                                    {['Yes', 'No'].map((val) => (
                                                        <div
                                                            key={val}
                                                            onClick={() => handleProductChange('ui', 'supportAndroid', val)}
                                                            className={`flex-1 flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.ui.supportAndroid === val ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                }`}
                                                        >
                                                            <Checkbox checked={data.productConfig.ui.supportAndroid === val} />
                                                            <Label className="text-xs cursor-pointer">{val}{val === 'Yes' ? ' (Default)' : ''}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Random Instructions</Label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['Blink Eyes', 'Smile', 'Open Mouth', 'Nod Twice', 'Turn Left', 'Turn Right'].map((item) => (
                                                        <div
                                                            key={item}
                                                            onClick={() => toggleProductList('liveness', 'randomInstruction', item)}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer ${data.productConfig.liveness.randomInstruction.includes(item) ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.liveness.randomInstruction.includes(item)} />
                                                            <Label className="text-xs cursor-pointer">{item}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Face Validation</Label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['Face Detection', 'Face Position', 'Face Distance', 'Face Angle', 'Brightness Detection', 'Multiple Face Detection'].map((item) => (
                                                        <div
                                                            key={item}
                                                            onClick={() => toggleProductList('liveness', 'faceValidation', item)}
                                                            className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer ${data.productConfig.liveness.faceValidation.includes(item) ? 'border-[#F8001A]' : 'border-gray-200'}`}
                                                        >
                                                            <Checkbox checked={data.productConfig.liveness.faceValidation.includes(item)} />
                                                            <Label className="text-xs cursor-pointer">{item}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label className="font-bold text-gray-700 text-xs">Time Out (Seconds)</Label>
                                                    <Input
                                                        className="h-8 text-xs bg-white"
                                                        value={data.productConfig.liveness.timeout}
                                                        onChange={(e) => handleProductChange('liveness', 'timeout', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="font-bold text-gray-700 text-xs">Max Attempt</Label>
                                                    <Input
                                                        className="h-8 text-xs bg-white"
                                                        value={data.productConfig.liveness.maxAttempt}
                                                        onChange={(e) => handleProductChange('liveness', 'maxAttempt', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {(Object.keys(DEFAULTS.assets) as Array<keyof typeof DEFAULTS.assets>)
                                                .filter(key => !key.endsWith('ID') && !key.endsWith('EN')) // Filter agar link ID/EN tidak muncul sebagai baris baru
                                                .map((key) => {
                                                    const isLegal = key === 'termOfUse' || key === 'privacyPolicy';
                                                    const isDefault = data.productConfig.assets[key] === DEFAULTS.assets[key];

                                                    // Penentuan Label Default sesuai PDF 
                                                    const defaultLabel = isLegal
                                                        ? (key === 'termOfUse' ? "Privy Term of Use (Default)" : "Privy Privacy Policy (Default)")
                                                        : "Privy (Default)";

                                                    return (
                                                        <div key={key} className="space-y-3">
                                                            <Label className="font-bold text-gray-700 text-xs capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1')}
                                                            </Label>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                {/* OPSI DEFAULT */}
                                                                <div
                                                                    onClick={() => handleProductChange('assets', key, DEFAULTS.assets[key])}
                                                                    className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${isDefault ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                        }`}
                                                                >
                                                                    <Checkbox checked={isDefault} />
                                                                    <Label className="text-[11px] cursor-pointer">{defaultLabel}</Label>
                                                                </div>

                                                                {/* OPSI CUSTOM / OTHER */}
                                                                <div className={`flex flex-col space-y-2 p-2 border rounded bg-white transition-all ${!isDefault ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'
                                                                    }`}>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            checked={!isDefault}
                                                                            onCheckedChange={() => {
                                                                                if (isDefault) handleProductChange('assets', key, "Other");
                                                                            }}
                                                                        />
                                                                        <Label className="text-[11px]">Other</Label>
                                                                    </div>

                                                                    {!isDefault && (
                                                                        <div className="space-y-2 pt-1 border-t">
                                                                            {isLegal ? (
                                                                                // Layout Dua Input untuk Legal (ID & EN) 
                                                                                <>
                                                                                    <Input
                                                                                        className="h-7 text-[10px] bg-gray-50"
                                                                                        placeholder="(Link File ID)"
                                                                                        value={data.productConfig.assets[`${key}ID`]}
                                                                                        onChange={(e) => handleProductChange('assets', `${key}ID`, e.target.value)}
                                                                                    />
                                                                                    <Input
                                                                                        className="h-7 text-[10px] bg-gray-50"
                                                                                        placeholder="(Link File EN)"
                                                                                        value={data.productConfig.assets[`${key}EN`]}
                                                                                        onChange={(e) => handleProductChange('assets', `${key}EN`, e.target.value)}
                                                                                    />
                                                                                </>
                                                                            ) : (
                                                                                // Layout Satu Input untuk Asset Gambar 
                                                                                <Input
                                                                                    className="h-7 text-[10px] bg-gray-50"
                                                                                    placeholder="Link File Custom..."
                                                                                    value={data.productConfig.assets[key] === "Other" ? "" : data.productConfig.assets[key]}
                                                                                    onChange={(e) => handleProductChange('assets', key, e.target.value)}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* FOOTER BUTTONS - HANYA TOMBOL SUBMIT */}
                <div className="p-5 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 relative">
                    {activeTab === "basic" ? (
                        <Button
                            className="w-full bg-[#F8001A] hover:bg-[#C00014] h-12 text-white font-bold text-md"
                            onClick={() => setActiveTab("product")}
                        >
                            Next: Product Configuration <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            className="w-full bg-[#F8001A] hover:bg-[#C00014] h-12 text-white font-bold text-md"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                            {isSubmitting ? "Sending..." : "Save & Send to Admin"}
                        </Button>
                    )}
                </div>
            </div>

            {/* --- RIGHT PANEL: PREVIEW --- */}
            <div className="hidden md:flex flex-1 bg-gray-200 relative overflow-hidden flex-col items-center">
                {/* Zoom Controls */}
                <div className="absolute top-6 z-50 flex gap-3 bg-white p-2 rounded-full shadow-xl border border-gray-100">
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="w-4 h-4 text-gray-600" /></Button>
                    <span className="text-xs font-mono self-center w-12 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn className="w-4 h-4 text-gray-600" /></Button>
                </div>

                <div className="flex-1 overflow-y-auto w-full p-10 flex flex-col items-center gap-10">
                    <DocumentPreview
                        data={{
                            ...data,
                            // Substitusi nilai "TBC" untuk preview — sesuai flag tbcFields
                            trialPlanStg: data.tbcFields?.trialPlanStg ? "TBC" : data.trialPlanStg,
                            uat: data.tbcFields?.uat ? "TBC" : data.uat,
                            trialPlanProd: data.tbcFields?.trialPlanProd ? "TBC" : data.trialPlanProd,
                            liveOnMarket: data.tbcFields?.liveOnMarket ? "TBC" : data.liveOnMarket,
                            stgRequest: data.tbcFields?.stgRequest ? "TBC" : data.stgRequest,
                            expectedApproved: data.tbcFields?.expectedApproved ? "TBC" : data.expectedApproved,
                            expectedDeliverStg: data.tbcFields?.expectedDeliverStg ? "TBC" : data.expectedDeliverStg,
                            prodReq: data.tbcFields?.prodReq ? "TBC" : data.prodReq,
                            expectedDeliverProd: data.tbcFields?.expectedDeliverProd ? "TBC" : data.expectedDeliverProd,
                        }}
                        zoom={zoom}
                        listPicVe={listPicVe}
                        listPicBd={listPicBd}
                    />
                </div>
            </div>
            <Toaster position="top-center" richColors closeButton />
        </div>
    );
}