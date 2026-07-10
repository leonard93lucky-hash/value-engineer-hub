"use client"

import React, { useState, useEffect } from "react"
import { X, Sparkles, Wrench, ArrowUp, Megaphone } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"

interface UpdateNote {
  id: string
  title: string
  description: string
  type: string // "feature" | "fix" | "improvement"
  posted_at: string
  posted_by: string
}

const STORAGE_KEY = "seenUpdateIds"

function getSeenIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function markAllAsSeen(ids: string[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch { /* ignore quota errors */ }
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  feature:     { label: "New Feature", icon: <Sparkles className="w-3.5 h-3.5" />,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fix:         { label: "Fix",         icon: <Wrench className="w-3.5 h-3.5" />,    cls: "bg-red-50 text-red-700 border-red-200" },
  improvement: { label: "Improvement", icon: <ArrowUp className="w-3.5 h-3.5" />,   cls: "bg-blue-50 text-blue-700 border-blue-200" },
}

function formatPostedAt(s: string): string {
  if (!s) return ""
  const clean = s.split(" ")[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split("-")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
  }
  return s
}

export function UpdateNotesPopup() {
  const [updates, setUpdates] = useState<UpdateNote[]>([])
  const [open, setOpen] = useState(false)
  const [unseenIds, setUnseenIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/updates`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data || data.status !== "success") return
        const list: UpdateNote[] = data.updates || []
        // Sort newest first (by posted_at string compare works for "yyyy-mm-dd hh:mm:ss")
        list.sort((a, b) => String(b.posted_at).localeCompare(String(a.posted_at)))
        setUpdates(list)
        const seen = getSeenIds()
        const unseen = list.filter(u => !seen.includes(u.id)).map(u => u.id)
        setUnseenIds(unseen)
        if (unseen.length > 0) setOpen(true)
      })
      .catch(() => { /* silent fail — popup is non-critical */ })
    return () => { cancelled = true }
  }, [])

  const dismiss = () => {
    markAllAsSeen(updates.map(u => u.id))
    setUnseenIds([])
    setOpen(false)
  }

  const reopen = () => setOpen(true)

  // Floating "What's New" button when popup is dismissed and there are updates
  if (!open) {
    if (updates.length === 0) return null
    return (
      <button
        onClick={reopen}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-500 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-all"
        title="What's New"
      >
        <Megaphone className="w-3.5 h-3.5" />
        <span>What&apos;s New</span>
        {unseenIds.length > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {unseenIds.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">What&apos;s New</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                {updates.length} update{updates.length !== 1 ? "s" : ""}
                {unseenIds.length > 0 && ` · ${unseenIds.length} new`}
              </div>
            </div>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {updates.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No updates yet.</div>
          ) : (
            updates.map(u => {
              const meta = TYPE_META[u.type] || TYPE_META.feature
              const isNew = unseenIds.includes(u.id)
              return (
                <div key={u.id} className={`p-3 rounded-xl border ${isNew ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                        {meta.icon} {meta.label}
                      </span>
                      {isNew && (
                        <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatPostedAt(u.posted_at)}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{u.title}</div>
                  {u.description && (
                    <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{u.description}</div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={dismiss}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  )
}
