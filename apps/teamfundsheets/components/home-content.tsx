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

export default function HomeContent() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyTarget, setMonthlyTarget] = useState(600000)
  const [activeTab, setActiveTab] = useState<"payments" | "expenses">("payments")
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showTargetsConfig, setShowTargetsConfig] = useState(false)
  const [loading, setLoading] = useState(true)
  const { isSupport } = useAuth()

  const currentYear = new Date().getFullYear()

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching payments and expenses from API...")
      const [paymentsRes, expensesRes, targetsRes] = await Promise.all([
        fetch(apiPath("/api/payments")),
        fetch(apiPath("/api/expenses")),
        fetch(apiPath(`/api/targets?year=${currentYear}`)),
      ])

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        console.log("[v0] Successfully fetched", paymentsData.length, "payments")
        setPayments(paymentsData)
      } else {
        console.error("[v0] Error fetching payments:", paymentsRes.statusText)
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        console.log("[v0] Successfully fetched", expensesData.length, "expenses")
        setExpenses(expensesData)
      } else {
        console.error("[v0] Error fetching expenses:", expensesRes.statusText)
      }

      if (targetsRes.ok) {
        const data = await targetsRes.json()
        setMonthlyTarget(data.monthlyTarget || 600000)
      }
    } catch (error) {
      console.error("[v0] Unexpected error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to add payment:", errorData.details || res.statusText);
        alert(`Failed to add payment: ${errorData.details || "Please checks logs"}`);
      }
    } catch (error) {
      console.error("Error adding payment:", error)
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
      } else {
        console.error("Failed to add expense")
      }
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      const res = await fetch(apiPath(`/api/payments/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== id))
      } else {
        console.error("Failed to delete payment")
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(apiPath(`/api/expenses/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      } else {
        console.error("Failed to delete expense")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
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

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>

  return (
    <main className="min-h-screen bg-background">
      <Header
        onIncomeClick={handleIncomeClick}
        onExpenseClick={handleExpenseClick}
        onExportClick={handleExportCSV}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <SummaryCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          paymentCount={payments.length}
          expenseCount={expenses.length}
        />

        <section className="bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Income Goal Progress
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({currentYear})
              </span>
            </h2>
            {isSupport && (
              <button
                onClick={() => setShowTargetsConfig(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
                    <div className="flex justify-between text-sm font-medium">
                      <span>{name}</span>
                      <span>
                        Rp {total.toLocaleString()} / Rp {monthlyTarget.toLocaleString()}
                      </span>
                    </div>
                    <div className="relative h-6 w-full bg-muted rounded-md border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isGoalReached ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {isGoalReached ? "Goal Reached!" : `${percentage.toFixed(1)}%`}
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
