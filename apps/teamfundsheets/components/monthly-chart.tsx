"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Payment, Expense } from "@/lib/types"

/** Short axis labels in Indonesian units: Rp 350 rb, Rp 1,4 jt. Tooltips keep full amounts. */
function formatAxisRp(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`
  return `Rp ${value}`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface MonthlyChartProps {
  payments: Payment[]
  expenses: Expense[]
  year?: number
}

export default function MonthlyChart({ payments, expenses, year }: MonthlyChartProps) {
  const chartData = MONTHS.map((month, index) => {
    // 1. Calculate Income for the month
    const income = payments
      .filter((p) => p.month === month)
      .reduce((sum, p) => sum + p.amount, 0)

    // 2. Calculate Expenses for the month
    const expense = expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === index
      })
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      month,
      Income: income,
      Expenses: expense,
    }
  })

  return (
    <div className="h-full bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Income vs expenses</h2>
        <span className="text-muted-foreground text-sm">Monthly comparison{year ? `, ${year}` : ""}</span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DDE1" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#66545E', fontSize: 12 }}
            />
            <YAxis 
              width={76}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#66545E', fontSize: 12 }}
              tickFormatter={formatAxisRp}
            />
            <Tooltip
              cursor={{ fill: 'rgba(67,10,35,0.04)' }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(67,10,35,0.12)",
                borderRadius: "8px",
                color: "#430A23",
              }}
              formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />

            <Bar 
              dataKey="Income" 
              name="Income" 
              fill="#24643C" 
              radius={[4, 4, 0, 0]} 
            />
            
            <Bar 
              dataKey="Expenses" 
              name="Expenses" 
              fill="#B01F40" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
