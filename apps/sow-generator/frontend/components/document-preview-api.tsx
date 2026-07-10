import { formatDateIndo, getRomanMonth, LOGO_HEADER, DEFAULTS } from "@/lib/constants";

interface DocumentPreviewApiProps {
    data: any;
    zoom: number;
    listPicVe: any[];
    listPicBd: any[];
}

export const DocumentPreviewApi = ({ data, zoom, listPicVe, listPicBd }: DocumentPreviewApiProps) => {
    const year = new Date(data.releaseDate).getFullYear();
    const romanMonth = getRomanMonth(data.releaseDate);
    const documentNumber = `SOW-${data.enterpriseInitial || "XXX"}-00/${String(data.revisionNumber).padStart(2, '0')}/${romanMonth}/${year}`;

    const getPicVeName = () => listPicVe.find(p => String(p.privy_id) === String(data.picVeId))?.name || "-";
    const getPicBdName = () => listPicBd.find(p => String(p.name) === String(data.picBdId))?.name || "-";
    const getPrivyId = () => listPicVe.find(p => String(p.privy_id) === String(data.picVeId))?.privy_id || "-";

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
                            <div className="text-[9pt] italic">API PrivyPass Document - {data.enterpriseName || "Enterprise"}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }} className="flex flex-col gap-10 pb-20 text-black font-sans">

            {/* PAGE 1: COVER */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] flex flex-col justify-between relative box-border border border-gray-300">
                <div className="absolute top-10 right-10">
                    <img src={LOGO_HEADER} alt="Logo" className="h-48 object-contain" />
                </div>
                <div className="mt-40 text-left">
                    <h1 className="text-4xl font-bold mb-4 leading-tight">Scope of Works<br />API PrivyPass Document - {data.enterpriseName || "[ENTERPRISE]"}</h1>
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

            {/* PAGE 2: CLIENT INFO & API SETUP */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />

                <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">Client Information</h3>
                <table className="w-full border-collapse border border-black text-xs mb-10">
                    <tbody>
                        <tr><td className="border border-black p-2 bg-gray-100 font-bold w-1/3">Company</td><td className="border border-black p-2" colSpan={3}>{data.enterpriseName}</td></tr>
                        <tr><td className="border border-black p-2 bg-gray-100 font-bold">Business Development</td><td className="border border-black p-2" colSpan={3}>{getPicBdName()}</td></tr>
                        <tr>
                            <td className="border border-black p-2 bg-gray-100 font-bold w-1/3">Value Engineering</td><td className="border border-black p-2 w-[30%]">{getPicVeName()}</td>
                            <td className="border border-black p-2 bg-gray-100 font-bold w-[15%]">PrivyID</td><td className="border border-black p-2">{getPrivyId()}</td>
                        </tr>
                    </tbody>
                </table>

                <h3 className="font-bold border-b-2 border-black mb-4 text-md uppercase">Application Setup</h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                        <tr><td className="border border-black p-2 bg-gray-100 font-bold w-1/3">Enterprise Name</td><td className="border border-black p-2">{data.enterpriseName}</td></tr>
                        <tr><td className="border border-black p-2 bg-gray-100 font-bold">Merchant Name</td><td className="border border-black p-2">{data.merchantName}</td></tr>
                        <tr><td className="border border-black p-2 bg-gray-100 font-bold">Application Name</td><td className="border border-black p-2">{data.applicationName || "-"}</td></tr>
                    </tbody>
                </table>
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 2</div>
            </div>

            {/* PAGE 3: PRODUCT FEATURES CONFIGURATION */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />
                <h3 className="font-bold border-b-2 border-black mb-4 text-md mt-6 uppercase">Product Features Configuration</h3>

                <div className="space-y-6">
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-gray-100 font-bold text-center">
                                <td className="border border-black p-2 w-[25%] text-left">Configuration</td>
                                <td className="border border-black p-2 w-[35%] text-left">Value</td>
                                <td className="border border-black p-2 w-[40%] text-left">Description</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Check Subscription Type</td>
                                <td className="border border-black p-2 capitalize">{data.productConfig.subscriptionType.join(", ") || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">
                                    <p>The type of subscription required for login access to Privy.</p>
                                    <ul>
                                        <li><strong>Purchase:</strong> User have Personal Plan</li>
                                        <li><strong>Freemium:</strong> User have Freemium plan (signing quota)</li>
                                    </ul>
                                    <p><strong>Note:</strong> If choose purchase, user who has freemium will be blocked.</p>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Data Share</td>
                                <td className="border border-black p-2">{data.productConfig.dataShare.join(", ") || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">
                                    <p>List of data shared with the merchant based on the merchant's request</p>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Expiration User</td>
                                <td className="border border-black p-2">{data.productConfig.expirationUser || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">
                                    <p>The time required for the user to complete confirmation through the Privy mobile application</p>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Send Notification</td>
                                <td className="border border-black p-2">{data.productConfig.sendNotification.join(", ") || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">
                                    <p>Notification channels that will be sent to the user</p>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Level Account</td>
                                <td className="border border-black p-2">{(data.productConfig.levelAccount || []).join(", ") || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">
                                    <ul>
                                        <li><strong>Verified Trusted : </strong>A user account with verified personal data and contact information.</li>
                                        <li><strong>Verified Untrusted : </strong>A user account with unverified personal data and contact information.</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Callback URL</td>
                                <td className="border border-black p-2 break-all">{data.productConfig.callbackUrl || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">Merchant URL to receive callback from Privy</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Deeplink Apps Merchant</td>
                                <td className="border border-black p-2 break-all">{data.productConfig.deeplink || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">Link for redirect to merchant application</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Purpose</td>
                                <td className="border border-black p-2">{data.productConfig.purpose || "-"}</td>
                                <td className="border border-black p-2 text-[8pt] text-gray-700">Purpose of merchant integrating with DigitalID</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 3</div>
            </div>

            {/* PAGE 4: TIMELINE & MILESTONES */}
            <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
                <RunningHeader />

                <h3 className="font-bold border-b-2 border-black mb-4 text-md uppercase">Timeline & Milestones</h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                        {/* Merchant Timeline */}
                        <tr className="bg-gray-100 font-bold">
                            <td className="border border-black p-2" colSpan={3}>Merchant Timeline</td>
                        </tr>
                        <tr><td className="border border-black p-2 font-bold w-1/3">Trial Plan on STG</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanStg)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">UAT Date</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.uat)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Trial Plan on PROD</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.trialPlanProd)}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Live on Market</td><td className="border border-black p-2" colSpan={2}>{formatDateIndo(data.liveOnMarket)}</td></tr>

                        {/* VE Internal Timeline */}
                        <tr className="bg-gray-100 font-bold">
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
                <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 4</div>
            </div>

        </div>
    );
};
