"use client"

import { useState, useEffect, useRef } from "react"
import { X, Save } from "lucide-react"
import { useAuth } from "@/app/providers"
import { api as apiPath } from "@/lib/api-base"

interface TargetsConfigProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (target: number) => void
}

const fieldCls =
  "w-full px-3 py-2.5 min-h-[44px] bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"

export default function TargetsConfig({ isOpen, onClose, onSaved }: TargetsConfigProps) {
  const { isSupport } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlyTarget, setMonthlyTarget] = useState(600000)
  const [loading, setLoading] = useState(false)
  const firstFieldRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(apiPath(`/api/targets?year=${year}`))
      .then(res => res.json())
      .then(data => setMonthlyTarget(data.monthlyTarget || 600000))
      .catch(err => console.error("Failed to load target:", err))
      .finally(() => setLoading(false))
  }, [isOpen, year])

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

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch(apiPath("/api/targets"), {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="targets-modal-title"
        className="bg-card border border-border rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 id="targets-modal-title" className="text-lg sm:text-xl font-semibold text-foreground">Yearly Target</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2.5 rounded-lg hover:bg-canvas transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="targets-year" className="block text-sm font-medium text-foreground mb-2">Year</label>
            <select
              id="targets-year"
              ref={firstFieldRef}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={fieldCls}
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="targets-amount" className="block text-sm font-medium text-foreground mb-2">
              Target per person per month (IDR)
            </label>
            <input
              id="targets-amount"
              type="number"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(Number(e.target.value))}
              className={fieldCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This target applies to all members equally.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 bg-card border border-input hover:bg-canvas text-foreground font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 min-h-[44px] px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
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
