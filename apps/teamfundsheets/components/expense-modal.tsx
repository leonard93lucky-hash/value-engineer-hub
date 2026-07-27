"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import type { Expense } from "@/app/page"

const CATEGORIES = ["Food & Drink", "Transport", "Office Supplies", "Utilities", "Other"]

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (expense: Expense) => void
}

export default function ExpenseModal({ isOpen, onClose, onSubmit }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    category: CATEGORIES[0],
    date: new Date().toISOString().split("T")[0],
    amount: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const expense: Expense = {
      id: Date.now().toString(),
      description: formData.description,
      category: formData.category,
      date: formData.date,
      amount: formData.amount,
    }

    onSubmit(expense)
    setFormData({
      description: "",
      category: CATEGORIES[0],
      date: new Date().toISOString().split("T")[0],
      amount: 0,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Add Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Snacks for team"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Amount (IDR)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors mt-6"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  )
}
