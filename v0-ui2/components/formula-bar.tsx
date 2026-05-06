"use client"

interface FormulaBarProps {
  grossIncome: number
  tdsDeducted: number
  deductions: number
}

export function FormulaBar({ grossIncome, tdsDeducted, deductions }: FormulaBarProps) {
  const taxableIncome = Math.max(0, grossIncome - deductions)
  
  // New Tax Regime FY 2024-25 slabs
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
  const refundOrPayable = tdsDeducted - totalTax

  const formatCurrency = (amount: number, showSign = false) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
    if (showSign && amount !== 0) {
      return amount > 0 ? `+${formatted}` : `-${formatted}`
    }
    return formatted
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="border border-border">
      <div className="bg-secondary px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tax Computation</span>
        <span className="text-xs font-mono text-accent">NEW REGIME FY 2024-25</span>
      </div>
      
      {/* Formula Display */}
      <div className="bg-muted/30 border-b border-border px-3 py-2 overflow-x-auto">
        <div className="font-mono text-xs whitespace-nowrap flex items-center gap-1">
          <span className="text-muted-foreground">TAX_PAYABLE</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-muted-foreground">TAX(</span>
          <span className="text-foreground">{formatNumber(grossIncome)}</span>
          <span className="text-destructive"> − </span>
          <span className="text-foreground">{formatNumber(deductions)}</span>
          <span className="text-muted-foreground">)</span>
          <span className="text-muted-foreground"> + CESS</span>
          <span className="text-destructive"> − </span>
          <span className="text-foreground">{formatNumber(tdsDeducted)}</span>
          <span className="text-muted-foreground"> =</span>
          <span className={`font-bold ${refundOrPayable >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatCurrency(Math.abs(refundOrPayable))} {refundOrPayable >= 0 ? "REFUND" : "PAYABLE"}
          </span>
        </div>
      </div>

      {/* Computation Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 text-xs font-mono">
        <div className="border-b border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Gross Income</div>
          <div className="text-foreground tabular-nums mt-0.5">{formatCurrency(grossIncome)}</div>
        </div>
        <div className="border-b border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Deductions</div>
          <div className="text-destructive tabular-nums mt-0.5">−{formatCurrency(deductions)}</div>
        </div>
        <div className="border-b border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Taxable Income</div>
          <div className="text-accent tabular-nums mt-0.5 font-medium">{formatCurrency(taxableIncome)}</div>
        </div>
        <div className="border-b border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">TDS Paid</div>
          <div className="text-primary tabular-nums mt-0.5">{formatCurrency(tdsDeducted)}</div>
        </div>

        <div className="border-b lg:border-b-0 border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Base Tax</div>
          <div className="text-foreground tabular-nums mt-0.5">{formatCurrency(baseTax)}</div>
        </div>
        <div className="border-b lg:border-b-0 border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Surcharge</div>
          <div className="text-foreground tabular-nums mt-0.5">{surcharge > 0 ? formatCurrency(surcharge) : "—"}</div>
        </div>
        <div className="border-b lg:border-b-0 border-r border-border p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Health & Ed Cess</div>
          <div className="text-foreground tabular-nums mt-0.5">{formatCurrency(healthCess)}</div>
        </div>
        <div className="p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Total Tax</div>
          <div className="text-destructive tabular-nums mt-0.5 font-medium">{formatCurrency(totalTax)}</div>
        </div>
      </div>

      {/* Final Result */}
      <div className={`border-t border-border px-3 py-3 flex items-center justify-between ${refundOrPayable >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 ${refundOrPayable >= 0 ? "bg-primary" : "bg-destructive"} animate-pulse`}></div>
          <span className="text-xs font-mono uppercase tracking-wider">
            {refundOrPayable >= 0 ? "Refund Due" : "Tax Payable"}
          </span>
        </div>
        <span className={`text-lg font-mono tabular-nums font-bold ${refundOrPayable >= 0 ? "text-primary" : "text-destructive"}`}>
          {formatCurrency(Math.abs(refundOrPayable))}
        </span>
      </div>
    </div>
  )
}
