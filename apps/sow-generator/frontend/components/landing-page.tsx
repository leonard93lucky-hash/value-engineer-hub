"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { Smartphone, Code2, ChevronRight, Lock, PencilLine, Send, FileCheck2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { API_BASE_URL } from "@/lib/constants"

interface LandingPageProps {
  currentUser: { name: string; id: number }
  onLogout: () => void
  onSelectProduct: (product: "SDK" | "API" | "CREDENTIAL") => void
}

type Product = "SDK" | "API" | "CREDENTIAL"

const DOCUMENT_TYPES: { key: Product; icon: LucideIcon; title: string; description: string; fields: string[] }[] = [
  {
    key: "SDK",
    icon: Smartphone,
    title: "SDK Liveness",
    description: "SOW for a Liveness integration using the SDK in a mobile or web app, including UI specification details.",
    fields: ["Enterprise and merchant name", "PIC VE and PIC BD", "SDK platform (iOS, Android, Web)", "Liveness configuration", "RASP and RGB config", "Timeline"],
  },
  {
    key: "API",
    icon: Code2,
    title: "API PrivyPass",
    description: "SOW for a direct backend-to-backend PrivyPass API integration and its feature configuration.",
    fields: ["Enterprise PrivyID", "Citizenship", "Callback URL", "Subscription type", "Identifier and SSO", "Timeline"],
  },
  {
    key: "CREDENTIAL",
    icon: Lock,
    title: "Credential document",
    description: "Staging and production credential document for an enterprise, with every service it uses.",
    fields: ["Services and sub-services", "API key and secret key", "Merchant key", "IP address", "Environment"],
  },
]

const STEPS: { icon: LucideIcon; title: string; body: string; tile: string }[] = [
  { icon: PencilLine, title: "Fill in the form", body: "Choose a document type. The preview updates as you type.", tile: "bg-[#F2E8DD]" },
  { icon: Send, title: "Submit for review", body: "Your submission joins the VE Support admin queue.", tile: "bg-[#F2DADF]" },
  { icon: FileCheck2, title: "Document is generated", body: "VE Support assigns the initial and generates the final document.", tile: "bg-[#EAF5EE]" },
]

interface UpdateNote {
  id: string
  title: string
  description?: string
  type: string
  posted_at: string
  posted_by?: string
}

function UpdateDescription({ text }: { text?: string }) {
  const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return null
  const bullets = lines.filter(l => /^[-•*]\s*/.test(l))
  if (bullets.length === lines.length) {
    return (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-normal text-muted-foreground">
        {lines.map((l, i) => <li key={i}>{l.replace(/^[-•*]\s*/, "")}</li>)}
      </ul>
    )
  }
  return <p className="mt-2 whitespace-pre-line text-sm leading-normal text-muted-foreground">{lines.join("\n")}</p>
}

const TYPE_LABEL: Record<string, string> = { feature: "New feature", fix: "Fix", improvement: "Improvement" }

function formatDate(s: string): string {
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
}

