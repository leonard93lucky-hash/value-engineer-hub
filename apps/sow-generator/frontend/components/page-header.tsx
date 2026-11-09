import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Same layout as the hub's PageHeader (apps/ve-faq/src/components/PageHeader.jsx). */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pt-6 pb-4 mb-6 max-md:pt-4">
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="text-[28px] max-md:text-2xl leading-tight font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-base leading-normal text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

interface EditorHeaderProps {
  title: string
  onBack?: () => void
}

/** Compact header for the split-screen document editors. */
export function EditorHeader({ title, onBack }: EditorHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to document types"
          title="Back to document types"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
    </div>
  )
}
