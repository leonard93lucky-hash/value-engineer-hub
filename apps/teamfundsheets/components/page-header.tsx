import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Same layout as the hub PageHeader (apps/ve-faq/src/components/PageHeader.jsx) and the SOW copy. */
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
