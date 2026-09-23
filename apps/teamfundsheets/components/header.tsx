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
    <div className="px-4 pt-6 pb-1 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
      <h1 className="text-[28px] leading-tight font-semibold text-foreground tracking-tight">Value Engineer Team Fund</h1>
      <p className="text-base text-muted-foreground mt-1">Track team income, expenses, and goal progress</p>
      {userName && (
        <p className="text-sm text-muted-foreground mt-1">Signed in as {userName}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
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
  )
}
