"use client"

import { Plus, ChevronRight, Briefcase, Building, Landmark, Home, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IncomeItem } from "./detail-panel"

interface IncomeListProps {
  items: IncomeItem[]
  selectedId: string | null
  onSelect: (item: IncomeItem) => void
  onAdd: () => void
}

const typeIcons: Record<string, typeof Briefcase> = {
  salary: Briefcase,
  business: Building,
  interest: Landmark,
  rental: Home,
  capital: TrendingUp,
  other: Wallet,
}

const typeColors: Record<string, string> = {
  salary: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  business: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  interest: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  rental: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  capital: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  other: "bg-muted text-muted-foreground border-border",
}

export function IncomeList({ items, selectedId, onSelect, onAdd }: IncomeListProps) {
  const totalGross = items.reduce((sum, item) => sum + item.gross, 0)
  const totalTds = items.reduce((sum, item) => sum + item.tds, 0)

  return (
    <div className="bg-card border border-border rounded-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted">
        <div>
          <h2 className="font-semibold text-foreground">Income Sources</h2>
          <p className="text-xs text-muted-foreground">{items.length} sources added</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/50">
        <div className="col-span-5">Source</div>
        <div className="col-span-2 text-right">Gross</div>
        <div className="col-span-2 text-right">TDS</div>
        <div className="col-span-2 text-right">Net</div>
        <div className="col-span-1"></div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = typeIcons[item.type] || Wallet
          const isSelected = selectedId === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                "w-full grid grid-cols-12 gap-2 px-4 py-3 text-left border-b border-border transition-colors",
                isSelected 
                  ? "bg-primary/5 border-l-2 border-l-primary" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 border",
                  typeColors[item.type]
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.source}</p>
                  <p className="text-[10px] text-muted-foreground">Sec {item.section}</p>
                </div>
              </div>
              <div className="col-span-2 text-right self-center">
                <span className="text-sm font-mono text-foreground">{item.gross.toLocaleString("en-IN")}</span>
              </div>
              <div className="col-span-2 text-right self-center">
                <span className="text-sm font-mono text-destructive">{item.tds.toLocaleString("en-IN")}</span>
              </div>
              <div className="col-span-2 text-right self-center">
                <span className="text-sm font-mono font-medium text-success">{(item.gross - item.tds).toLocaleString("en-IN")}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isSelected && "text-primary"
                )} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer Totals */}
      <div className="px-4 py-3 border-t border-border bg-muted">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5 text-sm font-semibold text-foreground">Total</div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-mono font-semibold text-foreground">{totalGross.toLocaleString("en-IN")}</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-mono font-semibold text-destructive">{totalTds.toLocaleString("en-IN")}</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-mono font-semibold text-success">{(totalGross - totalTds).toLocaleString("en-IN")}</span>
          </div>
          <div className="col-span-1"></div>
        </div>
      </div>
    </div>
  )
}
