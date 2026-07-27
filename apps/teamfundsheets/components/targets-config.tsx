"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { useAuth } from "@/app/providers"

interface TargetsConfigProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (target: number) => void
}

export default function TargetsConfig({ isOpen, onClose, onSaved }: TargetsConfigProps) {
  const { isSupport } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlyTarget, setMonthlyTarget] = useState(600000)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`api/targets?year=${year}`)
      .then(res => res.json())
      .then(data => setMonthlyTarget(data.monthlyTarget || 600000))
      .catch(err => console.error("Failed to load target:", err))
      .finally(() => setLoading(false))
  }, [isOpen, year])

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch("api/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, monthlyTarget }),
      })
      onSaved(monthlyTarget)
      onClose()
    } catch (err) {
      console.error("Failed to save target:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !isSupport) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Yearly Target</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target per person per month (IDR)
            </label>
            <input
              type="number"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This target applies to all members equally.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              <Save size={16} className="inline mr-1" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
