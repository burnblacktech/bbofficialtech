"use client"

import { useState, useEffect } from "react"
import { Check, ChevronRight } from "lucide-react"
import type { DeductionDetail } from "./detail-panel"

const initialDeductions: DeductionDetail[] = [
  { id: "1", section: "80C", description: "PPF, ELSS, LIC, EPF", limit: 150000, claimed: 150000, enabled: true },
  { id: "2", section: "80CCD(1B)", description: "NPS Additional", limit: 50000, claimed: 50000, enabled: true },
  { id: "3", section: "80D", description: "Health Insurance", limit: 75000, claimed: 52000, enabled: true },
  { id: "4", section: "80TTA", description: "Savings Interest", limit: 10000, claimed: 10000, enabled: true },
  { id: "5", section: "80G", description: "Donations", limit: 0, claimed: 15000, enabled: true },
  { id: "6", section: "80E", description: "Education Loan", limit: 0, claimed: 0, enabled: false },
  { id: "7", section: "80GG", description: "Rent Paid", limit: 60000, claimed: 0, enabled: false },
  { id: "8", section: "24(b)", description: "Home Loan Interest", limit: 200000, claimed: 108000, enabled: true },
  { id: "9", section: "STD", description: "Standard Deduction", limit: 75000, claimed: 75000, enabled: true },
]

interface DeductionsChecklistProps {
  onTotalChange: (total: number) => void
  selectedId: string | null
  onSelect: (item: DeductionDetail) => void
}

export function DeductionsChecklist({ onTotalChange, selectedId, onSelect }: DeductionsChecklistProps) {
  const [deductions, setDeductions] = useState<DeductionDetail[]>(initialDeductions)

  const toggleDeduction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    )
  }

  const totalDeductions = deductions.filter((d) => d.enabled).reduce((acc, d) => acc + d.claimed, 0)

  useEffect(() => {
    onTotalChange(totalDeductions)
  }, [totalDeductions, onTotalChange])

  const formatCurrency = (amount: number) => {
    if (amount === 0) return "—"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="border border-border">
      <div className="bg-secondary px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Deductions</span>
        <span className="text-xs font-mono text-primary">
          {deductions.filter((d) => d.enabled).length}/{deductions.length} ACTIVE
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {deductions.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-2 py-1.5 text-xs font-mono hover:bg-secondary/50 transition-colors cursor-pointer ${
              idx % 2 === 0 ? "bg-background" : "bg-muted/20"
            } ${!item.enabled ? "opacity-50" : ""} ${selectedId === item.id ? "!bg-primary/10 !opacity-100 border-l-2 border-l-primary" : ""}`}
            onClick={() => onSelect(item)}
          >
            <div
              className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                item.enabled ? "bg-primary border-primary" : "border-border"
              }`}
              onClick={(e) => toggleDeduction(item.id, e)}
            >
              {item.enabled && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-accent font-medium">{item.section}</span>
                <span className="text-muted-foreground truncate">{item.description}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              {item.limit > 0 && (
                <span className="text-muted-foreground text-[10px] hidden sm:inline">
                  MAX {formatCurrency(item.limit)}
                </span>
              )}
              <span className={`tabular-nums min-w-[70px] ${item.enabled ? "text-primary" : "text-muted-foreground"}`}>
                {formatCurrency(item.claimed)}
              </span>
              <ChevronRight className={`w-3 h-3 flex-shrink-0 ${selectedId === item.id ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-secondary border-t border-border px-2 py-2 flex items-center justify-between">
        <span className="text-xs font-mono font-medium">TOTAL DEDUCTIONS</span>
        <span className="text-xs font-mono tabular-nums text-primary font-bold">{formatCurrency(totalDeductions)}</span>
      </div>
    </div>
  )
}
