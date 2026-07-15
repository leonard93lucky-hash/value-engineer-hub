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
    API_BASE_URL,
    ENV_TYPE_OPTIONS,
    LOGO_URL
} from "@/lib/constants";

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

import { DocumentPreviewApi } from "./document-preview-api";

const PRIVYPASS_DEFAULTS = {
    subscriptionType: ["purchase", "freemium"],
    dataShare: ["PrivyID", "Fullname", "Email", "Phone", "Date of Birth", "Selfie Image", "KTP Image"],
    expirationUser: "5 Minutes",
    sendNotification: ["Email"],
    levelAccount: ["Verified Trusted"],
    callbackUrl: "",
    deeplink: "",
    purpose: ""
};

const initialFormData = {
    picVeId: "",
    picBdId: "",
    enterpriseName: "",
    enterpriseInitial: "",
    merchantName: "",
    applicationName: "", // new field for API Privypass
    releaseDate: new Date().toISOString().split("T")[0],
    envType: "Staging",
    revisionNumber: "00",

    trialPlanStg: "",
    uat: "",
    trialPlanProd: "",
    liveOnMarket: "",
    stgRequest: "",
    expectedApproved: "",
    expectedDeliverStg: "",
    prodReq: "",
    expectedDeliverProd: "",

    // TBC flags
    tbcFields: {} as Record<string, boolean>,

    productConfig: {
        subscriptionType: [...PRIVYPASS_DEFAULTS.subscriptionType],
        dataShare: [...PRIVYPASS_DEFAULTS.dataShare],
        expirationUser: PRIVYPASS_DEFAULTS.expirationUser,
        sendNotification: [...PRIVYPASS_DEFAULTS.sendNotification],
        levelAccount: PRIVYPASS_DEFAULTS.levelAccount,
        callbackUrl: PRIVYPASS_DEFAULTS.callbackUrl,
        deeplink: PRIVYPASS_DEFAULTS.deeplink,
        purpose: PRIVYPASS_DEFAULTS.purpose,
        isExpirationOther: false
    },
};

interface FormApiPrivypassProps {
    onLogout?: () => void;
    currentUser?: any;
    onBack?: () => void;
}

