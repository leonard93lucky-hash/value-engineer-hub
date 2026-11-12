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
  years: number[]
  selectedYear: number
  onYearChange: (year: number) => void
}

const secondaryBtn =
  "inline-flex items-center gap-2 px-4 min-h-[44px] bg-card border border-input hover:bg-canvas text-foreground rounded-lg font-medium transition-colors text-[15px] disabled:opacity-50 max-sm:px-3"

export default function Header({ onIncomeClick, onExpenseClick, onExportClick, onRefresh, refreshing, years, selectedYear, onYearChange }: HeaderProps) {
  const { isSupport, userName } = useAuth()

  return (
    <div className="mx-auto w-full max-w-[1280px] px-8 max-md:px-4">
      <PageHeader
        title="Team fund"
        subtitle={`Track team income, expenses and goal progress.${userName ? ` Signed in as ${userName}.` : ""}`}
        actions={
          <>
            <label className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-input bg-card pl-3 pr-1 text-[15px] font-medium text-foreground">
              <span className="text-muted-foreground">Year</span>
              <select
                value={selectedYear}
                onChange={e => onYearChange(Number(e.target.value))}
                aria-label="Show goal progress and charts for year"
                className="h-10 cursor-pointer rounded-md bg-transparent pr-1 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
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
