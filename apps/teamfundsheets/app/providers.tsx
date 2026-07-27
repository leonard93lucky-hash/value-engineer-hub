"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthContextType {
  isSupport: boolean
  userName: string
  userId: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSupport, setIsSupport] = useState(false)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const position = params.get("position") || ""
    const name = params.get("userName") || ""
    const id = params.get("userId") || ""
    setIsSupport(position.toLowerCase() === "support")
    setUserName(name)
    setUserId(id)
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <AuthContext.Provider value={{ isSupport, userName, userId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return { isSupport: false, userName: "", userId: "" }
  }
  return context
}
