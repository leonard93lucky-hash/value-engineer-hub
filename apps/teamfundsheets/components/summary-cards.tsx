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
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
            <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          <span className="text-muted-foreground text-sm font-medium">TOTAL INCOME</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          Rp {totalIncome.toLocaleString("id-ID")}
        </div>
        <p className="text-muted-foreground text-sm">{paymentCount} Payments recorded</p>
      </div>

      {/* Total Expenses */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg">
            <TrendingDown className="text-rose-600 dark:text-rose-400" size={24} />
          </div>
          <span className="text-muted-foreground text-sm font-medium">TOTAL EXPENSES</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mb-1">
          Rp {totalExpenses.toLocaleString("id-ID")}
        </div>
        <p className="text-muted-foreground text-sm">{expenseCount} Expense entries</p>
      </div>

      {/* Net Balance */}
      <div className="bg-gradient-to-br from-primary to-primary/80 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 sm:p-6 text-card-foreground">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <BarChart3 className="text-white" size={24} />
          </div>
          <span className="text-white/80 text-sm font-medium">NET BALANCE</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white mb-3">Rp {netBalance.toLocaleString("id-ID")}</div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
        <p className="text-white/70 text-xs mt-2">{percentageUsed.toFixed(1)}% of income used</p>
      </div>
    </div>
  )
}
