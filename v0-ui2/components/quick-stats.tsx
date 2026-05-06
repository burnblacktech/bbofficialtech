"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface QuickStatsProps {
  grossIncome: number
  deductions: number
  totalTax: number
  tdsDeducted: number
}

export function QuickStats({ grossIncome, deductions, totalTax, tdsDeducted }: QuickStatsProps) {
  const effectiveRate = grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(1) : "0.0"
  const savingsRate = grossIncome > 0 ? ((deductions / grossIncome) * 100).toFixed(1) : "0.0"
  const refundOrPayable = tdsDeducted - totalTax

  const stats = [
    {
      label: "EFFECTIVE TAX RATE",
      value: `${effectiveRate}%`,
      trend: "neutral",
      sub: `on ₹${(grossIncome / 100000).toFixed(1)}L gross`,
    },
    {
      label: "SAVINGS RATE",
      value: `${savingsRate}%`,
      trend: "up",
      sub: `₹${(deductions / 100000).toFixed(1)}L deducted`,
    },
    {
      label: "TDS EFFICIENCY",
      value: refundOrPayable >= 0 ? "OPTIMAL" : "SHORT",
      trend: refundOrPayable >= 0 ? "up" : "down",
      sub: refundOrPayable >= 0 ? `₹${(refundOrPayable / 1000).toFixed(0)}K refund` : `₹${(Math.abs(refundOrPayable) / 1000).toFixed(0)}K due`,
    },
    {
      label: "REGIME",
      value: "NEW",
      trend: "neutral",
      sub: "FY 2024-25",
    },
  ]

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-primary" />
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-destructive" />
    return <Minus className="w-3 h-3 text-muted-foreground" />
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border border-border">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`p-2 ${idx < stats.length - 1 ? "border-r border-border" : ""} ${idx < 2 ? "border-b lg:border-b-0 border-border" : ""}`}
        >
          <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">{stat.label}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-mono font-bold text-foreground">{stat.value}</span>
            <TrendIcon trend={stat.trend} />
          </div>
          <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{stat.sub}</div>
        </div>
      ))}
    </div>
  )
}
