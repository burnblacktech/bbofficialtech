"use client"

import { Plus, ChevronRight, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeductionItem } from "./detail-panel"

interface DeductionsListProps {
  items: DeductionItem[]
  selectedId: string | null
  onSelect: (item: DeductionItem) => void
  onToggle: (id: string) => void
  onAdd: () => void
}

export function DeductionsList({ items, selectedId, onSelect, onToggle, onAdd }: DeductionsListProps) {
  const totalClaimed = items.filter(i => i.enabled).reduce((sum, item) => sum + item.claimed, 0)
  const totalLimit = items.reduce((sum, item) => sum + item.limit, 0)
  const enabledCount = items.filter(i => i.enabled).length

  return (
    <div className="bg-card border border-border rounded-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted">
        <div>
          <h2 className="font-semibold text-foreground">Deductions</h2>
          <p className="text-xs text-muted-foreground">{enabledCount} of {items.length} claimed</p>
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
        <div className="col-span-1"></div>
        <div className="col-span-5">Deduction</div>
        <div className="col-span-2 text-right">Limit</div>
        <div className="col-span-2 text-right">Claimed</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1"></div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => {
          const isSelected = selectedId === item.id
          const utilization = item.limit > 0 ? (item.claimed / item.limit) * 100 : 0
          
          return (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-12 gap-2 px-4 py-3 border-b border-border transition-colors",
                isSelected 
                  ? "bg-primary/5 border-l-2 border-l-primary" 
                  : "hover:bg-muted/50",
                !item.enabled && "opacity-60"
              )}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(item.id)
                  }}
                  className={cn(
                    "w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors",
                    item.enabled 
                      ? "bg-primary border-primary" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {item.enabled && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
              </div>

              {/* Name & Section */}
              <button
                onClick={() => onSelect(item)}
                className="col-span-5 text-left min-w-0"
              >
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">Section {item.section}</p>
              </button>

              {/* Limit */}
              <div className="col-span-2 text-right self-center">
                <span className="text-sm font-mono text-muted-foreground">{item.limit.toLocaleString("en-IN")}</span>
              </div>

              {/* Claimed */}
              <button
                onClick={() => onSelect(item)}
                className="col-span-2 text-right self-center"
              >
                <span className="text-sm font-mono font-medium text-foreground">{item.claimed.toLocaleString("en-IN")}</span>
                {/* Mini progress bar */}
                <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      utilization >= 100 ? "bg-success" : utilization >= 50 ? "bg-primary" : "bg-warning"
                    )}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </button>

              {/* Proof Status */}
              <div className="col-span-1 flex items-center justify-center">
                {item.proofRequired ? (
                  item.proofSubmitted ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  )
                ) : (
                  <span className="text-[10px] text-muted-foreground">-</span>
                )}
              </div>

              {/* Arrow */}
              <button
                onClick={() => onSelect(item)}
                className="col-span-1 flex items-center justify-end"
              >
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isSelected && "text-primary"
                )} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer Totals */}
      <div className="px-4 py-3 border-t border-border bg-muted">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-1"></div>
          <div className="col-span-5 text-sm font-semibold text-foreground">Total Deductions</div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-mono text-muted-foreground">{totalLimit.toLocaleString("en-IN")}</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-sm font-mono font-semibold text-success">{totalClaimed.toLocaleString("en-IN")}</span>
          </div>
          <div className="col-span-2"></div>
        </div>
      </div>
    </div>
  )
}
