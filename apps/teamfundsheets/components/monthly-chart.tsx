"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Payment, Expense } from "@/app/page"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface MonthlyChartProps {
  payments: Payment[]
  expenses: Expense[]
}

export default function MonthlyChart({ payments, expenses }: MonthlyChartProps) {
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
      Income: income, // This is the key we use for the data
      Expenses: expense,
    }
  })

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Income vs Expenses</h2>
        <span className="text-muted-foreground text-sm">Monthly Comparison</span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `Rp ${value.toLocaleString()}`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            
            {/* FIX: Changed dataKey from "Inc: Lucky" to "Income" */}
            <Bar 
              dataKey="Income" 
              name="Income" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
            />
            
            <Bar 
              dataKey="Expenses" 
              name="Expenses" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
