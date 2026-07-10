"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UpdateNotesPopup } from "@/components/update-notes-popup"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Cek session storage apakah admin sudah login
    const authenticated = sessionStorage.getItem("admin_authenticated")
    const storedAdminId = sessionStorage.getItem("admin_id")
    if (authenticated === "true" && storedAdminId) {
      setIsAuthenticated(true)
      setAdminId(storedAdminId)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (id: string) => {
    setIsAuthenticated(true)
    setAdminId(id)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated")
    sessionStorage.removeItem("admin_id")
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
