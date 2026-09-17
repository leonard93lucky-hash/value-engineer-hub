"use client"

import { Plus, Download, RotateCw } from "lucide-react"
import { useAuth } from "@/app/providers"

interface HeaderProps {
  onIncomeClick: () => void
  onExpenseClick: () => void
  onExportClick: () => void
  onRefresh: () => void
  refreshing: boolean
}

export default function Header({ onIncomeClick, onExpenseClick, onExportClick, onRefresh, refreshing }: HeaderProps) {
  const { isSupport, userName } = useAuth()

  const secondaryBtn =
    "flex items-center gap-2 px-3 sm:px-4 min-h-[44px] bg-card border border-input hover:bg-canvas text-foreground rounded-lg font-medium transition-colors text-sm sm:text-base"

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/Privy_Logo_Red.png"
              alt="Privy"
              className="h-5 w-auto object-contain flex-shrink-0"
            />
            <span className="text-border hidden sm:inline">|</span>
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">Value Engineer Team Fund</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {userName && (
              <span className="text-sm text-muted-foreground hidden md:block">{userName}</span>
            )}
            <button
              onClick={onExportClick}
              className={secondaryBtn}
              title="Export report as CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={`${secondaryBtn} disabled:opacity-50`}
              title="Refresh data"
            >
              <RotateCw size={18} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            {isSupport && (
              <>
                <button
                  onClick={onIncomeClick}
                  className="flex items-center gap-2 px-3 sm:px-4 min-h-[44px] bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Income</span>
                </button>
                <button
                  onClick={onExpenseClick}
                  className={secondaryBtn}
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Expense</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