export function LandingPage({ currentUser, onLogout, onSelectProduct }: LandingPageProps) {
  const [isIframe, setIsIframe] = useState(false)
  const [updates, setUpdates] = useState<UpdateNote[] | null>(null)
  const [updatesFailed, setUpdatesFailed] = useState(false)
  const updatesListRef = useRef<HTMLUListElement>(null)
  const [updatesMaxHeight, setUpdatesMaxHeight] = useState<number | undefined>(undefined)

  const [updatesCanScroll, setUpdatesCanScroll] = useState(false)

  // Desktop (lg): the list fills the box next to the document types and scrolls.
  // Smaller screens: show 3 updates at a time; the rest scroll.
  useLayoutEffect(() => {
    const list = updatesListRef.current
    if (!list || !updates) return
    const lg = window.matchMedia("(min-width: 1024px)")
    const measure = () => {
      if (lg.matches || updates.length <= 3) {
        setUpdatesMaxHeight(undefined)
      } else {
        const fourth = list.children[3] as HTMLElement | undefined
        if (fourth) setUpdatesMaxHeight(fourth.offsetTop - list.offsetTop)
      }
      requestAnimationFrame(() => setUpdatesCanScroll(list.scrollHeight > list.clientHeight + 1))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    lg.addEventListener("change", measure)
    return () => { ro.disconnect(); lg.removeEventListener("change", measure) }
  }, [updates])

  useEffect(() => {
    setIsIframe(window !== window.top)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE_URL}/updates`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        const list: UpdateNote[] = Array.isArray(d?.updates) ? d.updates : []
        list.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
        setUpdates(list)
      })
      .catch(() => setUpdatesFailed(true))
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* SUBHEADER - hanya tampil saat bukan di dalam iframe hub */}
      {!isIframe && (
        <header className="border-b border-border px-6 py-3 flex items-center bg-card">
          <span className="text-sm font-semibold text-foreground tracking-wide">SOW Generator</span>
        </header>
      )}

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-8 pb-16 max-md:px-4 max-md:pb-12">
        <PageHeader
          title="SOW generator"
          subtitle="Choose the document you want to create. Each form shows a live preview of the final document."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Document types */}
          <section aria-labelledby="doc-types-title">
            <h2 id="doc-types-title" className="mb-3 text-xl font-semibold text-foreground">Document types</h2>
            <ul className="flex flex-col gap-3">
              {DOCUMENT_TYPES.map(({ key, icon: Icon, title, description, fields }) => (
                <li key={key} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas">
                    <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-base leading-normal text-muted-foreground">{description}</p>
                    <p className="mt-3 text-sm font-medium text-foreground">You will fill in</p>
                    <ul className="mt-2 flex flex-wrap gap-2" aria-label={`${title} form fields`}>
                      {fields.map(f => (
                        <li key={f} className="rounded-md border border-border bg-canvas px-2 py-1 text-[13px] text-foreground">{f}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(key)}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1 self-stretch rounded-lg border border-input bg-white px-4 text-[15px] font-medium text-foreground transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] sm:self-center"
                    aria-label={`Create ${title}`}
                  >
                    Create document <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Side panel */}
          <aside className="relative">
            <div className="flex flex-col gap-6 lg:absolute lg:inset-0">
            <section aria-labelledby="how-title">
              <h2 id="how-title" className="mb-3 text-xl font-semibold text-foreground">How it works</h2>
              <div className="rounded-xl border border-border bg-card p-5">
              <ol className="relative flex flex-col gap-5">
                {STEPS.map(({ icon: StepIcon, title, body, tile }, i) => (
                  <li key={title} className="relative flex gap-4">
                    {i < STEPS.length - 1 && (
                      <span className="absolute left-[23px] top-12 h-[calc(100%-28px)] w-px border-l-2 border-dashed border-border" aria-hidden="true" />
                    )}
                    <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile}`} aria-hidden="true">
                      <StepIcon className="h-6 w-6 text-[#430A23]" strokeWidth={1.75} />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#430A23] text-[11px] font-semibold leading-none text-white tabular-nums">{i + 1}</span>
                    </span>
                    <div className="pt-0.5">
                      <p className="text-[15px] font-medium text-foreground"><span className="sr-only">Step {i + 1}: </span>{title}</p>
                      <p className="text-sm leading-normal text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              </div>
            </section>

            <section aria-labelledby="news-title" className="flex flex-1 flex-col lg:min-h-0">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 id="news-title" className="text-xl font-semibold text-foreground">Latest updates</h2>
                {updates && updates.length > 0 && (
                  <span className="text-[13px] text-muted-foreground tabular-nums">{updates.length} {updates.length === 1 ? "note" : "notes"}</span>
                )}
              </div>
              <div className="flex flex-1 flex-col rounded-xl border border-border bg-card py-5 pl-5 pr-2 lg:min-h-0 lg:overflow-hidden">
              {updates === null && !updatesFailed && (
                <p className="text-sm text-muted-foreground">Loading updates…</p>
              )}
              {updatesFailed && (
                <p className="text-sm text-muted-foreground">We couldn't load the update notes. They're still available from the "What's new" button.</p>
              )}
              {updates && updates.length === 0 && (
                <p className="text-sm text-muted-foreground">No update notes yet.</p>
              )}
              {updates && updates.length > 0 && (
                <>
                  <ul
                    ref={updatesListRef}
                    tabIndex={updatesCanScroll ? 0 : undefined}
                    aria-label={updatesCanScroll ? "Update notes, scroll to read more" : "Update notes"}
                    style={updatesMaxHeight ? { maxHeight: updatesMaxHeight } : undefined}
                    className="updates-scroll relative flex flex-col divide-y divide-border overflow-y-auto overscroll-contain pr-3 lg:min-h-0 lg:flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                  >
                    {updates.map(u => (
                      <li key={u.id} className="py-3 first:pt-0">
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                          <span className="rounded-md border border-border bg-canvas px-1.5 py-0.5 font-medium text-foreground">{TYPE_LABEL[u.type] ?? "Update"}</span>
                          <span className="tabular-nums">{formatDate(u.posted_at)}</span>
                        </div>
                        <p className="mt-1 text-[15px] font-medium leading-snug text-foreground">{u.title}</p>
                        <UpdateDescription text={u.description} />
                      </li>
                    ))}
                  </ul>
                  {updatesCanScroll && (
                    <p className="mr-3 mt-2 border-t border-border pt-2 text-[13px] text-muted-foreground">Scroll inside this box to read every update.</p>
                  )}
                </>
              )}
              </div>
            </section>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER */}
      {!isIframe && (
        <footer className="text-center py-6 text-muted-foreground text-xs font-medium tracking-wide">
          &copy; 2026 PT Privy Identitas Digital. Value Engineer Tools.
        </footer>
      )}
    </div>
  )
}
