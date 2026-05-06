"use client"

import { X, Save, Trash2, Plus, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

export type DetailType = "income" | "deduction" | null
export type IncomeItem = {
  id: string
  source: string
  type: string
  gross: number
  tds: number
  section: string
  months?: { month: string; amount: number }[]
  employer?: string
  tan?: string
}

export type DeductionItem = {
  id: string
  name: string
  section: string
  limit: number
  claimed: number
  enabled: boolean
  proofRequired: boolean
  proofSubmitted: boolean
  description?: string
  subItems?: { name: string; amount: number }[]
}

interface DetailPanelProps {
  type: DetailType
  item: IncomeItem | DeductionItem | null
  onClose: () => void
  onSave: (item: IncomeItem | DeductionItem) => void
  onDelete: (id: string) => void
}

export function DetailPanel({ type, item, onClose, onSave, onDelete }: DetailPanelProps) {
  const [editedItem, setEditedItem] = useState<IncomeItem | DeductionItem | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setEditedItem(item ? { ...item } : null)
    setHasChanges(false)
  }, [item])

  if (!type || !item || !editedItem) return null

  const handleChange = (field: string, value: string | number | boolean) => {
    setEditedItem((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem)
      setHasChanges(false)
    }
  }

  const isIncome = type === "income"
  const incomeItem = editedItem as IncomeItem
  const deductionItem = editedItem as DeductionItem

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {isIncome ? "Income Source" : "Deduction"} Details
          </p>
          <h3 className="font-semibold text-foreground truncate max-w-[200px]">
            {isIncome ? incomeItem.source : deductionItem.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-sm transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isIncome ? (
          <>
            {/* Income Details Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Source Name</label>
                <Input
                  value={incomeItem.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Income Type</label>
                <select 
                  value={incomeItem.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-border bg-input rounded-sm focus:ring-2 focus:ring-ring"
                >
                  <option value="salary">Salary</option>
                  <option value="business">Business Income</option>
                  <option value="interest">Interest Income</option>
                  <option value="rental">Rental Income</option>
                  <option value="capital">Capital Gains</option>
                  <option value="other">Other Sources</option>
                </select>
              </div>

              {incomeItem.employer && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Employer / Payer</label>
                  <Input
                    value={incomeItem.employer}
                    onChange={(e) => handleChange("employer", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {incomeItem.tan && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">TAN Number</label>
                  <Input
                    value={incomeItem.tan}
                    onChange={(e) => handleChange("tan", e.target.value)}
                    className="h-9 text-sm font-mono"
                    placeholder="AAAA00000A"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gross Amount</label>
                  <Input
                    type="number"
                    value={incomeItem.gross}
                    onChange={(e) => handleChange("gross", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">TDS Deducted</label>
                  <Input
                    type="number"
                    value={incomeItem.tds}
                    onChange={(e) => handleChange("tds", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">IT Section</label>
                <Input
                  value={incomeItem.section}
                  onChange={(e) => handleChange("section", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g., 192, 194A"
                />
              </div>
            </div>

            {/* Monthly Breakdown */}
            {incomeItem.months && incomeItem.months.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-2">Monthly Breakdown</p>
                <div className="bg-muted rounded-sm overflow-hidden">
                  <div className="grid grid-cols-2 text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 border-b border-border">
                    <span>Month</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {incomeItem.months.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-2 px-3 py-1.5 text-sm border-b border-border last:border-0">
                        <span className="text-muted-foreground">{m.month}</span>
                        <span className="text-right font-mono">{m.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Computed Values */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Income</span>
                <span className="font-mono font-medium">{(incomeItem.gross - incomeItem.tds).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effective TDS Rate</span>
                <span className="font-mono">{incomeItem.gross > 0 ? ((incomeItem.tds / incomeItem.gross) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Deduction Details Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Deduction Name</label>
                <Input
                  value={deductionItem.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Section</label>
                <Input
                  value={deductionItem.section}
                  onChange={(e) => handleChange("section", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g., 80C, 80D"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Maximum Limit</label>
                  <Input
                    type="number"
                    value={deductionItem.limit}
                    onChange={(e) => handleChange("limit", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Claimed Amount</label>
                  <Input
                    type="number"
                    value={deductionItem.claimed}
                    onChange={(e) => handleChange("claimed", parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm font-mono"
                    max={deductionItem.limit}
                  />
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">Include in filing</span>
                <button
                  onClick={() => handleChange("enabled", !deductionItem.enabled)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    deductionItem.enabled ? "bg-success" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    deductionItem.enabled ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Proof Status */}
              <div className="flex items-center gap-2 py-2 border-t border-border">
                {deductionItem.proofRequired ? (
                  deductionItem.proofSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">Proof submitted</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-accent" />
                      <span className="text-sm text-foreground">Proof required</span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No proof needed</span>
                  </>
                )}
              </div>
            </div>

            {/* Sub-items */}
            {deductionItem.subItems && deductionItem.subItems.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-foreground">Components</p>
                  <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-1">
                  {deductionItem.subItems.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-muted rounded-sm">
                      <span className="text-sm text-muted-foreground">{sub.name}</span>
                      <span className="text-sm font-mono">{sub.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {deductionItem.description && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-2">About this deduction</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{deductionItem.description}</p>
              </div>
            )}

            {/* Utilization */}
            <div className="bg-primary/5 border border-primary/20 rounded-sm p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Utilized</span>
                <span className="font-mono">{deductionItem.limit > 0 ? ((deductionItem.claimed / deductionItem.limit) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min((deductionItem.claimed / deductionItem.limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {(deductionItem.limit - deductionItem.claimed).toLocaleString("en-IN")} remaining
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border bg-muted flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="h-8"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-8"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges}
          className="h-8"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save
        </Button>
      </div>
    </div>
  )
}