export default function FormApiPrivypass({ onLogout, currentUser, onBack }: FormApiPrivypassProps) {
    const [data, setData] = useState(initialFormData);
    const [activeTab, setActiveTab] = useState("basic");
    const [listPicVe, setListPicVe] = useState<any[]>([]);
    const [listPicBd, setListPicBd] = useState<any[]>([]);
    const [zoom, setZoom] = useState(0.9);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        setIsIframe(window !== window.top);
    }, []);

    useEffect(() => {
        if (data.envType === "Staging") {
            setData(prev => ({ ...prev, revisionNumber: "00" }));
        } else {
            setData(prev => ({ ...prev, revisionNumber: "01" }));
        }
    }, [data.envType]);

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

    useEffect(() => {
        if (currentUser && currentUser.privy_id) {
            setData(prev => ({ ...prev, picVeId: currentUser.privy_id }));
        } else {
            setData(prev => ({ ...prev, picVeId: "" }));
        }
    }, [currentUser]);

    const handleChange = (field: string, value: any) => setData((prev) => ({ ...prev, [field]: value }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "enterpriseInitial") setData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        else setData(prev => ({ ...prev, [name]: value }));
    }

    const getPrivyId = () => listPicVe.find(p => p.privy_id === data.picVeId)?.privy_id || "-";

    const handleSubmit = async () => {
        const mandatoryFields = [
            { key: "picVeId", label: "PIC VE" },
            { key: "picBdId", label: "PIC BD" },
            { key: "enterpriseName", label: "Enterprise Name" },
            { key: "merchantName", label: "Merchant Name" },
            { key: "applicationName", label: "Application Name" },
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

        if (data.productConfig.subscriptionType.length === 0) {
            toast.error("Please select at least one Subscription Type!");
            setActiveTab("product");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Processing data. Please wait...");
        try {
            const payload = {
                pic_ve_id: data.picVeId,
                pic_bd_id: data.picBdId,
                created_by: getPrivyId(),
                enterprise_name: data.enterpriseName,
                enterprise_initial: "",
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
                rasp: false,
                rgb: false,
                nfc: "Non Active",
                sdk_list: [],
                app_list: [{ app_name: data.applicationName }], // Mapping application name kesini
                product_config: data.productConfig,
                kategori: "api_privypass" // EXPLICIT CATEGORY
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
                description: "API Privypass data has been added to the Admin queue.",
                duration: 5000,
            });

            setData({ ...initialFormData, picVeId: currentUser?.privy_id || "" });
            setActiveTab("basic");
            fetchMasterData();

        } catch (err: any) {
            toast.error("Failed to Submit Data", {
                id: toastId,
                description: err.message || "An error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductChange = (field: string, value: any) => {
        setData((prev) => ({
            ...prev,
            productConfig: {
                ...prev.productConfig,
                [field]: value
            }
        }));
    };

    const toggleProductList = (field: string, item: string) => {
        const currentList = (data.productConfig as any)[field] as string[];
        const newList = currentList.includes(item)
            ? currentList.filter(i => i !== item)
            : [...currentList, item];
        handleProductChange(field, newList);
    };

    const isDefault = () => {
        const c = data.productConfig;
        const d = PRIVYPASS_DEFAULTS;
        return (
            JSON.stringify(c.subscriptionType) === JSON.stringify(d.subscriptionType) &&
            JSON.stringify(c.dataShare) === JSON.stringify(d.dataShare) &&
            c.expirationUser === d.expirationUser &&
            JSON.stringify(c.sendNotification) === JSON.stringify(d.sendNotification) &&
            JSON.stringify(c.levelAccount) === JSON.stringify(d.levelAccount) &&
            c.callbackUrl === d.callbackUrl &&
            c.deeplink === d.deeplink &&
            c.purpose === d.purpose
        );
    }

    return (
        <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
            <div className="w-full md:w-[45%] md:min-w-[500px] bg-white md:border-r flex flex-col z-10 shadow-xl h-full">
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
                        <FileText className="w-6 h-6 text-[#F8001A]" /> SOW API Privypass
                    </h2>
                </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col px-6 w-full max-w-2xl mx-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="sticky top-0 z-30 bg-white border-b pt-4 pb-2 shadow-sm">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="product" className="gap-2">
                                    API Specs
                                    <Badge variant={isDefault() ? 'secondary' : 'destructive'} className="h-4 text-[10px]">
                                        {isDefault() ? 'Default' : 'Custom'}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-6 pb-20 custom-scrollbar">
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

                                    <div className="space-y-1"><Label>Enterprise Name</Label><Input name="enterpriseName" value={data.enterpriseName} onChange={handleInputChange} placeholder="e.g. PT.XYZ" /></div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label>Initial (3 Char)</Label><Input name="enterpriseInitial" value={data.enterpriseInitial} onChange={handleInputChange} maxLength={3} className="uppercase font-mono" placeholder="Filled in by Admin" disabled /></div>
                                        <div className="space-y-1"><Label>Merchant Name</Label><Input name="merchantName" value={data.merchantName} onChange={handleInputChange} placeholder="e.g. Merchant Name" /></div>
                                    </div>

                                    <div className="space-y-1"><Label>Application Name</Label><Input name="applicationName" value={data.applicationName} onChange={handleInputChange} placeholder="e.g. Merchant App Name" /></div>

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

                            <TabsContent value="product" className="mt-0 space-y-6 pb-10 focus-visible:outline-none">
                                <Accordion type="single" defaultValue="api-specs" collapsible className="w-full space-y-4">
                                    <AccordionItem value="api-specs" className="border rounded-lg bg-gray-50 overflow-hidden">
                                        <AccordionTrigger className="flex items-center justify-between py-4 px-5 hover:no-underline group data-[state=open]:border-b data-[state=open]:bg-white transition-all">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">API Configuration</span>
                                                {!isDefault() && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">Custom</span>}
                                                {isDefault() && <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">Default</span>}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-5 space-y-5">
                                            {/* Subscription Type */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Subscription Type</Label>
                                                <div className="flex gap-3">
                                                    {["purchase", "freemium"].map((p) => (
                                                        <div
                                                            key={p}
                                                            className={`flex items-center space-x-2 p-2 px-3 border rounded bg-white cursor-pointer transition-all ${data.productConfig.subscriptionType.includes(p) ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => toggleProductList('subscriptionType', p)}
                                                        >
                                                            <Checkbox checked={data.productConfig.subscriptionType.includes(p)} />
                                                            <Label className="text-xs cursor-pointer capitalize">{p} {PRIVYPASS_DEFAULTS.subscriptionType.includes(p) ? "" : ""}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Data Share */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Data Share</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {["PrivyID", "Fullname", "Email", "Phone", "Date of Birth", "Selfie Image", "KTP Image", "Active Subscription", "Enterprise Account status"].map((p) => {
                                                        const isDef = PRIVYPASS_DEFAULTS.dataShare.includes(p);
                                                        return (
                                                            <div
                                                                key={p}
                                                                className={`flex items-center space-x-2 p-2 border rounded bg-white cursor-pointer transition-all ${data.productConfig.dataShare.includes(p) ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                                onClick={() => toggleProductList('dataShare', p)}
                                                            >
                                                                <Checkbox checked={data.productConfig.dataShare.includes(p)} />
                                                                <Label className="text-xs cursor-pointer">{p} {isDef ? "(Default)" : ""}</Label>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Expiration User */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Expiration User</Label>
                                                <div className="flex gap-3">
                                                    <div
                                                        className={`flex items-center space-x-2 p-2 px-3 border rounded bg-white cursor-pointer transition-all ${!data.productConfig.isExpirationOther ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                        onClick={() => {
                                                            handleProductChange('isExpirationOther', false);
                                                            handleProductChange('expirationUser', "5 Minutes");
                                                        }}
                                                    >
                                                        <Checkbox checked={!data.productConfig.isExpirationOther} />
                                                        <Label className="text-xs cursor-pointer">5 Minutes (Default)</Label>
                                                    </div>

                                                    <div className={`flex flex-1 items-center space-x-2 bg-white p-2 border rounded transition-all ${data.productConfig.isExpirationOther ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}>
                                                        <Checkbox
                                                            id="other-expiration"
                                                            checked={data.productConfig.isExpirationOther}
                                                            onCheckedChange={(checked) => {
                                                                handleProductChange('isExpirationOther', !!checked);
                                                                if (checked) handleProductChange('expirationUser', "");
                                                                else handleProductChange('expirationUser', "5 Minutes");
                                                            }}
                                                        />
                                                        <Label htmlFor="other-expiration" className="text-xs mr-2">Other</Label>
                                                        {data.productConfig.isExpirationOther && (
                                                            <Input
                                                                className="h-7 text-xs flex-1 border-none focus-visible:ring-0 p-0"
                                                                placeholder="e.g., 10 Minutes..."
                                                                value={data.productConfig.expirationUser}
                                                                onChange={(e) => handleProductChange('expirationUser', e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Send Notification */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Send Notification</Label>
                                                <div className="flex gap-3">
                                                    {["Email", "SMS"].map((p) => (
                                                        <div
                                                            key={p}
                                                            className={`flex items-center space-x-2 p-2 px-4 border rounded bg-white cursor-pointer transition-all ${data.productConfig.sendNotification.includes(p) ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => toggleProductList('sendNotification', p)}
                                                        >
                                                            <Checkbox checked={data.productConfig.sendNotification.includes(p)} />
                                                            <Label className="text-xs cursor-pointer">{p} {PRIVYPASS_DEFAULTS.sendNotification.includes(p) ? "(Default)" : ""}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Level Account */}
                                            <div className="space-y-3">
                                                <Label className="font-bold text-gray-700 text-xs">Level Account</Label>
                                                <div className="flex gap-3">
                                                    {["Verified Trusted", "Verified Untrusted"].map((p) => (
                                                        <div
                                                            key={p}
                                                            className={`flex items-center space-x-2 p-2 px-4 border rounded bg-white cursor-pointer transition-all ${data.productConfig.levelAccount.includes(p) ? 'border-[#F8001A] ring-1 ring-[#F8001A]/10' : 'border-gray-200'}`}
                                                            onClick={() => toggleProductList('levelAccount', p)}
                                                        >
                                                            <Checkbox checked={data.productConfig.levelAccount.includes(p)} />
                                                            <Label className="text-xs cursor-pointer">{p} {PRIVYPASS_DEFAULTS.levelAccount.includes(p) ? "(Default)" : ""}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Callback URL */}
                                            <div className="space-y-1">
                                                <Label className="font-bold text-gray-700 text-xs">Callback URL</Label>
                                                <Input
                                                    placeholder="e.g., https://api.merchant.com/callback"
                                                    value={data.productConfig.callbackUrl}
                                                    onChange={e => handleProductChange("callbackUrl", e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>

                                            {/* Deeplink Merchant */}
                                            <div className="space-y-1">
                                                <Label className="font-bold text-gray-700 text-xs">Deeplink Merchant</Label>
                                                <Input
                                                    placeholder="e.g., merchantapp://redirect"
                                                    value={data.productConfig.deeplink}
                                                    onChange={e => handleProductChange("deeplink", e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>

                                            {/* Purpose */}
                                            <div className="space-y-1">
                                                <Label className="font-bold text-gray-700 text-xs">Purpose</Label>
                                                <Input
                                                    placeholder="Input purpose..."
                                                    value={data.productConfig.purpose}
                                                    onChange={e => handleProductChange("purpose", e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>

                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* BOTTOM FIXED BAR */}
                <div className="p-5 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 relative">
                    {activeTab === "basic" ? (
                        <Button
                            className="w-full bg-[#F8001A] hover:bg-[#D00015] h-12 text-white font-bold text-md rounded-xl"
                            onClick={() => setActiveTab("product")}
                        >
                            Next: API Configuration <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-[#F8001A] hover:bg-[#D00015] h-12 text-white shadow-md hover:shadow-lg transition-all rounded-xl font-bold flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Submit Request</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* --- RIGHT PANEL: PREVIEW --- */}
            <div className="hidden md:flex flex-1 bg-gray-200 relative overflow-hidden flex-col items-center">
                <div className="absolute top-6 z-50 flex gap-3 bg-white p-2 rounded-full shadow-xl border border-gray-100">
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="w-4 h-4 text-gray-600" /></Button>
                    <span className="text-xs font-mono self-center w-12 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}><ZoomIn className="w-4 h-4 text-gray-600" /></Button>
                </div>

                <div className="flex-1 overflow-y-auto w-full p-10 flex flex-col items-center gap-10">
                    <DocumentPreviewApi
                        data={{
                            ...data,
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

