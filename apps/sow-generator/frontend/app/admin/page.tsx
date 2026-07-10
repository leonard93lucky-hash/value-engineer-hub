"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UpdateNotesPopup } from "@/components/update-notes-popup"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/constants"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAuth = async () => {
      const authenticated = sessionStorage.getItem("admin_authenticated")
      const storedAdminId = sessionStorage.getItem("admin_id")
      if (authenticated === "true" && storedAdminId) {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_id: storedAdminId }),
          })
          if (!res.ok) {
            sessionStorage.removeItem("admin_authenticated")
            sessionStorage.removeItem("admin_id")
          } else {
            setIsAuthenticated(true)
            setAdminId(storedAdminId)
            document.cookie = `admin_auth_token=1; path=/; max-age=86400; SameSite=Lax`
          }
        } catch {
          sessionStorage.removeItem("admin_authenticated")
          sessionStorage.removeItem("admin_id")
        }
      }
      setIsLoading(false)
    }
    checkAdminAuth()
  }, [])

  const handleLogin = (id: string) => {
    setIsAuthenticated(true)
    setAdminId(id)
    document.cookie = `admin_auth_token=1; path=/; max-age=86400; SameSite=Lax`
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated")
    sessionStorage.removeItem("admin_id")
    document.cookie = "admin_auth_token=; path=/; max-age=0"
    setIsAuthenticated(false)
    setAdminId("")
  }

  const handleAddNew = () => {
    // Arahkan ke halaman utama (form VE) di tab baru
    window.open("/", "_blank")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <AdminLogin onLogin={handleLogin} />
        <UpdateNotesPopup />
      </>
    )
  }

  return (
    <>
      <AdminDashboard
        adminId={adminId}
        onLogout={handleLogout}
        onAddNew={handleAddNew}
      />
      <UpdateNotesPopup />
    </>
  )
}
