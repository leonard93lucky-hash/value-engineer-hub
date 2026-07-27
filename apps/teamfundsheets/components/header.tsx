"use client"

import { Plus, Download } from "lucide-react"
import { useAuth } from "@/app/providers"

interface HeaderProps {
  onIncomeClick: () => void
  onExpenseClick: () => void
  onExportClick: () => void
}

export default function Header({ onIncomeClick, onExpenseClick, onExportClick }: HeaderProps) {
  const { isSupport, userName } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-lg w-10 h-10 flex items-center justify-center font-bold text-lg">
              T
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Value Engineer Team Fund</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {userName && (
              <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            )}
            <button
              onClick={onExportClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              title="Export report as CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {isSupport && (
              <>
                <button
                  onClick={onIncomeClick}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Income</span>
                </button>
                <button
                  onClick={onExpenseClick}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
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
