"use client"

import { cn } from "@/lib/utils"

type SectionStatus = "complete" | "pending"

interface Section {
  id: string
  label: string
  status: SectionStatus
  amount?: string
}

interface TaxSummary {
  grossIncome: number
  deductions: number
  taxable: number
  tax: number
  tds: number
  refund: number
}

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  sections: Section[]
  summary: TaxSummary
  regime: "old" | "new"
  onRegimeChange: (regime: "old" | "new") => void
}

function formatAmount(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`
}

function StatusDot({ status }: { status: SectionStatus }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full flex-shrink-0",
        status === "complete" ? "bg-success" : "bg-muted-foreground/40"
      )}
    />
  )
}

export function TaxFormSidebar({
  activeSection,
  onSectionChange,
  sections,
  summary,
  regime,
  onRegimeChange,
  isOpen,
  onClose,
}: SidebarProps & { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "w-[240px] lg:w-[220px] h-screen flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0",
        "fixed lg:relative z-50 lg:z-auto",
        "transition-transform duration-200 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo Bar */}
      <div className="px-4 py-3 bg-black flex items-center justify-between">
        <span className="text-base font-bold tracking-wide text-gold">
          BurnBlack
        </span>
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="lg:hidden text-muted-foreground hover:text-foreground"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filing Info Badge */}
      <div className="px-4 py-2.5 border-b border-sidebar-border">
        <span className="text-xs px-2 py-1 bg-card rounded text-muted-foreground">
          ITR-2 · AY 2025-26
        </span>
      </div>

      {/* Section Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => {
              onSectionChange(section.id)
              onClose?.()
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2.5 text-left",
              "hover:bg-sidebar-accent",
              activeSection === section.id
                ? "bg-sidebar-accent border-l-2 border-gold"
                : "border-l-2 border-transparent"
            )}
          >
            <StatusDot status={section.status} />
            <span className="flex-1 text-[13px] text-sidebar-foreground truncate">
              {section.label}
            </span>
            {section.amount && (
              <span className="text-xs font-mono tabular-nums text-muted-foreground text-right">
                {section.amount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Tax Summary Block */}
      <div className="px-4 py-3">
        <div className="space-y-1">
          <SummaryRow label="Gross Income" value={formatAmount(summary.grossIncome)} />
          <SummaryRow label="Deductions" value={`-${formatAmount(summary.deductions)}`} />
          <SummaryRow label="Taxable" value={formatAmount(summary.taxable)} highlight />
        </div>
        
        <div className="my-2 border-t border-sidebar-border" />
        
        <div className="space-y-1">
          <SummaryRow label="Tax" value={formatAmount(summary.tax)} />
          <SummaryRow label="TDS" value={`-${formatAmount(summary.tds)}`} />
        </div>
        
        <div className="my-2 border-t border-sidebar-border" />
        
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Refund</span>
          <span className="text-base font-bold font-mono tabular-nums text-success">
            {formatAmount(summary.refund)}
          </span>
        </div>
      </div>

      {/* Regime Toggle */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex gap-1.5">
          <button
            onClick={() => onRegimeChange("old")}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs rounded",
              regime === "old"
                ? "bg-gold text-primary-foreground font-medium"
                : "bg-card text-muted-foreground"
            )}
          >
            Old
          </button>
          <button
            onClick={() => onRegimeChange("new")}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs rounded",
              regime === "new"
                ? "bg-gold text-primary-foreground font-medium"
                : "bg-card text-muted-foreground"
            )}
          >
            New
          </button>
        </div>
        <p className="text-xs text-success mt-2">
          Save ₹23,000 with Old Regime
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
        <button className="w-full py-2 px-3 text-sm font-medium bg-gold text-primary-foreground rounded">
          Submit Filing
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 px-2 text-xs text-muted-foreground border border-border rounded hover:border-muted-foreground">
            JSON
          </button>
          <button className="flex-1 py-1.5 px-2 text-xs text-muted-foreground border border-border rounded hover:border-muted-foreground">
            PDF
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}

function SummaryRow({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string
  value: string
  highlight?: boolean 
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-mono tabular-nums text-right",
        highlight ? "text-foreground font-medium" : "text-muted-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}
