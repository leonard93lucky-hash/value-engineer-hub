"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Payment } from "@/app/page"

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

export default function IncomeModal({ isOpen, onClose, onSubmit }: IncomeModalProps) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    name: "",
    transferDate: new Date().toISOString().split("T")[0],
    amount: 50000,
  })

  const [usersApi, setUsersApi] = useState("")

  useEffect(() => {
    setUsersApi(
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3001/faq-api/users"
        : "/faq-api/users"
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
  }, [isOpen])

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Add Income</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Month</label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <select
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select a name...</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Transfer Date</label>
            <input
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
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
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors mt-6"
          >
            Add Income
          </button>
        </form>
      </div>
    </div>
  )
}
