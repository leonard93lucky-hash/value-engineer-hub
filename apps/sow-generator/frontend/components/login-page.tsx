"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, FileText, Shield, AlertCircle } from "lucide-react"

import { API_BASE_URL } from "@/lib/constants"

interface LoginPageProps {
  onLogin: (userName: string, userId: number) => void // Updated to pass ID too
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Ganti bagian try-catch di handleSubmit dengan ini:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/verify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: accessCode }),
      });

      // Pastikan respon dari server adalah JSON yang valid
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error(data?.detail || "Server memberikan respon tidak valid atau mati.");
      }

      // Cek keberadaan data.status secara aman
      if (data && data.status === "success" && data.user) {
        const { name, id } = data.user;
        sessionStorage.setItem("ve_authenticated", "true");
        sessionStorage.setItem("ve_userName", name);
        sessionStorage.setItem("ve_userId", String(id));
        onLogin(name, id);
      } else {
        throw new Error("Format data dari server tidak sesuai.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">VE Document Generator</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Internal Tool
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
                Value Engineer Document Generator
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate professional project specification documents with live preview.
                Integrated with Database System for seamless workflow automation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Live Document Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview dokumen dalam format Word secara real-time saat mengisi form
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Secure Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Login menggunakan <strong>Privy ID</strong> resmi yang terdaftar di database Master Data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="lg:justify-self-end w-full max-w-md">
            <Card className="border-border shadow-lg">
              <CardHeader className="space-y-1">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-foreground" />
                </div>
                <CardTitle className="text-2xl">Akses Aplikasi</CardTitle>
                <CardDescription>
                  Masukkan <strong>Privy ID</strong> Anda untuk melanjutkan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessCode">Privy ID</Label>
                    <Input
                      id="accessCode"
                      type="text"
                      placeholder="Contoh: VE001"
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value)
                        setError("")
                      }}
                      className="h-11 font-mono"
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading || !accessCode}
                  >
                    {isLoading ? "Memverifikasi..." : "Masuk"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Privy ID akan dicocokkan dengan Master Data di database.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Value Engineer Internal Tool</p>
          <div className="flex items-center gap-4">
            <p>Secure Access Only</p>
            <a
              href="/admin"
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
