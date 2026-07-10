"use client"

import React from "react"
import { formatDateIndo } from "@/lib/constants"

interface CredentialService {
  service_type: string
  username?: string
  password?: string
  merchant_key?: string
  url?: string
  api_key?: string
  secret_key?: string
  channel_id?: string
  enterprise_token?: string
  base_url?: string
  doc_owner?: string
  ip_address?: string
  avengers?: boolean
  general?: boolean
  connect?: boolean
}

interface CredentialPreviewProps {
  data: {
    picVeId: string
    enterpriseName: string
    merchantName: string
    environment: string
    revisionNumber: string
    createdDate: string
    services: CredentialService[]
  }
  listPicVe: any[]
  zoom?: number
}

const LOGO_URL = "/Privy_Logo_Red.png"
const LOGO_HEADER = "/privy_sow_side.png"

export function CredentialPreview({ data, listPicVe, zoom = 1 }: CredentialPreviewProps) {
  const getPicVeName = () => {
    const p = listPicVe.find(x => x.privy_id === data.picVeId)
    return p ? p.name : "-"
  }

  const listServiceStr = data.services.map(s => s.service_type).join(", ") || "—"

  // Running header shared across content pages
  const RunningHeader = () => (
    <div className="absolute top-0 left-0 w-full px-[20mm] pt-[10mm]">
      <table className="w-full border-collapse border-b-2 border-black">
        <tbody>
          <tr>
            <td className="pb-2 align-bottom w-1/2">
              <img src={LOGO_URL} alt="Privy Logo" className="h-10 object-contain" />
            </td>
            <td className="pb-2 align-bottom w-1/2 text-right text-black">
              <div className="text-[10pt] font-bold uppercase">Credential Document</div>
              <div className="text-[9pt] italic">{data.enterpriseName || "Enterprise"}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}
      className="flex flex-col gap-10 pb-20 text-black"
    >

      {/* PAGE 1: COVER */}
      <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-[25mm] flex flex-col justify-between relative box-border border border-gray-300 overflow-hidden">

        {/* Privy brand header - top right */}
        <div className="absolute top-10 right-10">
          <img src={LOGO_HEADER} alt="Privy" className="h-48 object-contain" />
        </div>

        {/* Fingerprint watermark - center-left background */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-60%, -50%)",
            width: 380,
            height: 520,
            opacity: 0.12,
            backgroundImage: "url('/privy-fingerprint.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Main title — centered vertically */}
        <div className="mt-40 text-center">
          <h1 className="text-4xl font-bold leading-tight">
            Credential Document<br />
            {data.enterpriseName || "[ENTERPRISE]"}
          </h1>
        </div>

        <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 1</div>
      </div>

      {/* PAGE 2: CREDENTIALS */}
      <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[20mm] pt-[30mm] box-border text-[10pt] leading-snug relative border border-gray-300">
        <RunningHeader />

        {/* Document History */}
        <h3 className="font-bold border-b-2 border-black mb-4 text-[11pt] mt-6 uppercase">Document History</h3>
        <table className="w-full border-collapse border border-black text-xs mb-8">
          <thead>
            <tr className="bg-[#D8D8D8]">
              <th className="border border-black p-2 text-left font-bold w-[18%]">Date</th>
              <th className="border border-black p-2 text-left font-bold w-[12%]">Version</th>
              <th className="border border-black p-2 text-left font-bold">Description</th>
              <th className="border border-black p-2 text-left font-bold w-[25%]">PIC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">{formatDateIndo(data.createdDate) || "—"}</td>
              <td className="border border-black p-2 align-top">{data.revisionNumber || "00"}</td>
              <td className="border border-black p-2 align-top">
                Create Privy Credential {data.environment || "Staging"} for {data.merchantName || "—"}
              </td>
              <td className="border border-black p-2 align-top">{getPicVeName()}</td>
            </tr>
          </tbody>
        </table>

        {/* Section heading */}
        <h3 className="font-bold border-b-2 border-black mb-6 text-[11pt] uppercase">
          Credentials Information — {data.environment || "Staging"}
          {listServiceStr !== "—" && (
            <span className="font-normal normal-case text-[9pt] ml-2 text-gray-600">{listServiceStr}</span>
          )}
        </h3>

        {data.services.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded text-sm">
            No services selected yet.
          </div>
        ) : (
          <div className="space-y-6">
            {data.services.map((svc) => (
              <div key={svc.service_type}>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-[#D8D8D8]">
                      <td className="border border-black p-2 font-bold w-[35%]">Credentials</td>
                      <td className="border border-black p-2 font-bold">{data.environment || "Staging"} — {svc.service_type}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-black p-2">Username</td><td className="border border-black p-2 font-mono">{svc.username || "—"}</td></tr>
                    <tr><td className="border border-black p-2">Password</td><td className="border border-black p-2 font-mono">{svc.password || "—"}</td></tr>
                    {svc.avengers && (
                      <>
                        <tr><td className="border border-black p-2">Merchant-Key</td><td className="border border-black p-2 font-mono">{svc.merchant_key || "—"}</td></tr>
                        <tr><td className="border border-black p-2">URL</td><td className="border border-black p-2 break-all">{svc.url || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Channel Id</td><td className="border border-black p-2 font-mono">{svc.channel_id || "—"}</td></tr>
                      </>
                    )}
                    {svc.general && (
                      <>
                        <tr><td className="border border-black p-2">Apikey</td><td className="border border-black p-2 font-mono">{svc.api_key || "—"}</td></tr>
                        <tr><td className="border border-black p-2">SecretKey</td><td className="border border-black p-2 font-mono">{svc.secret_key || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Channel Id</td><td className="border border-black p-2 font-mono">{svc.channel_id || "—"}</td></tr>
                        <tr><td className="border border-black p-2">enterpriseToken</td><td className="border border-black p-2 font-mono">{svc.enterprise_token || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Base URL</td><td className="border border-black p-2 break-all">{svc.base_url || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Doc Owner</td><td className="border border-black p-2">{svc.doc_owner || "—"}</td></tr>
                        <tr><td className="border border-black p-2">IP Address</td><td className="border border-black p-2 font-mono">{svc.ip_address || "—"}</td></tr>
                      </>
                    )}
                    {svc.connect && (
                      <>
                        <tr><td className="border border-black p-2">Merchant-Key</td><td className="border border-black p-2 font-mono">{svc.merchant_key || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Enterprise Token</td><td className="border border-black p-2 font-mono">{svc.enterprise_token || "—"}</td></tr>
                        <tr><td className="border border-black p-2">Base URL</td><td className="border border-black p-2 break-all">{svc.base_url || "—"}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        <div className="absolute bottom-6 right-8 text-xs text-gray-400 font-mono">Page 2</div>
      </div>

    </div>
  )
}
