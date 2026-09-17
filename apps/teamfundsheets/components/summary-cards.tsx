"use client"

import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

interface SummaryCardsProps {
  totalIncome: number
  totalExpenses: number
  paymentCount: number
  expenseCount: number
}

export default function SummaryCards({ totalIncome, totalExpenses, paymentCount, expenseCount }: SummaryCardsProps) {
  const netBalance = totalIncome - totalExpenses
  const percentageUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Income */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-success-surface p-2 rounded-lg">
            <TrendingUp className="text-success" size={24} />
          </div>
          <span className="text-muted-foreground text-sm font-medium">Total Income</span>
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-success mb-1 tabular-nums">
          Rp {totalIncome.toLocaleString("id-ID")}
        </div>
        <p className="text-muted-foreground text-sm">{paymentCount} payments recorded</p>
      </div>

      {/* Total Expenses */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-danger-surface p-2 rounded-lg">
            <TrendingDown className="text-danger" size={24} />
          </div>
          <span className="text-muted-foreground text-sm font-medium">Total Expenses</span>
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-danger mb-1 tabular-nums">
          Rp {totalExpenses.toLocaleString("id-ID")}
        </div>
        <p className="text-muted-foreground text-sm">{expenseCount} expense entries</p>
      </div>

      {/* Net Balance */}
      <div className="bg-burgundy rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/15 p-2 rounded-lg">
            <BarChart3 className="text-white" size={24} />
          </div>
          <span className="text-white/80 text-sm font-medium">Net Balance</span>
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-white mb-3 tabular-nums">Rp {netBalance.toLocaleString("id-ID")}</div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-[#76CE93] h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
        <p className="text-white/70 text-xs mt-2">{percentageUsed.toFixed(1)}% of income used</p>
      </div>
    </div>
  )
}
