"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import type { IncomeDetail } from "./detail-panel"

const initialIncome: IncomeDetail[] = [
  { id: "1", source: "ACME Corp Ltd", type: "SALARY", gross: 1850000, tds: 185000, net: 1665000, section: "17(1)", pan: "ABCDE1234F", frequency: "monthly" },
  { id: "2", source: "Freelance - TechSoft", type: "PROFESSIONAL", gross: 450000, tds: 45000, net: 405000, section: "44ADA", frequency: "one-time" },
  { id: "3", source: "HDFC FD Interest", type: "INTEREST", gross: 82500, tds: 8250, net: 74250, section: "56(2)", frequency: "annual" },
  { id: "4", source: "Mutual Fund LTCG", type: "CAPITAL GAIN", gross: 125000, tds: 0, net: 125000, section: "112A", frequency: "one-time" },
  { id: "5", source: "Rental - Flat A-402", type: "HOUSE PROPERTY", gross: 360000, tds: 0, net: 252000, section: "24", frequency: "monthly" },
  { id: "6", source: "Dividend - Reliance", type: "DIVIDEND", gross: 28000, tds: 0, net: 28000, section: "56(2)", frequency: "one-time" },
]

interface IncomeTableProps {
  onTotalChange: (gross: number, tds: number) => void
  selectedId: string | null
  onSelect: (item: IncomeDetail) => void
}

export function IncomeTable({ onTotalChange, selectedId, onSelect }: IncomeTableProps) {
  const [income] = useState<IncomeDetail[]>(initialIncome)

  const totals = income.reduce(
    (acc, item) => ({
      gross: acc.gross + item.gross,
      tds: acc.tds + item.tds,
      net: acc.net + item.net,
    }),
    { gross: 0, tds: 0, net: 0 }
  )

  useEffect(() => {
    onTotalChange(totals.gross, totals.tds)
  }, [totals.gross, totals.tds, onTotalChange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const typeColors: Record<string, string> = {
    SALARY: "text-primary",
    PROFESSIONAL: "text-accent",
    INTEREST: "text-chart-4",
    "CAPITAL GAIN": "text-chart-5",
    "HOUSE PROPERTY": "text-chart-2",
    DIVIDEND: "text-chart-3",
  }

  return (
    <div className="border border-border">
      <div className="bg-secondary px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Income Sources</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">CLICK TO EDIT</span>
          <span className="text-xs font-mono text-primary">{income.length} ENTRIES</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-2 py-1.5 text-muted-foreground font-normal">SOURCE</th>
              <th className="text-left px-2 py-1.5 text-muted-foreground font-normal">TYPE</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground font-normal">GROSS</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground font-normal">TDS</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground font-normal">NET</th>
              <th className="text-left px-2 py-1.5 text-muted-foreground font-normal">SEC</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {income.map((item, idx) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item)}
                className={`border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                } ${selectedId === item.id ? "!bg-primary/10 border-l-2 border-l-primary" : ""}`}
              >
                <td className="px-2 py-1.5 text-foreground truncate max-w-[180px]">{item.source}</td>
                <td className={`px-2 py-1.5 ${typeColors[item.type] || "text-foreground"}`}>{item.type}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(item.gross)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-destructive">
                  {item.tds > 0 ? `-${formatCurrency(item.tds)}` : "—"}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-primary font-medium">
                  {formatCurrency(item.net)}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">{item.section}</td>
                <td className="px-1 py-1.5">
                  <ChevronRight className={`w-3 h-3 ${selectedId === item.id ? "text-primary" : "text-muted-foreground"}`} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-secondary border-t border-border">
              <td className="px-2 py-2 font-medium" colSpan={2}>
                TOTAL INCOME
              </td>
              <td className="px-2 py-2 text-right tabular-nums font-medium">{formatCurrency(totals.gross)}</td>
              <td className="px-2 py-2 text-right tabular-nums text-destructive font-medium">
                -{formatCurrency(totals.tds)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-primary font-bold">
                {formatCurrency(totals.net)}
              </td>
              <td className="px-2 py-2" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
