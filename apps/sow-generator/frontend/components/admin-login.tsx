"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, FileText, AlertCircle, Lock, Zap } from "lucide-react"
import { API_BASE_URL, LOGO_URL } from "@/lib/constants"

interface AdminLoginProps {
  onLogin: (adminId: string) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [adminId, setAdminId] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isIframe, setIsIframe] = useState(false)

  useEffect(() => {
    setIsIframe(window !== window.top)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data) {
        throw new Error(data?.detail || "ID not recognized or server did not respond.")
      }

      if (data.status === "success") {
        sessionStorage.setItem("admin_authenticated", "true")
        sessionStorage.setItem("admin_id", adminId)
        onLogin(adminId)
      } else {
        throw new Error("Verification failed.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to contact the server.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {!isIframe && (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img src={LOGO_URL} alt="Privy" className="h-7 object-contain" />
          <div className="w-px h-5 bg-gray-300" />
          <span className="text-sm font-medium text-gray-500">Admin VE Support Panel</span>
        </div>
      </header>
      )}
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">

          {/* Left Side — Info */}
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Restricted Access
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Admin<br />
                <span className="text-red-500">VE Support</span><br />
                Dashboard
              </h1>
              <p className="text-base text-gray-500 leading-relaxed">
                A dedicated admin panel for managing, editing, and generating SOW documents from incoming submissions.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: <FileText className="w-4.5 h-4.5" />,
                  title: "Manage Submissions",
                  desc: "View all data from VE, edit, delete, or generate documents directly.",
                },
                {
                  icon: <ShieldCheck className="w-4.5 h-4.5" />,
                  title: "Secure Access",
                  desc: "ID verification is performed entirely on the server side — never exposed to the browser.",
                },
                {
                  icon: <Zap className="w-4.5 h-4.5" />,
                  title: "Instant Generation",
                  desc: "Create SOW documents for SDK Liveness & API PrivyPass in seconds.",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-500">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side — Login Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6 text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Login</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your Admin ID to access the dashboard
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminId" className="text-sm font-medium text-gray-700">Admin ID</Label>
                  <Input
                    id="adminId"
                    type="password"
                    placeholder="Enter Admin ID"
                    value={adminId}
                    onChange={(e) => {
                      setAdminId(e.target.value)
                      setError("")
                    }}
                    className="h-11 font-mono bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400/20"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-sm transition-all"
                  disabled={isLoading || !adminId}
                >
                  {isLoading ? "Verifying..." : "Sign in to Dashboard"}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  Admin ID is securely verified on the server side
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
