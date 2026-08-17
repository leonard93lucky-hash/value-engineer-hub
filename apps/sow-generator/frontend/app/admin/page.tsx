"use client"

import { Suspense, useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UpdateNotesPopup } from "@/components/update-notes-popup"
import { useRouter, useSearchParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/constants"

function AdminPageInner() {
  const searchParams = useSearchParams()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [hubAuthFailed, setHubAuthFailed] = useState(false)
  const router = useRouter()

  const runAuth = async () => {
    setHubAuthFailed(false)
    setIsLoading(true)

    const cachedAuth = sessionStorage.getItem("admin_authenticated")
    const cachedId = sessionStorage.getItem("admin_id")
    const urlUserId = searchParams.get("userId")
    const urlPosition = searchParams.get("position")

    // Fast path: sessionStorage valid dan tidak ada URL params baru dari hub
    if (cachedAuth === "true" && cachedId && !urlUserId) {
      setIsAuthenticated(true)
      setAdminId(cachedId)
      setIsLoading(false)
      return
    }

    // Dari hub: verifikasi via backend
    if (urlUserId && urlPosition) {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/verify-hub`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: urlUserId, position: urlPosition }),
        })
        if (res.ok) {
          const data = await res.json()
          const hubAdminId = data.admin_id
          sessionStorage.setItem("admin_authenticated", "true")
          sessionStorage.setItem("admin_id", hubAdminId)
          document.cookie = `admin_auth_token=1; path=/; max-age=86400; SameSite=Lax`
          setIsAuthenticated(true)
          setAdminId(hubAdminId)
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.delete("userId")
          currentUrl.searchParams.delete("userName")
          currentUrl.searchParams.delete("position")
          window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search)
          setIsLoading(false)
          return
        }
        // 401 = posisi bukan support, tampilkan AdminLogin
        if (res.status === 401) {
          setIsLoading(false)
          return
        }
      } catch { /* network error — tampilkan retry */ }

      // Gagal karena network/server error, bukan 401 → tampilkan retry bukan AdminLogin
      setHubAuthFailed(true)
      setIsLoading(false)
      return
    }

    // Akses langsung: verifikasi sessionStorage via backend
    if (cachedAuth === "true" && cachedId) {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_id: cachedId }),
        })
        if (res.ok) {
          setIsAuthenticated(true)
          setAdminId(cachedId)
          document.cookie = `admin_auth_token=1; path=/; max-age=86400; SameSite=Lax`
          setIsLoading(false)
          return
        }
      } catch { /* fall through */ }
      sessionStorage.removeItem("admin_authenticated")
      sessionStorage.removeItem("admin_id")
    }

    setIsLoading(false)
  }

  useEffect(() => { runAuth() }, [searchParams])

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  if (hubAuthFailed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-sm">Gagal terhubung ke server admin.</p>
          <button
            onClick={runAuth}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
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
      />
      <UpdateNotesPopup />
    </>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-300 text-sm animate-pulse">Loading...</div></div>}>
      <AdminPageInner />
    </Suspense>
  )
}
