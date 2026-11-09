"use client"

import { Plus, Download, RotateCw } from "lucide-react"
import { useAuth } from "@/app/providers"
import { PageHeader } from "@/components/page-header"

interface HeaderProps {
  onIncomeClick: () => void
  onExpenseClick: () => void
  onExportClick: () => void
  onRefresh: () => void
  refreshing: boolean
}

const secondaryBtn =
  "inline-flex items-center gap-2 px-4 min-h-[44px] bg-card border border-input hover:bg-canvas text-foreground rounded-lg font-medium transition-colors text-[15px] disabled:opacity-50 max-sm:px-3"

export default function Header({ onIncomeClick, onExpenseClick, onExportClick, onRefresh, refreshing }: HeaderProps) {
  const { isSupport, userName } = useAuth()

  return (
    <div className="mx-auto w-full max-w-[1280px] px-8 max-md:px-4">
      <PageHeader
        title="Team fund"
        subtitle={`Track team income, expenses and goal progress.${userName ? ` Signed in as ${userName}.` : ""}`}
        actions={
          <>
            <button onClick={onExportClick} className={secondaryBtn} aria-label="Export report as CSV" title="Export report as CSV">
              <Download size={18} aria-hidden="true" />
              <span className="max-sm:sr-only">Export CSV</span>
            </button>
            <button onClick={onRefresh} disabled={refreshing} className={secondaryBtn} aria-label={refreshing ? "Refreshing data" : "Refresh data"} title="Refresh data">
              <RotateCw size={18} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
              <span className="max-sm:sr-only">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
            {isSupport && (
              <>
                <button onClick={onExpenseClick} className={secondaryBtn} aria-label="Add expense">
                  <Plus size={18} aria-hidden="true" />
                  <span className="max-sm:sr-only">Add expense</span>
                </button>
                <button
                  onClick={onIncomeClick}
                  aria-label="Add income"
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors text-[15px] max-sm:px-3"
                >
                  <Plus size={18} aria-hidden="true" />
                  <span className="max-sm:sr-only">Add income</span>
                </button>
              </>
            )}
          </>
        }
      />
    </div>
  )
}
