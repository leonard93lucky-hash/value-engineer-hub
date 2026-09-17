"use client"

import { useState, useEffect, useMemo } from "react"
import Header from "@/components/header"
import SummaryCards from "@/components/summary-cards"
import MonthlyChart from "@/components/monthly-chart"
import IncomeModal from "@/components/income-modal"
import ExpenseModal from "@/components/expense-modal"
import TransactionHistory from "@/components/transaction-history"
import TargetsConfig from "@/components/targets-config"
import { Payment, Expense } from "@/lib/types"
import { useAuth } from "@/app/providers"
import { api as apiPath } from "@/lib/api-base"
import { Settings } from "lucide-react"
import { toast } from "sonner"

export default function HomeContent() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyTarget, setMonthlyTarget] = useState(600000)
  const [activeTab, setActiveTab] = useState<"payments" | "expenses">("payments")
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showTargetsConfig, setShowTargetsConfig] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { isSupport } = useAuth()

  const currentYear = new Date().getFullYear()

  const fetchData = async (allowRetry = false) => {
    setRefreshing(true)
    let retrying = false
    try {
      console.log("[v0] Fetching payments and expenses from API...")
      const [paymentsRes, expensesRes, targetsRes] = await Promise.allSettled([
        fetch(apiPath("/api/payments")),
        fetch(apiPath("/api/expenses")),
        fetch(apiPath(`/api/targets?year=${currentYear}`)),
      ])

      if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
        const paymentsData = await paymentsRes.value.json()
        console.log("[v0] Successfully fetched", paymentsData.length, "payments")
        setPayments(paymentsData)
      } else {
        console.error("[v0] Error fetching payments:", paymentsRes.status === "fulfilled" ? paymentsRes.value.statusText : paymentsRes.reason)
      }

      if (expensesRes.status === "fulfilled" && expensesRes.value.ok) {
        const expensesData = await expensesRes.value.json()
        console.log("[v0] Successfully fetched", expensesData.length, "expenses")
        setExpenses(expensesData)
      } else {
        console.error("[v0] Error fetching expenses:", expensesRes.status === "fulfilled" ? expensesRes.value.statusText : expensesRes.reason)
      }

      if (targetsRes.status === "fulfilled" && targetsRes.value.ok) {
        const data = await targetsRes.value.json()
        setMonthlyTarget(data.monthlyTarget || 600000)
      }

      const anyRejected = [paymentsRes, expensesRes, targetsRes].some(
        (r) => r.status === "rejected"
      )

      if (anyRejected && allowRetry) {
        retrying = true
        console.log("[v0] Some fetches failed (cold start?), retrying in 2s...")
        setTimeout(() => {
          setLoading(false)
          fetchData(false)
        }, 2000)
      }
    } catch (error) {
      console.error("[v0] Unexpected error fetching data:", error)
      if (allowRetry) {
        retrying = true
        setTimeout(() => {
          setLoading(false)
          fetchData(false)
        }, 2000)
      }
    } finally {
      setRefreshing(false)
      if (!retrying) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(true)
  }, [])

  const formattedPaymentsForChart = useMemo(() => {
    return payments.map((p) => ({
      ...p,
      name: "Income",
    }))
  }, [payments])

  const incomeByPerson = useMemo(() => {
    const totals: Record<string, number> = {}
    payments.forEach((p) => {
      totals[p.name] = (totals[p.name] || 0) + p.amount
    })
    return Object.entries(totals)
  }, [payments])

  const handleAddPayment = async (payment: Payment) => {
    try {
      const res = await fetch(apiPath("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      })

      if (res.ok) {
        await fetchData()
        setShowIncomeModal(false)
        toast.success("Income recorded")
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to add payment:", errorData.details || res.statusText);
        toast.error("Could not add income. Please try again.");
      }
    } catch (error) {
      console.error("Error adding payment:", error)
      toast.error("Could not add income. Please try again.");
    }
  }

  const handleAddExpense = async (expense: Expense) => {
    try {
      const res = await fetch(apiPath("/api/expenses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      })

      if (res.ok) {
        await fetchData()
        setShowExpenseModal(false)
        toast.success("Expense recorded")
      } else {
        console.error("Failed to add expense")
        toast.error("Could not add expense. Please try again.")
      }
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Could not add expense. Please try again.")
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      const res = await fetch(apiPath(`/api/payments/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== id))
        toast.success("Payment deleted")
      } else {
        console.error("Failed to delete payment")
        toast.error("Could not delete payment. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("Could not delete payment. Please try again.")
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(apiPath(`/api/expenses/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        toast.success("Expense deleted")
      } else {
        console.error("Failed to delete expense")
        toast.error("Could not delete expense. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("Could not delete expense. Please try again.")
    }
  }

  const handleIncomeClick = () => {
    setShowIncomeModal(true)
  }

  const handleExpenseClick = () => {
    setShowExpenseModal(true)
  }

  const handleExportCSV = () => {
    const csvRows: string[] = []

    csvRows.push("TeamFund IDR Tracker - Report")
    csvRows.push(new Date().toLocaleString())
    csvRows.push("")

    csvRows.push("PAYMENTS")
    csvRows.push("Month,Name,Transfer Date,Amount (IDR)")
    payments.forEach((p) => {
      csvRows.push(`${p.month},${p.name},${p.transferDate},${p.amount}`)
    })
    csvRows.push("")
    csvRows.push(`Total Income:,${payments.reduce((sum, p) => sum + p.amount, 0)}`)
    csvRows.push("")

    csvRows.push("EXPENSES")
    csvRows.push("Description,Category,Date,Amount (IDR)")
    expenses.forEach((e) => {
      csvRows.push(`${e.description},${e.category},${e.date},${e.amount}`)
    })
    csvRows.push("")
    csvRows.push(`Total Expenses:,${expenses.reduce((sum, e) => sum + e.amount, 0)}`)
    csvRows.push("")

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    csvRows.push("SUMMARY")
    csvRows.push(`Total Income,${totalIncome}`)
    csvRows.push(`Total Expenses,${totalExpenses}`)
    csvRows.push(`Net Balance,${totalIncome - totalExpenses}`)

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `teamfund_report_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Loading team fund data...
    </div>
  )

  return (
    <main className="min-h-screen bg-background">
      <Header
        onIncomeClick={handleIncomeClick}
        onExpenseClick={handleExpenseClick}
        onExportClick={handleExportCSV}
        onRefresh={fetchData}
        refreshing={refreshing}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <SummaryCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          paymentCount={payments.length}
          expenseCount={expenses.length}
        />

        <section className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">
              Income Goal Progress
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({currentYear})
              </span>
            </h2>
            {isSupport && (
              <button
                onClick={() => setShowTargetsConfig(true)}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground hover:bg-canvas rounded-lg transition-colors"
              >
                <Settings size={16} />
                Targets
              </button>
            )}
          </div>
          {incomeByPerson.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments recorded yet</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {incomeByPerson.map(([name, total]) => {
                const percentage = Math.min((total / monthlyTarget) * 100, 100)
                const isGoalReached = total >= monthlyTarget
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium gap-3">
                      <span className="truncate">{name}</span>
                      <span className="tabular-nums text-muted-foreground whitespace-nowrap">
                        Rp {total.toLocaleString("id-ID")} / Rp {monthlyTarget.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative h-2.5 flex-1 bg-muted rounded-full border border-border overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${isGoalReached ? "bg-success" : "bg-info"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium tabular-nums whitespace-nowrap ${isGoalReached ? "text-success" : "text-muted-foreground"}`}>
                        {isGoalReached ? "Goal reached" : `${percentage.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <MonthlyChart payments={formattedPaymentsForChart} expenses={expenses} />

        <TransactionHistory
          payments={payments}
          expenses={expenses}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDeletePayment={handleDeletePayment}
          onDeleteExpense={handleDeleteExpense}
          canDelete={isSupport}
        />
      </div>

      {isSupport && (
        <>
          <IncomeModal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} onSubmit={handleAddPayment} />
          <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSubmit={handleAddExpense} />
        </>
      )}

      <TargetsConfig
        isOpen={showTargetsConfig}
        onClose={() => setShowTargetsConfig(false)}
        onSaved={(target) => { setMonthlyTarget(target); fetchData() }}
      />
    </main>
  )
}
