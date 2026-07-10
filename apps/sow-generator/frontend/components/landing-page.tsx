"use client"

import { Smartphone, Code2, ChevronRight, Lock } from "lucide-react"

interface LandingPageProps {
  currentUser: { name: string; id: number }
  onLogout: () => void
  onSelectProduct: (product: "SDK" | "API" | "CREDENTIAL") => void
}

export function LandingPage({ currentUser, onLogout, onSelectProduct }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background decorations - Light soft circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-100 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-50 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP BAR */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center bg-white/70 backdrop-blur-md relative z-10">
        <span className="text-sm font-semibold text-gray-800 tracking-wide">SOW Generator</span>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-5xl mx-auto -mt-10">
        
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Select Document Type
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            Please select the product format you want to create the Statement of Work (SOW) document for today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-3 sm:px-4 md:px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
          
          {/* KARTU 1: SDK Liveness (AKTIF) */}
          <button
            onClick={() => onSelectProduct("SDK")}
            className="group text-left relative bg-white border border-gray-200 hover:border-red-400 rounded-3xl p-8 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/10 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-[40px] group-hover:bg-red-100 transition-all duration-500 pointer-events-none" />
            
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100 group-hover:bg-red-500 transition-colors duration-500">
              <Smartphone className="w-8 h-8 text-red-500 group-hover:text-white transition-colors duration-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3">
              SDK Liveness
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider font-semibold">Ready</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              Create an SOW document for Liveness integration service using SDK format (Mobile / Web App), complete with UI specification details.
            </p>

            <div className="flex items-center gap-2 text-red-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4 text-red-600" />
            </div>
          </button>

          {/* KARTU 2: API PrivyPass (AKTIF) */}
          <button
            onClick={() => onSelectProduct("API")}
            className="group text-left relative bg-white border border-gray-200 hover:border-blue-400 rounded-3xl p-8 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[40px] group-hover:bg-blue-100 transition-all duration-500 pointer-events-none" />
            
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 group-hover:bg-blue-500 transition-colors duration-500">
              <Code2 className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors duration-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3">
              API PrivyPass
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider font-semibold">Ready</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              Create an SOW document for direct API PrivyPass integration (Backend-to-Backend) along with its feature configuration.
            </p>

            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4 text-blue-600" />
            </div>
          </button>

          {/* KARTU 3: Credential Document (AKTIF) */}
          <button
            onClick={() => onSelectProduct("CREDENTIAL")}
            className="group text-left relative bg-white border border-gray-200 hover:border-emerald-400 rounded-3xl p-8 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-[40px] group-hover:bg-emerald-100 transition-all duration-500 pointer-events-none" />

            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:bg-emerald-500 transition-colors duration-500">
              <Lock className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors duration-500" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3">
              Credential Doc
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider font-semibold">Ready</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              Quickly create Credential documents (Staging & Production) for Enterprise along with the full list of services used.
            </p>

            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 mt-auto">
              Create Document Now <ChevronRight className="w-4 h-4 text-emerald-600" />
            </div>
          </button>

        </div>

      </main>
      
      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-400 text-xs relative z-10 font-medium tracking-wide">
        &copy; 2026 PT Privy Identitas Digital. Value Engineer Tools.
      </footer>
    </div>
  )
}
