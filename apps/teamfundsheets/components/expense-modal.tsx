"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { Expense } from "@/lib/types"

const CATEGORIES = ["Food & Drink", "Transport", "Office Supplies", "Utilities", "Other"]

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (expense: Expense) => void
}

const fieldCls =
  "w-full px-3 py-2.5 min-h-[44px] bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"

export default function ExpenseModal({ isOpen, onClose, onSubmit }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    category: CATEGORIES[0],
    date: new Date().toISOString().split("T")[0],
    amount: 0,
  })
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    firstFieldRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [isOpen, onClose])

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="bg-card border border-border rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card">
          <h2 id="expense-modal-title" className="text-lg sm:text-xl font-semibold text-foreground">Add Expense</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2.5 rounded-lg hover:bg-canvas transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="expense-description" className="block text-sm font-medium text-foreground mb-2">Description</label>
            <input
              id="expense-description"
              ref={firstFieldRef}
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Snacks for team"
              className={fieldCls}
              required
            />
          </div>

          <div>
            <label htmlFor="expense-category" className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              id="expense-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={fieldCls}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="expense-date" className="block text-sm font-medium text-foreground mb-2">Date</label>
            <input
              id="expense-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={fieldCls}
              required
            />
          </div>

          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-foreground mb-2">Amount (IDR)</label>
            <input
              id="expense-amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number.parseInt(e.target.value) })}
              className={fieldCls}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors mt-6"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  )
}
