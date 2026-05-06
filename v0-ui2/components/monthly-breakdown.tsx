"use client"

const months = [
  { month: "APR", salary: 154167, tds: 15417, other: 5200 },
  { month: "MAY", salary: 154167, tds: 15417, other: 3800 },
  { month: "JUN", salary: 154167, tds: 15417, other: 8500 },
  { month: "JUL", salary: 154167, tds: 15417, other: 4200 },
  { month: "AUG", salary: 154167, tds: 15417, other: 6100 },
  { month: "SEP", salary: 154167, tds: 15417, other: 7800 },
  { month: "OCT", salary: 154167, tds: 15417, other: 5500 },
  { month: "NOV", salary: 154167, tds: 15417, other: 4900 },
  { month: "DEC", salary: 154167, tds: 15417, other: 8200 },
  { month: "JAN", salary: 154167, tds: 15417, other: 6700 },
  { month: "FEB", salary: 154167, tds: 15417, other: 5100 },
  { month: "MAR", salary: 154163, tds: 15413, other: 9500 },
]

export function MonthlyBreakdown() {
  const maxSalary = Math.max(...months.map((m) => m.salary))

  const formatCompact = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return amount.toString()
  }

  return (
    <div className="border border-border">
      <div className="bg-secondary px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Monthly Cash Flow</span>
        <span className="text-xs font-mono text-muted-foreground">FY 2024-25</span>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-12 gap-1 text-[9px] font-mono">
          {months.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-1">
              <div className="h-16 w-full flex flex-col justify-end gap-0.5">
                <div
                  className="bg-primary/80 w-full"
                  style={{ height: `${(m.salary / maxSalary) * 100}%` }}
                  title={`Salary: ₹${m.salary.toLocaleString("en-IN")}`}
                ></div>
              </div>
              <span className="text-muted-foreground">{m.month}</span>
              <span className="text-foreground tabular-nums">{formatCompact(m.salary)}</span>
              <span className="text-destructive tabular-nums text-[8px]">-{formatCompact(m.tds)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-4 text-[9px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary"></div>
            <span className="text-muted-foreground">SALARY</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive"></div>
            <span className="text-muted-foreground">TDS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
