"use client"

interface TaxSlabsProps {
  taxableIncome: number
}

const slabs = [
  { from: 0, to: 300000, rate: 0, label: "0 - 3L" },
  { from: 300000, to: 700000, rate: 5, label: "3L - 7L" },
  { from: 700000, to: 1000000, rate: 10, label: "7L - 10L" },
  { from: 1000000, to: 1200000, rate: 15, label: "10L - 12L" },
  { from: 1200000, to: 1500000, rate: 20, label: "12L - 15L" },
  { from: 1500000, to: Infinity, rate: 30, label: "> 15L" },
]

export function TaxSlabs({ taxableIncome }: TaxSlabsProps) {
  const getSlabStatus = (slab: typeof slabs[0]) => {
    if (taxableIncome <= slab.from) return "empty"
    if (taxableIncome >= slab.to) return "full"
    return "partial"
  }

  const getSlabFill = (slab: typeof slabs[0]) => {
    if (taxableIncome <= slab.from) return 0
    if (taxableIncome >= slab.to) return 100
    const slabRange = slab.to - slab.from
    const inSlab = taxableIncome - slab.from
    return (inSlab / slabRange) * 100
  }

  const formatCompact = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return amount.toString()
  }

  const calculateSlabTax = (slab: typeof slabs[0]) => {
    if (taxableIncome <= slab.from) return 0
    const slabIncome = Math.min(taxableIncome, slab.to) - slab.from
    return slabIncome * (slab.rate / 100)
  }

  return (
    <div className="border border-border">
      <div className="bg-secondary px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tax Slabs</span>
        <span className="text-xs font-mono text-accent">NEW REGIME</span>
      </div>
      <div className="p-2 space-y-1">
        {slabs.map((slab) => {
          const status = getSlabStatus(slab)
          const fill = getSlabFill(slab)
          const slabTax = calculateSlabTax(slab)

          return (
            <div key={slab.label} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="w-14 text-muted-foreground">{slab.label}</span>
              <span className="w-8 text-right text-foreground">{slab.rate}%</span>
              <div className="flex-1 h-3 bg-muted/50 relative">
                <div
                  className={`h-full transition-all ${
                    status === "partial" ? "bg-accent" : status === "full" ? "bg-primary/60" : "bg-transparent"
                  }`}
                  style={{ width: `${fill}%` }}
                ></div>
                {status === "partial" && (
                  <div className="absolute right-0 top-0 h-full w-0.5 bg-accent animate-pulse"></div>
                )}
              </div>
              <span className={`w-16 text-right tabular-nums ${slabTax > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {slabTax > 0 ? `₹${formatCompact(slabTax)}` : "—"}
              </span>
            </div>
          )
        })}
      </div>
      <div className="border-t border-border px-2 py-1.5 flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">TAXABLE: ₹{formatCompact(taxableIncome)}</span>
        <span className="text-primary">
          TAX: ₹{formatCompact(slabs.reduce((acc, slab) => acc + calculateSlabTax(slab), 0))}
        </span>
      </div>
    </div>
  )
}
