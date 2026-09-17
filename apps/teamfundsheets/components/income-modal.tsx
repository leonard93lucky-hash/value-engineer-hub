"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { Payment } from "@/lib/types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface UserOption {
  id: string
  name: string
}

interface IncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payment: Payment) => void
}

const fieldCls =
  "w-full px-3 py-2.5 min-h-[44px] bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"

export default function IncomeModal({ isOpen, onClose, onSubmit }: IncomeModalProps) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    name: "",
    transferDate: new Date().toISOString().split("T")[0],
    amount: 50000,
  })
  const firstFieldRef = useRef<HTMLSelectElement>(null)

  const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || ""

  const [usersApi, setUsersApi] = useState("")

  useEffect(() => {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    setUsersApi(
      isLocal
        ? "http://localhost:3001/faq-api/users"
        : `${hubUrl}/faq-api/users`
    )
  }, [])

  useEffect(() => {
    if (!isOpen || !usersApi) return
    fetch(usersApi)
      .then(res => res.json())
      .then(data => {
        const sorted = (data as UserOption[]).sort((a, b) => a.name.localeCompare(b.name))
        setUsers(sorted)
      })
      .catch(err => console.error("Failed to fetch users:", err))
  }, [isOpen, usersApi])

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
    const payment: Payment = {
      id: Date.now().toString(),
      month: formData.month,
      name: formData.name,
      transferDate: formData.transferDate,
      amount: formData.amount,
    }
    onSubmit(payment)
    setFormData({
      month: MONTHS[new Date().getMonth()],
      name: "",
      transferDate: new Date().toISOString().split("T")[0],
      amount: 50000,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="income-modal-title"
        className="bg-card border border-border rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card">
          <h2 id="income-modal-title" className="text-lg sm:text-xl font-semibold text-foreground">Add Income</h2>
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
            <label htmlFor="income-month" className="block text-sm font-medium text-foreground mb-2">Month</label>
            <select
              id="income-month"
              ref={firstFieldRef}
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className={fieldCls}
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="income-name" className="block text-sm font-medium text-foreground mb-2">Name</label>
            <select
              id="income-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={fieldCls}
              required
            >
              <option value="">Select a name...</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="income-date" className="block text-sm font-medium text-foreground mb-2">Transfer Date</label>
            <input
              id="income-date"
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
              className={fieldCls}
              required
            />
          </div>

          <div>
            <label htmlFor="income-amount" className="block text-sm font-medium text-foreground mb-2">Amount (IDR)</label>
            <input
              id="income-amount"
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
            Add Income
          </button>
        </form>
      </div>
    </div>
  )
}
