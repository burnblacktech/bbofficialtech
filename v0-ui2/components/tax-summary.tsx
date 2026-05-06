"use client"

import { ArrowRight, TrendingDown, TrendingUp, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaxSummaryProps {
  grossIncome: number
  deductions: number
  tdsDeducted: number
}

export function TaxSummary({ grossIncome, deductions, tdsDeducted }: TaxSummaryProps) {
  const taxableIncome = Math.max(0, grossIncome - deductions)
  
  // New Regime Tax Calculation (FY 2024-25)
  const calculateTax = (income: number) => {
    let tax = 0
    const slabs = [
      { limit: 300000, rate: 0 },
      { limit: 700000, rate: 0.05 },
      { limit: 1000000, rate: 0.10 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ]
    
    let remaining = income
    let prevLimit = 0
    
    for (const slab of slabs) {
      const slabIncome = Math.min(remaining, slab.limit - prevLimit)
      if (slabIncome <= 0) break
      tax += slabIncome * slab.rate
      remaining -= slabIncome
      prevLimit = slab.limit
    }
    
    return tax
  }

  const baseTax = calculateTax(taxableIncome)
  const surcharge = taxableIncome > 5000000 ? baseTax * 0.10 : 0
  const healthCess = (baseTax + surcharge) * 0.04
  const totalTax = baseTax + surcharge + healthCess
  const netPayable = totalTax - tdsDeducted
  const isRefund = netPayable < 0

  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0

  return (
    <div className="bg-card border border-border rounded-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Tax Computation</h2>
          <span className="text-xs text-muted-foreground">New Regime FY 2024-25</span>
        </div>
      </div>

      {/* Computation Flow */}
      <div className="p-4 space-y-3">
        {/* Gross Income */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Gross Total Income</span>
          <span className="text-sm font-mono font-medium">{grossIncome.toLocaleString("en-IN")}</span>
        </div>

        {/* Deductions */}
        <div className="flex items-center justify-between text-success">
          <span className="text-sm flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Less: Deductions
          </span>
          <span className="text-sm font-mono font-medium">-{deductions.toLocaleString("en-IN")}</span>
        </div>

        <div className="border-t border-dashed border-border my-2" />

        {/* Taxable Income */}
        <div className="flex items-center justify-between bg-secondary/50 -mx-4 px-4 py-2">
          <span className="text-sm font-medium text-foreground">Taxable Income</span>
          <span className="text-sm font-mono font-semibold">{taxableIncome.toLocaleString("en-IN")}</span>
        </div>

        <div className="border-t border-dashed border-border my-2" />

        {/* Tax Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax on Total Income</span>
            <span className="font-mono">{baseTax.toLocaleString("en-IN")}</span>
          </div>
          {surcharge > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Add: Surcharge (10%)</span>
              <span className="font-mono">{surcharge.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Add: Health & Education Cess (4%)</span>
            <span className="font-mono">{healthCess.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="border-t border-border my-2" />

        {/* Total Tax */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Tax Liability</span>
          <span className="text-sm font-mono font-semibold">{totalTax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </div>

        {/* TDS */}
        <div className="flex items-center justify-between text-success">
          <span className="text-sm flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Less: TDS/TCS/Advance Tax
          </span>
          <span className="text-sm font-mono font-medium">-{tdsDeducted.toLocaleString("en-IN")}</span>
        </div>

        <div className="border-t border-border my-2" />

        {/* Final Result */}
        <div className={cn(
          "flex items-center justify-between -mx-4 px-4 py-3 rounded-sm",
          isRefund ? "bg-success/10" : "bg-destructive/10"
        )}>
          <span className={cn(
            "font-semibold flex items-center gap-2",
            isRefund ? "text-success" : "text-destructive"
          )}>
            {isRefund ? (
              <>
                <TrendingUp className="w-4 h-4" />
                Refund Due
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Tax Payable
              </>
            )}
          </span>
          <span className={cn(
            "text-lg font-mono font-bold",
            isRefund ? "text-success" : "text-destructive"
          )}>
            {isRefund ? "+" : ""}{Math.abs(netPayable).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-border bg-muted grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Effective Tax Rate</p>
          <p className="text-lg font-mono font-semibold text-foreground">{effectiveRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tax Saved</p>
          <p className="text-lg font-mono font-semibold text-success">{(deductions * 0.3).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
    </div>
  )
}
