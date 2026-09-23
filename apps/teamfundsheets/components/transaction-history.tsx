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

  const getTime = (value: string) => {
    const t = new Date(value).getTime()
    return isNaN(t) ? 0 : t
  }

  const getIdTime = (id: string) => {
    const n = Number(id)
    return isNaN(n) ? 0 : n
  }

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    if (yearFilter !== "all") {
      list = list.filter(p => new Date(p.transferDate).getFullYear().toString() === yearFilter)
    }
    if (monthFilter !== "all") {
      list = list.filter(p => p.month === monthFilter)
    }
    list.sort((a, b) => {
      const dateDiff = getTime(b.transferDate) - getTime(a.transferDate)
      if (dateDiff !== 0) return dateDiff
      return getIdTime(b.id) - getIdTime(a.id)
    })
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
    list.sort((a, b) => {
      const dateDiff = getTime(b.date) - getTime(a.date)
      if (dateDiff !== 0) return dateDiff
      return getIdTime(b.id) - getIdTime(a.id)
    })
    return list
  }, [expenses, yearFilter, monthFilter])

  const paginated = <T,>(items: T[]): T[] => items.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = (count: number) => Math.max(1, Math.ceil(count / pageSize))

  const handleFilterChange = () => { setPage(1) }

  const selectCls =
    "px-3 py-1.5 bg-card border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"

  const FilterBar = () => (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={yearFilter}
        onChange={e => { setYearFilter(e.target.value); handleFilterChange() }}
        className={selectCls}
        aria-label="Filter by year"
      >
        <option value="all">All Years</option>
        {availableYears.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={monthFilter}
        onChange={e => { setMonthFilter(e.target.value); handleFilterChange() }}
        className={selectCls}
        aria-label="Filter by month"
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
            className="px-2 py-1 bg-card border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2.5 rounded-lg hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
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
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors tabular-nums ${
                  p === page
                    ? "bg-selection-surface text-selection border border-selection"
                    : "hover:bg-canvas text-foreground border border-transparent"
                }`}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(tp, p + 1))}
            disabled={page >= tp}
            className="p-2.5 rounded-lg hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
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
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Transaction History</h2>

        <div className="flex flex-wrap items-center gap-3">
          <FilterBar />
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange("payments")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "payments"
                  ? "bg-selection-surface text-selection border border-selection"
                  : "text-muted-foreground hover:bg-canvas border border-transparent"
              }`}
            >
              Payments {yearFilter === "all" && monthFilter === "all" ? `(${payments.length})` : `(${filteredPayments.length})`}
            </button>
            <button
              onClick={() => onTabChange("expenses")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === "expenses"
                  ? "bg-selection-surface text-selection border border-selection"
                  : "text-muted-foreground hover:bg-canvas border border-transparent"
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
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Month</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground hidden sm:table-cell">Name</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No payments recorded yet</td>
                  </tr>
                ) : (
                  paginated(filteredPayments).map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-canvas/60 transition-colors">
                      <td className="py-3 px-2 sm:px-4 font-medium text-foreground">{payment.month}</td>
                      <td className="py-3 px-2 sm:px-4 text-foreground hidden sm:table-cell">{payment.name}</td>
                      <td className="py-3 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell tabular-nums">
                        {new Date(payment.transferDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <span className="text-success font-medium tabular-nums">
                          Rp {payment.amount.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <button
                          onClick={() => onDeletePayment(payment.id)}
                          disabled={!canDelete}
                          aria-label="Delete payment"
                          className={`p-2 rounded-lg transition-colors ${
                            canDelete
                              ? "text-danger hover:bg-danger-surface cursor-pointer"
                              : "text-danger opacity-40 cursor-not-allowed"
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
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No expenses recorded yet</td>
                  </tr>
                ) : (
                  paginated(filteredExpenses).map((expense) => (
                    <tr key={expense.id} className="border-b border-border hover:bg-canvas/60 transition-colors">
                      <td className="py-3 px-2 sm:px-4 font-medium text-foreground">{expense.description}</td>
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <span className="px-2 py-1 bg-canvas border border-border text-foreground rounded-md text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-muted-foreground tabular-nums">
                        {new Date(expense.date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <span className="text-danger font-medium tabular-nums">
                          - Rp {expense.amount.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          disabled={!canDelete}
                          aria-label="Delete expense"
                          className={`p-2 rounded-lg transition-colors ${
                            canDelete
                              ? "text-danger hover:bg-danger-surface cursor-pointer"
                              : "text-danger opacity-40 cursor-not-allowed"
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
