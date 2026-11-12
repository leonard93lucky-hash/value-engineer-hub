"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"
import type { Expense } from "@/lib/types"

// Fixed category order = fixed color order (color follows the category, never its rank).
// Palette validated with the dataviz validator (light surface): all checks pass.
// Three slots sit below 3:1 contrast, so every value is also printed in the legend.
const CATEGORY_COLORS: { name: string; color: string }[] = [
  { name: "Food & Drink", color: "#2a78d6" },
  { name: "Transport", color: "#eb6834" },
  { name: "Office Supplies", color: "#1baf7a" },
  { name: "Utilities", color: "#eda100" },
  { name: "Other", color: "#e87ba4" },
]
const KNOWN = new Set(CATEGORY_COLORS.map(c => c.name))

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

/** Today's date in WIB as YYYY-MM-DD. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${d} ${months[m - 1]} ${y}`
}

interface ExpenseDonutProps {
  expenses: Expense[]
  /** Calendar year to show. The current year runs to today; past years cover 1 Jan – 31 Dec. */
  year?: number
}

export default function ExpenseDonut({ expenses, year: yearProp }: ExpenseDonutProps) {
  const todayStr = todayWib()
  const year = yearProp ? String(yearProp) : todayStr.slice(0, 4)
  const isCurrentYear = year === todayStr.slice(0, 4)
  const start = `${year}-01-01`
  const today = isCurrentYear ? todayStr : `${year}-12-31`

  const { rows, total, count } = useMemo(() => {
    const sums: Record<string, { amount: number; entries: number }> = {}
    let total = 0
    let count = 0
    for (const e of expenses) {
      const day = String(e.date || "").slice(0, 10)
      if (day < start || day > today) continue
      const cat = KNOWN.has(e.category) ? e.category : "Other"
      const amt = Number(e.amount) || 0
      sums[cat] = sums[cat] || { amount: 0, entries: 0 }
      sums[cat].amount += amt
      sums[cat].entries += 1
      total += amt
      count += 1
    }
    const rows = CATEGORY_COLORS
      .filter(c => sums[c.name]?.amount > 0)
      .map(c => ({
        ...c,
        amount: sums[c.name].amount,
        entries: sums[c.name].entries,
        pct: total > 0 ? (sums[c.name].amount / total) * 100 : 0,
      }))
    return { rows, total, count }
  }, [expenses, start, today])

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4 sm:p-6" aria-labelledby="expense-donut-title">
      <div className="mb-4">
        <h2 id="expense-donut-title" className="text-xl font-semibold text-foreground">Expenses by category</h2>
        <p className="text-sm text-muted-foreground">{isCurrentYear ? "Year to date" : `Full year ${year}`}, {formatDay(start)} – {formatDay(today)} (WIB)</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses recorded in {year} yet.</p>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-6 sm:flex-row lg:flex-col">
          <div className="relative h-[220px] w-[220px] shrink-0">
            <PieChart width={220} height={220}>
              <Pie
                data={rows}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={104}
                startAngle={90}
                endAngle={-270}
                stroke="#FFFFFF"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {rows.map(r => <Cell key={r.name} fill={r.color} />)}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => {
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0"
                  return [`${formatRp(value)} (${pct}%)`, name]
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #E7DDE1", fontSize: 13, color: "#430A23" }}
                itemStyle={{ color: "#430A23" }}
              />
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[13px] text-muted-foreground">Total</span>
              <span className="text-base font-semibold text-foreground tabular-nums">{formatRp(total)}</span>
              <span className="text-[13px] text-muted-foreground tabular-nums">{count} {count === 1 ? "entry" : "entries"}</span>
            </div>
          </div>

          <table className="w-full min-w-0 table-fixed text-sm">
            <caption className="sr-only">Year-to-date expenses by category, amount and share of total</caption>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">Category</th>
                <th scope="col" className="w-[42%] pb-2 text-right font-medium">Amount</th>
                <th scope="col" className="w-[18%] pb-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.name}>
                  <th scope="row" className="py-2 pr-2 text-left font-normal text-foreground">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: r.color }} aria-hidden="true" />
                      {r.name}
                    </span>
                  </th>
                  <td className="py-2 text-right tabular-nums text-foreground whitespace-nowrap">{formatRp(r.amount)}</td>
                  <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">{r.pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
