import { formatDateIndo, getRomanMonth, LOGO_HEADER, DEFAULTS } from "@/lib/constants";

interface DocumentPreviewProps {
    data: any;
    zoom: number;
    listPicVe: any[];
    listPicBd: any[];
}

export const DocumentPreview = ({ data, zoom, listPicVe, listPicBd }: DocumentPreviewProps) => {
    // --- LOGIKA DERIVED DATA ---
    const year = new Date(data.releaseDate).getFullYear();
    const romanMonth = getRomanMonth(data.releaseDate);
    const documentNumber = `SOW-${data.enterpriseInitial || "XXX"}-${data.nomorUrut}/${data.revisionNumber}/${romanMonth}/${year}`;
    const hasCredentials = data.sdkType.length > 0;

    const appCleanName = data.sdkType
        .map((p: string) => (p === 'ios' ? 'SDK iOS' : p === 'android' ? 'SDK Android' : 'SDK Web'))
        .join(", ");

    const getPicVeName = () => listPicVe.find(p => String(p.id) === String(data.picVeId))?.name || "-";
    const getPicBdName = () => listPicBd.find(p => String(p.id) === String(data.picBdId))?.name || "-";
    const getPrivyId = () => listPicVe.find(p => String(p.id) === String(data.picVeId))?.privy_id || "-";

    const LOGO_URL = "/Privy_Logo_Red.png";

    const RunningHeader = () => (
        <div className="absolute top-0 left-0 w-full px-[20mm] pt-[10mm]">
            <table className="w-full border-collapse border-b-2 border-black">
                <tbody>
                    <tr>
                        <td className="pb-2 align-bottom w-1/2">
                            <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" />
                        </td>
                        <td className="pb-2 align-bottom w-1/2 text-right text-black">
                            <div className="text-[10pt] font-bold uppercase">Scope of Works</div>
                            <div className="text-[9pt] italic">SDK Liveness Document - {data.enterpriseName || "Enterprise"}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }} className="flex flex-col gap-10 pb-20 text-black font-arial">
            
            {/* PAGE 1: COVER */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] flex flex-col justify-between relative box-border border border-gray-300">
                <div className="absolute top-10 right-10">
                    <img src={LOGO_HEADER} alt="Logo" className="h-48 object-contain" />
                </div>
                <div className="mt-40 text-left">
                    <h1 className="text-4xl font-bold mb-4 leading-tight">Scope of Works<br />SDK Liveness Document - {data.enterpriseName || "[ENTERPRISE]"}</h1>
                </div>
                <div className="mb-20">
                    <table className="w-full text-m border-collapse">
                        <tbody>
                            <tr><td className="py-2 font-bold w-1/3">Document Number</td><td>{documentNumber}</td></tr>
                            <tr><td className="py-2 font-bold">Release Date</td><td>{formatDateIndo(data.releaseDate)}</td></tr>
                            <tr><td className="py-2 font-bold">Revision Number</td><td>{data.revisionNumber}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 1</div>
            </div>

            {/* PAGE 2: CLIENT INFO & APP SETUP */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />
                
                <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">Client Information</h3>
                <table className="w-full border-collapse border border-black text-xs mb-10">
                    <tbody>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold w-1/3">Company</td><td className="border border-black p-2" colSpan={3}>{data.enterpriseName}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">Business Development</td><td className="border border-black p-2" colSpan={3}>{getPicBdName()}</td></tr>
                        <tr>
                            <td className="border border-black p-2 bg-[#D9D9D9] font-bold w-1/3">Value Engineering</td><td className="border border-black p-2 w-[30%]">{getPicVeName()}</td>
                            <td className="border border-black p-2 bg-[#D9D9D9] font-bold w-[15%]">PrivyID</td><td className="border border-black p-2">{getPrivyId()}</td>
                        </tr>
                    </tbody>
                </table>

                <h3 className="font-bold border-b-2 border-black mb-4 text-md uppercase">Application Setup</h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold w-1/3">Enterprise Name</td><td className="border border-black p-2">{data.enterpriseName}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">Merchant Name</td><td className="border border-black p-2">{data.merchantName}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">Application Platform</td><td className="border border-black p-2">{appCleanName || "-"}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">Merchant Main App</td><td className="border border-black p-2">{data.merchantMainApps.join(", ")}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">RASP Config</td><td className="border border-black p-2">{data.rasp ? "Enabled" : "Disabled"}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">RGB Config</td><td className="border border-black p-2">{data.rgb ? "Enabled" : "Disabled"}</td></tr>
                        <tr><td className="border border-black p-2 bg-[#D9D9D9] font-bold">NFC Feature</td><td className="border border-black p-2">{data.nfc || "Non Active"}</td></tr>
                    </tbody>
                </table>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 2</div>
            </div>

            {/* PAGE 3: CORE CREDENTIALS */}
            {hasCredentials && (
                <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                    <RunningHeader />
                    <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">Core Credentials</h3>
                    <div className="space-y-6">
                        {data.sdkType.map((platform: string) => (
                            <table key={platform} className="w-full border-collapse border border-black text-xs">
                                <thead>
                                    <tr className="bg-[#D9D9D9] font-bold">
                                        <td className="border border-black p-2" colSpan={2}>
                                            {data.envType} – {platform === "ios" ? "SDK iOS" : platform === "android" ? "SDK Android" : "SDK Web"}
                                        </td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="border border-black p-2 font-bold w-1/3">Merchant Key</td><td className="border border-black p-2 font-mono">{(data.sdkCredentials as any)[platform].merchantKey || "-"}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold">Username</td><td className="border border-black p-2">{(data.sdkCredentials as any)[platform].username || "-"}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold">Password</td><td className="border border-black p-2 font-mono">{(data.sdkCredentials as any)[platform].password || "-"}</td></tr>
                                </tbody>
                            </table>
                        ))}
                    </div>
                    <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 3</div>
                </div>
            )}

           {/* PAGE 4: PRODUCT FEATURES CONFIGURATION */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />
                <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">Product Features Configuration</h3>

                <div className="space-y-6">
                    {/* BASIC SETUP */}
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-[#D9D9D9] font-bold"><th colSpan={3} className="border border-black p-2 text-left uppercase">Basic Setup</th></tr>
                            <tr className="bg-[#D9D9D9] font-bold text-center">
                                <td className="border border-black p-1 w-[30%]">Features</td>
                                <td className="border border-black p-1 w-[40%]">Value</td>
                                <td className="border border-black p-1">Description</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-1 px-2">Liveness Provider</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.basic.livenessProviders.join(", ")}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Liveness Threshold</td>
                                <td className="border border-black p-1 px-2">
                                    {data.productConfig.basic.isOtherChecked ? "Custom" : `${data.productConfig.basic.livenessThreshold} ${data.productConfig.basic.livenessThreshold === "50" ? "(Default for v3)" : "(For v2 & v1)"}`}
                                </td>
                                <td className="border border-black p-1 px-2 text-[8pt] text-gray-700">
                                    {data.productConfig.basic.isOtherChecked ? data.productConfig.basic.livenessThreshold : ""}
                                </td>
                            </tr>
                            <tr><td className="border border-black p-1 px-2">Masking Threshold</td><td className="border border-black p-1 px-2">{data.productConfig.basic.maskingThreshold}</td><td className="border border-black p-1"></td></tr>
                            <tr><td className="border border-black p-1 px-2">Liveness Face Flow</td><td className="border border-black p-1 px-2">{data.productConfig.basic.livenessFaceFlow}</td><td className="border border-black p-1"></td></tr>
                        </tbody>
                    </table>

                    {/* UI SETUP */}
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-[#D9D9D9] font-bold"><th colSpan={3} className="border border-black p-2 text-left uppercase">UI Setup</th></tr>
                            <tr className="bg-[#D9D9D9] font-bold text-center">
                                <td className="border border-black p-1 w-[30%]">Features</td>
                                <td className="border border-black p-1 w-[40%]">Value</td>
                                <td className="border border-black p-1">Description</td>
                            </tr>
                        </thead>
                        <tbody>
                            {([
                                { label: 'Onboarding Screen', field: 'onboardingScreen', customTextField: 'onboardingScreenCustomText' },
                                { label: 'Loading Screen', field: 'loadingScreen', customTextField: 'loadingScreenCustomText' },
                                { label: 'Result Screen', field: 'resultScreen', customTextField: 'resultScreenCustomText' },
                                { label: 'Navigation Bar', field: 'navigationBar', customTextField: 'navigationBarCustomText' },
                                { label: 'Footnote', field: 'footnote', customTextField: 'footnoteCustomText' },
                                { label: 'Footer', field: 'footer', customTextField: 'footerCustomText' },
                            ] as const).map(({ label, field, customTextField }) => {
                                const val = data.productConfig.ui[field] as string;
                                const isCustom = val !== 'Show' && val !== 'Hide';
                                const customText = data.productConfig.ui[customTextField] as string;
                                const displayVal = isCustom ? 'Custom' : val;
                                const description = isCustom ? (customText || '') : '';
                                return (
                                    <tr key={field}>
                                        <td className="border border-black p-1 px-2">{label}</td>
                                        <td className="border border-black p-1 px-2">{displayVal}</td>
                                        <td className="border border-black p-1 px-2 text-[8pt] text-gray-700">{description}</td>
                                    </tr>
                                );
                            })}
                            {[
                                { label: 'Button Color', val: data.productConfig.ui.buttonColor, def: DEFAULTS.ui.buttonColor },
                                { label: 'Button Wording', val: data.productConfig.ui.buttonWording, def: DEFAULTS.ui.buttonWording },
                            ].map(({ label, val, def }) => {
                                const isCustom = val !== def;
                                return (
                                    <tr key={label}>
                                        <td className="border border-black p-1 px-2">{label}</td>
                                        <td className="border border-black p-1 px-2">{isCustom ? "Custom" : val}</td>
                                        <td className="border border-black p-1 px-2 text-[8pt] text-gray-700 break-all">{isCustom ? val : ""}</td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td className="border border-black p-1 px-2">Face Scanner Shape</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.ui.faceScannerShape}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Face Camera Overlay</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.ui.frameOverlay}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Instruction Color</td>
                                <td className="border border-black p-1 px-2">Text: {data.productConfig.ui.instructionColor} | BG: {data.productConfig.ui.instructionBg}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Liveness Animation</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.ui.livenessAnimation}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Liveness Countdown</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.ui.livenessCountdown}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Default Language</td>
                                <td className="border border-black p-1 px-2">
                                    {data.productConfig.ui.defaultLanguage !== 'Bahasa Indonesia' && data.productConfig.ui.defaultLanguage !== 'English'
                                        ? "Custom"
                                        : data.productConfig.ui.defaultLanguage}
                                </td>
                                <td className="border border-black p-1 px-2 text-[8pt] text-gray-700 break-all">
                                    {data.productConfig.ui.defaultLanguage !== 'Bahasa Indonesia' && data.productConfig.ui.defaultLanguage !== 'English'
                                        ? (data.productConfig.ui.defaultLanguageCustomText || data.productConfig.ui.defaultLanguage) : ''}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 px-2">Support Android</td>
                                <td className="border border-black p-1 px-2">{data.productConfig.ui.supportAndroid}</td>
                                <td className="border border-black p-1"></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* LIVENESS & VALIDATION */}
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-[#D9D9D9] font-bold"><th colSpan={2} className="border border-black p-2 text-left uppercase">Liveness & Validation</th></tr>
                        </thead>
                        <tbody>
                            <tr><td className="border border-black p-1 px-2 w-[30%]">Random Instructions</td><td className="border border-black p-1 px-2">{data.productConfig.liveness.randomInstruction.join(", ")}</td></tr>
                            <tr><td className="border border-black p-1 px-2">Face Validation</td><td className="border border-black p-1 px-2">{data.productConfig.liveness.faceValidation.join(", ")}</td></tr>
                            <tr><td className="border border-black p-1 px-2">Time Out (Seconds)</td><td className="border border-black p-1 px-2">{data.productConfig.liveness.timeout}</td></tr>
                            <tr><td className="border border-black p-1 px-2">Max Attempt Liveness</td><td className="border border-black p-1 px-2">{data.productConfig.liveness.maxAttempt}x</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 4</div>
            </div>

            {/* PAGE 5: ASSET SETUP */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />
                <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">F. Assets & Legal Documents</h3>
                
                {/* ASSET SETUP */}
                <table className="w-full border-collapse border border-black text-[9pt]">
                    <thead>
                        <tr className="bg-[#D9D9D9] font-bold text-center">
                            <td className="border border-black p-1 w-[30%]">Features</td>
                            <td className="border border-black p-1 w-[40%]">Value</td>
                            <td className="border border-black p-1">Description</td>
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.keys(DEFAULTS.assets) as Array<keyof typeof DEFAULTS.assets>)
                            .filter(key => !key.endsWith('ID') && !key.endsWith('EN'))
                            .map((key) => {
                                const val = data.productConfig.assets[key];
                                const isLegal = key === 'termOfUse' || key === 'privacyPolicy';
                                const isDefault = val === DEFAULTS.assets[key];
                                
                                let valueCol = isDefault ? val : "Custom";
                                if (isDefault) {
                                    if (key === 'termOfUse') valueCol = "Privy Term of Use (Default)";
                                    else if (key === 'privacyPolicy') valueCol = "Privy Privacy Policy (Default)";
                                    else valueCol = "Privy (Default)";
                                }
                                
                                let descriptionCol = "";
                                if (!isDefault) {
                                    if (isLegal && val === "Other") {
                                        descriptionCol = `ID: ${data.productConfig.assets[(key + "ID") as keyof typeof DEFAULTS.assets] || "-"} | EN: ${data.productConfig.assets[(key + "EN") as keyof typeof DEFAULTS.assets] || "-"}`;
                                    } else {
                                        descriptionCol = val;
                                    }
                                }

                                return (
                                    <tr key={key}>
                                        <td className="border border-black p-1 px-2 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1')}
                                        </td>
                                        <td className="border border-black p-1 px-2 break-all text-[8pt]">
                                            {valueCol}
                                        </td>
                                        <td className="border border-black p-1 px-2 break-all text-[8pt] text-gray-700">
                                            {descriptionCol}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 5</div>
            </div>

            {/* PAGE 6: TIMELINE & MILESTONES */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />
                
                <h3 className="font-bold border-b-2 border-black mb-4 text-md uppercase">Timeline & Milestones</h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                        {/* Merchant Timeline */}
                        <tr className="bg-[#D9D9D9] font-bold">
                            <td className="border border-black p-2" colSpan={3}>Merchant Timeline</td>
                        </tr>
                        <tr><td className="border border-black p-2 font-bold w-1/3">Trial Plan on STG</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanStg)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">UAT Date</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.uat)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Trial Plan on PROD</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanProd)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Live on Market</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.liveOnMarket)}</td></tr>

                        {/* VE Internal Timeline */}
                        <tr className="bg-[#D9D9D9] font-bold">
                            <td className="border border-black p-2" colSpan={3}>Value Engineering Timeline (Internal)</td>
                        </tr>
                        <tr><td className="border border-black p-2 font-bold">STG Request</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.stgRequest)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Expected Approved</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.expectedApproved)}</td></tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">Expected Deliver STG</td>
                            <td className="border border-black p-2">{formatDateIndo(data.expectedDeliverStg)}</td>
                            <td className="border border-black p-2 italic text-gray-500 text-[9px]">Max D+2 Request</td>
                        </tr>
                        <tr><td className="border border-black p-2 font-bold">PROD Request</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.prodReq)}</td></tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">Expected Deliver PROD</td>
                            <td className="border border-black p-2">{formatDateIndo(data.expectedDeliverProd)}</td>
                            <td className="border border-black p-2 italic text-gray-500 text-[9px]">Max D+2 Request</td>
                        </tr>
                    </tbody>
                </table>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 6</div>
            </div>


        </div>
    );
};