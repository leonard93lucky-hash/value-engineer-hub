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
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      {!isIframe && (
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img src={LOGO_URL} alt="Privy" className="h-7 object-contain" />
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-medium text-muted-foreground">Admin VE Support Panel</span>
        </div>
      </header>
      )}
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">

          {/* Left Side — Info */}
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-danger-surface border border-danger/30 text-danger text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Restricted Access
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                Admin<br />
                <span className="text-danger">VE Support</span><br />
                Dashboard
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
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
                  <div className="w-9 h-9 rounded-lg bg-danger-surface border border-danger/20 flex items-center justify-center shrink-0 text-danger">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side — Login Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white border border-border rounded-2xl  p-8">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-danger-surface border border-danger/20 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6 text-danger" />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">Admin Login</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your Admin ID to access the dashboard
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminId" className="text-sm font-medium text-foreground">Admin ID</Label>
                  <Input
                    id="adminId"
                    type="password"
                    placeholder="Enter Admin ID"
                    value={adminId}
                    onChange={(e) => {
                      setAdminId(e.target.value)
                      setError("")
                    }}
                    className="h-11 font-mono bg-canvas border-input text-foreground placeholder:text-muted-foreground focus:border-danger/50 focus:ring-selection/20"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-danger bg-danger-surface border border-danger/30 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm transition-all"
                  disabled={isLoading || !adminId}
                >
                  {isLoading ? "Verifying..." : "Sign in to Dashboard"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
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
