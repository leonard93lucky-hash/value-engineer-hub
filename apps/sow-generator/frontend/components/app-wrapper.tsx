"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import FormValueEngineer from "@/components/form-value-engineer"
import FormApiPrivypass from "@/components/form-api-privypass"
import FormCredential from "@/components/form-credential"
import { LandingPage } from "@/components/landing-page"
import { UpdateNotesPopup } from "@/components/update-notes-popup"
import { API_BASE_URL } from "@/lib/constants"

export function AppWrapper() {
  const searchParams = useSearchParams()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<"SDK" | "API" | "CREDENTIAL" | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const urlUserId = searchParams.get("userId")
      const urlUserName = searchParams.get("userName")
      
      if (urlUserId && urlUserName) {
        try {
          const res = await fetch(`${API_BASE_URL}/verify-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_code: urlUserId }),
          })
          if (!res.ok) throw new Error("Invalid user")
          const data = await res.json()
          const verifiedUser = {
            ...data.user,
            id: data.user.privy_id || urlUserId,
            name: data.user.name || urlUserName,
          }
          setIsAuthenticated(true)
          setCurrentUser(verifiedUser)
          sessionStorage.setItem("ve_authenticated", "true")
          sessionStorage.setItem("ve_user", JSON.stringify(verifiedUser))
          document.cookie = `ve_auth_token=1; path=/; max-age=86400; SameSite=Lax`
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.delete("userId")
          currentUrl.searchParams.delete("userName")
          window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search)
        } catch {
          sessionStorage.removeItem("ve_authenticated")
          sessionStorage.removeItem("ve_user")
        }
      } else {
        const authenticated = sessionStorage.getItem("ve_authenticated")
        const storedUser = sessionStorage.getItem("ve_user")
        if (authenticated === "true" && storedUser) {
          try {
            setIsAuthenticated(true)
            setCurrentUser(JSON.parse(storedUser))
          } catch { /* ignore parse error */ }
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [searchParams])

  const handleLogout = () => {
    sessionStorage.removeItem("ve_authenticated")
    sessionStorage.removeItem("ve_user")
    document.cookie = "ve_auth_token=; path=/; max-age=0"
    setIsAuthenticated(false)
    setCurrentUser(null)
    setSelectedProduct(null)
  }

  const handleSelectProduct = (product: "SDK" | "API" | "CREDENTIAL") => {
    setSelectedProduct(product)
  }

  const handleBack = () => {
    setSelectedProduct(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost"
    const isInIframe = window !== window.top
    if (!isLocal && !isInIframe) {
      window.location.href = "/login/"
      return null
    }
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost"
      window.location.href = isLocal ? "http://localhost:5173/login/" : "/login/"
    }
    return null
  }

  if (!selectedProduct) {
    return (
      <>
        <LandingPage currentUser={currentUser} onLogout={handleLogout} onSelectProduct={handleSelectProduct} />
        <UpdateNotesPopup />
      </>
    )
  }

  if (selectedProduct === "API") {
    return (
      <>
        <FormApiPrivypass onLogout={handleLogout} currentUser={currentUser} onBack={handleBack} />
        <UpdateNotesPopup />
      </>
    )
  }

  if (selectedProduct === "CREDENTIAL") {
    return (
      <>
        <FormCredential onLogout={handleLogout} currentUser={currentUser} onBack={handleBack} />
        <UpdateNotesPopup />
      </>
    )
  }

  return (
    <>
      <FormValueEngineer onLogout={handleLogout} currentUser={currentUser} onBack={handleBack} />
      <UpdateNotesPopup />
    </>
  )
}
