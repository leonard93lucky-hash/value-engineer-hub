"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2, Loader2, Sparkles, Wrench, ArrowUp, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/constants"

interface UpdateNote {
  id: string
  title: string
  description: string
  type: string
  posted_at: string
  posted_by: string
}

interface UpdateNotesManagerProps {
  adminId: string
  open: boolean
  onClose: () => void
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  feature:     { label: "New Feature", icon: <Sparkles className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fix:         { label: "Fix",         icon: <Wrench className="w-3.5 h-3.5" />,   cls: "bg-red-50 text-red-700 border-red-200" },
  improvement: { label: "Improvement", icon: <ArrowUp className="w-3.5 h-3.5" />,  cls: "bg-blue-50 text-blue-700 border-blue-200" },
}

export function UpdateNotesManager({ adminId, open, onClose }: UpdateNotesManagerProps) {
  const [updates, setUpdates] = useState<UpdateNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"feature" | "fix" | "improvement">("feature")

  const fetchUpdates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/updates`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      const list: UpdateNote[] = data.updates || []
      list.sort((a, b) => String(b.posted_at).localeCompare(String(a.posted_at)))
      setUpdates(list)
    } catch (e: any) {
      toast.error("Failed to load updates", { description: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchUpdates()
  }, [open])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    setIsSaving(true)
    const toastId = toast.loading("Saving update note...")
    try {
      const res = await fetch(`${API_BASE_URL}/admin/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Id": adminId },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Save failed")
      toast.success("Update published!", { id: toastId, description: "All users will see this in the popup." })
      setTitle("")
      setDescription("")
      setType("feature")
      fetchUpdates()
    } catch (e: any) {
      toast.error("Failed to save", { id: toastId, description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Deleting...")
    try {
      const res = await fetch(`${API_BASE_URL}/admin/updates/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "X-Admin-Id": adminId },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || "Delete failed")
      }
      toast.success("Deleted", { id: toastId })
      setConfirmDeleteId(null)
      fetchUpdates()
    } catch (e: any) {
      toast.error("Failed to delete", { id: toastId, description: e.message })
    }
  }

  const formatPostedAt = (s: string): string => {
    if (!s) return ""
    return s.split(" ")[0]
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">Manage Update Notes</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                Publish changelog to all users
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Add new form */}
          <section className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Publish New Update</div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Title</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Added Deeplink Merchant field"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Type</Label>
                <Select value={type} onValueChange={v => setType(v as any)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">New Feature</SelectItem>
                    <SelectItem value="fix">Fix</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Description (optional)</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What changed and why users should know..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-y"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Publish Update
              </Button>
            </div>
          </section>

          {/* List existing */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Published ({updates.length})
              </div>
              <button onClick={fetchUpdates} className="text-[10px] text-gray-400 hover:text-gray-700 underline">
                Refresh
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                No updates published yet.
              </div>
            ) : (
              <div className="space-y-2">
                {updates.map(u => {
                  const meta = TYPE_META[u.type] || TYPE_META.feature
                  return (
                    <div key={u.id} className="p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                            {meta.icon} {meta.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatPostedAt(u.posted_at)}</span>
                          {u.posted_by && (
                            <span className="text-[10px] text-gray-400">· by {u.posted_by}</span>
                          )}
                        </div>
                        {confirmDeleteId === u.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200 shrink-0">
                            <button onClick={() => handleDelete(u.id)} className="px-2 py-1 text-red-500 text-[10px] font-bold hover:bg-red-500 hover:text-white rounded">YES</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-gray-500 text-[10px] hover:bg-gray-100 rounded">NO</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(u.id)}
                            className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition-all shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{u.title}</div>
                      {u.description && (
                        <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{u.description}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
