"use client"

import { useState, useMemo, useEffect } from "react"
import type { Payment, Expense } from "@/lib/types"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const PAGE_SIZES = [5, 10, 20, 50]

interface TransactionHistoryProps {
  payments: Payment[]
  expenses: Expense[]
  activeTab: "payments" | "expenses"
  onTabChange: (tab: "payments" | "expenses") => void
  onDeletePayment: (id: string) => void
  onDeleteExpense: (id: string) => void
  canDelete: boolean
}

export default function TransactionHistory({
  payments,
  expenses,
  activeTab,
  onTabChange,
  onDeletePayment,
  onDeleteExpense,
  canDelete,
}: TransactionHistoryProps) {
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { setPage(1) }, [activeTab])

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    payments.forEach(p => {
      const y = new Date(p.transferDate).getFullYear()
      if (!isNaN(y)) years.add(y)
    })
    expenses.forEach(e => {
      const y = new Date(e.date).getFullYear()
      if (!isNaN(y)) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [payments, expenses])

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    if (yearFilter !== "all") {
      list = list.filter(p => new Date(p.transferDate).getFullYear().toString() === yearFilter)
    }
    if (monthFilter !== "all") {
      list = list.filter(p => p.month === monthFilter)
    }
    return list
  }, [payments, yearFilter, monthFilter])

  const filteredExpenses = useMemo(() => {
    let list = [...expenses]
    if (yearFilter !== "all") {
      list = list.filter(e => new Date(e.date).getFullYear().toString() === yearFilter)
    }
    if (monthFilter !== "all") {
      list = list.filter(e => MONTHS[new Date(e.date).getMonth()] === monthFilter)
    }
    return list
  }, [expenses, yearFilter, monthFilter])

  const paginated = <T,>(items: T[]): T[] => items.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = (count: number) => Math.max(1, Math.ceil(count / pageSize))

  const handleFilterChange = () => { setPage(1) }

  const FilterBar = () => (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={yearFilter}
        onChange={e => { setYearFilter(e.target.value); handleFilterChange() }}
        className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="all">All Years</option>
        {availableYears.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={monthFilter}
        onChange={e => { setMonthFilter(e.target.value); handleFilterChange() }}
        className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="all">All Months</option>
        {MONTHS.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  )

  const Pagination = ({ total }: { total: number }) => {
    const tp = totalPages(total)
    if (total === 0) return null
    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(tp, 5) }, (_, i) => {
            const startPage = Math.max(1, Math.min(page - 2, tp - 4))
            const p = startPage + i
            if (p > tp) return null
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(tp, p + 1))}
            disabled={page >= tp}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Transaction History</h2>

        <div className="flex flex-wrap items-center gap-3">
          <FilterBar />
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange("payments")}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "payments"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Payments {yearFilter === "all" && monthFilter === "all" ? `(${payments.length})` : `(${filteredPayments.length})`}
            </button>
            <button
              onClick={() => onTabChange("expenses")}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "expenses"
                  ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Expenses {yearFilter === "all" && monthFilter === "all" ? `(${expenses.length})` : `(${filteredExpenses.length})`}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "payments" ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">MONTH</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground hidden sm:table-cell">NAME</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground hidden sm:table-cell">DATE</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">AMOUNT</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No payments recorded yet</td>
                  </tr>
                ) : (
                  paginated(filteredPayments).map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 sm:px-4 font-medium text-foreground">{payment.month}</td>
                      <td className="py-3 px-2 sm:px-4 text-foreground hidden sm:table-cell">{payment.name}</td>
                      <td className="py-3 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">
                        {new Date(payment.transferDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Rp {payment.amount.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <button
                          onClick={() => onDeletePayment(payment.id)}
                        disabled={!canDelete}
                        className={`transition-colors ${
                            canDelete
                              ? "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                              : "text-rose-600 dark:text-rose-400 opacity-50 cursor-not-allowed"
                          }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filteredPayments.length} />
      </>
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">DESCRIPTION</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground hidden sm:table-cell">CATEGORY</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">DATE</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">AMOUNT</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-muted-foreground">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No expenses recorded yet</td>
                </tr>
              ) : (
                paginated(filteredExpenses).map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 sm:px-4 font-medium text-foreground">{expense.description}</td>
                    <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        - Rp {expense.amount.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        disabled={!canDelete}
                        className={`transition-colors ${
                            canDelete
                              ? "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                              : "text-rose-600 dark:text-rose-400 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination total={filteredExpenses.length} />
        </>
      )}
    </div>
  )
}
