"use client"

import { useState, useEffect } from "react"
import { Smartphone, Code2, ChevronRight, Lock } from "lucide-react"

interface LandingPageProps {
  currentUser: { name: string; id: number }
  onLogout: () => void
  onSelectProduct: (product: "SDK" | "API" | "CREDENTIAL") => void
}

export function LandingPage({ currentUser, onLogout, onSelectProduct }: LandingPageProps) {
  const [isIframe, setIsIframe] = useState(false)

  useEffect(() => {
    setIsIframe(window !== window.top)
  }, [])

  const goBackToHub = () => {
    if (window.top) {
      window.top.postMessage('back-to-faq', '*');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* SUBHEADER - hanya tampil saat bukan di dalam iframe hub */}
      {!isIframe && (
        <header className="border-b border-border px-6 py-3 flex items-center bg-card">
          <span className="text-sm font-semibold text-foreground tracking-wide">SOW Generator</span>
        </header>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:p-6 w-full max-w-5xl mx-auto">

        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 tracking-tight">
            Select Document Type
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Select the product format for the Statement of Work (SOW) document you want to create.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">

          {/* KARTU 1: SDK Liveness */}
          <button
            onClick={() => onSelectProduct("SDK")}
            className="group text-left relative bg-card border border-border hover:border-input rounded-xl p-5 sm:p-8 transition-colors duration-200 flex flex-col h-full cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 sm:mb-6 transition-colors duration-200 group-hover:bg-primary">
              <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:text-white transition-colors duration-200" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              SDK Liveness
              <span className="bg-success-surface text-success text-xs px-2 py-0.5 rounded-md border border-success/30 font-medium">Ready</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 sm:mb-8 flex-1">
              Create an SOW document for Liveness integration service using SDK format (Mobile / Web App), complete with UI specification details.
            </p>

            <div className="flex items-center gap-2 text-primary font-medium text-sm mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* KARTU 2: API PrivyPass */}
          <button
            onClick={() => onSelectProduct("API")}
            className="group text-left relative bg-card border border-border hover:border-input rounded-xl p-5 sm:p-8 transition-colors duration-200 flex flex-col h-full cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-info-surface rounded-lg flex items-center justify-center mb-4 sm:mb-6 transition-colors duration-200 group-hover:bg-info">
              <Code2 className="w-6 h-6 sm:w-7 sm:h-7 text-info group-hover:text-white transition-colors duration-200" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              API PrivyPass
              <span className="bg-success-surface text-success text-xs px-2 py-0.5 rounded-md border border-success/30 font-medium">Ready</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 sm:mb-8 flex-1">
              Create an SOW document for direct API PrivyPass integration (Backend-to-Backend) along with its feature configuration.
            </p>

            <div className="flex items-center gap-2 text-info font-medium text-sm mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* KARTU 3: Credential Document */}
          <button
            onClick={() => onSelectProduct("CREDENTIAL")}
            className="group text-left relative bg-card border border-border hover:border-input rounded-xl p-5 sm:p-8 transition-colors duration-200 flex flex-col h-full cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-success-surface rounded-lg flex items-center justify-center mb-4 sm:mb-6 transition-colors duration-200 group-hover:bg-success">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-success group-hover:text-white transition-colors duration-200" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              Credential Doc
              <span className="bg-success-surface text-success text-xs px-2 py-0.5 rounded-md border border-success/30 font-medium">Ready</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 sm:mb-8 flex-1">
              Quickly create Credential documents (Staging & Production) for Enterprise along with the full list of services used.
            </p>

            <div className="flex items-center gap-2 text-success font-medium text-sm mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4" />
            </div>
          </button>

        </div>

      </main>

      {/* FOOTER */}
      {!isIframe && (
        <footer className="text-center py-6 text-muted-foreground text-xs font-medium tracking-wide">
          &copy; 2026 PT Privy Identitas Digital. Value Engineer Tools.
        </footer>
      )}
    </div>
  )
}
