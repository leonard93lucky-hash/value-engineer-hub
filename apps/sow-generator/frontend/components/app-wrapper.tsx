"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import FormValueEngineer from "@/components/form-value-engineer"
import FormApiPrivypass from "@/components/form-api-privypass"
import FormCredential from "@/components/form-credential"
import { LandingPage } from "@/components/landing-page"
import { UpdateNotesPopup } from "@/components/update-notes-popup"

export function AppWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Baca parameter ?form= dari URL. Jika tidak ada, nilainya null
  const selectedProduct = searchParams.get("form") as "SDK" | "API" | "CREDENTIAL" | null

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const urlUserId = searchParams.get("userId")
    const urlUserName = searchParams.get("userName")
    
    if (urlUserId && urlUserName) {
      const user = { id: urlUserId, name: urlUserName }
      setIsAuthenticated(true)
      setCurrentUser(user)
      sessionStorage.setItem("ve_authenticated", "true")
      sessionStorage.setItem("ve_user", JSON.stringify(user))
      
      // Clean up URL to hide credentials (optional, but good practice)
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.delete("userId")
      currentUrl.searchParams.delete("userName")
      window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search)
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
  }, [searchParams])

  const handleLogout = () => {
    sessionStorage.removeItem("ve_authenticated")
    sessionStorage.removeItem("ve_user")
    setIsAuthenticated(false)
    setCurrentUser(null)
    router.push("/") // Reset route saat logout
  }

  const handleSelectProduct = (product: "SDK" | "API" | "CREDENTIAL") => {
    // Navigasi dengan router push menghasilkan event history yang mendukung Back Button
    router.push(`/?form=${product}`)
  }

  const handleBack = () => {
    // Kembali bisa menggunakan router.back() jika ada history, atau paksa ke root
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
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
