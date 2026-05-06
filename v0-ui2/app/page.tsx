"use client"

import { useState, useCallback, useEffect } from "react"
import { ServicesSidebar } from "@/components/services-sidebar"
import { IncomeList } from "@/components/income-list"
import { DeductionsList } from "@/components/deductions-list"
import { DetailPanel, type IncomeItem, type DeductionItem, type DetailType } from "@/components/detail-panel"
import { TaxSummary } from "@/components/tax-summary"
import { FunctionBar } from "@/components/function-bar"
import { Menu, X, ChevronLeft, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

// Initial data
const initialIncomeItems: IncomeItem[] = [
  {
    id: "1",
    source: "TechCorp India Pvt Ltd",
    type: "salary",
    gross: 1850000,
    tds: 185000,
    section: "192",
    employer: "TechCorp India Pvt Ltd",
    tan: "DELT12345F",
    months: [
      { month: "Apr 2024", amount: 154167 },
      { month: "May 2024", amount: 154167 },
      { month: "Jun 2024", amount: 154167 },
      { month: "Jul 2024", amount: 154167 },
      { month: "Aug 2024", amount: 154167 },
      { month: "Sep 2024", amount: 154167 },
      { month: "Oct 2024", amount: 154167 },
      { month: "Nov 2024", amount: 154167 },
      { month: "Dec 2024", amount: 154167 },
      { month: "Jan 2025", amount: 154167 },
      { month: "Feb 2025", amount: 154167 },
      { month: "Mar 2025", amount: 154163 },
    ]
  },
  {
    id: "2",
    source: "Freelance Consulting",
    type: "business",
    gross: 480000,
    tds: 48000,
    section: "194J",
  },
  {
    id: "3",
    source: "State Bank of India - FD",
    type: "interest",
    gross: 125000,
    tds: 12500,
    section: "194A",
  },
  {
    id: "4",
    source: "Rental Income - Flat A-401",
    type: "rental",
    gross: 360000,
    tds: 0,
    section: "24",
  },
  {
    id: "5",
    source: "Equity Mutual Funds - LTCG",
    type: "capital",
    gross: 85000,
    tds: 0,
    section: "112A",
  },
]

const initialDeductionItems: DeductionItem[] = [
  {
    id: "1",
    name: "Section 80C Investments",
    section: "80C",
    limit: 150000,
    claimed: 150000,
    enabled: true,
    proofRequired: true,
    proofSubmitted: true,
    description: "Investments in PPF, ELSS, LIC, EPF, and other eligible instruments under Section 80C.",
    subItems: [
      { name: "PPF Contribution", amount: 50000 },
      { name: "ELSS Mutual Funds", amount: 50000 },
      { name: "LIC Premium", amount: 35000 },
      { name: "EPF (Employee)", amount: 15000 },
    ]
  },
  {
    id: "2",
    name: "Health Insurance Premium",
    section: "80D",
    limit: 75000,
    claimed: 52000,
    enabled: true,
    proofRequired: true,
    proofSubmitted: true,
    description: "Premium paid for health insurance for self, family, and parents.",
    subItems: [
      { name: "Self & Family", amount: 25000 },
      { name: "Parents (Senior)", amount: 27000 },
    ]
  },
  {
    id: "3",
    name: "Home Loan Interest",
    section: "24(b)",
    limit: 200000,
    claimed: 180000,
    enabled: true,
    proofRequired: true,
    proofSubmitted: false,
    description: "Interest paid on home loan for self-occupied property.",
  },
  {
    id: "4",
    name: "NPS Contribution",
    section: "80CCD(1B)",
    limit: 50000,
    claimed: 50000,
    enabled: true,
    proofRequired: true,
    proofSubmitted: true,
    description: "Additional deduction for contribution to National Pension System.",
  },
  {
    id: "5",
    name: "Education Loan Interest",
    section: "80E",
    limit: 0,
    claimed: 28000,
    enabled: true,
    proofRequired: true,
    proofSubmitted: true,
    description: "Interest paid on education loan for higher studies. No upper limit.",
  },
  {
    id: "6",
    name: "Donations to Charity",
    section: "80G",
    limit: 0,
    claimed: 0,
    enabled: false,
    proofRequired: true,
    proofSubmitted: false,
    description: "Donations to eligible charitable institutions.",
  },
]

export default function TaxFilingDashboard() {
  const [activeService, setActiveService] = useState("itr")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data state
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>(initialIncomeItems)
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>(initialDeductionItems)
  
  // Detail panel state
  const [detailType, setDetailType] = useState<DetailType>(null)
  const [selectedItem, setSelectedItem] = useState<IncomeItem | DeductionItem | null>(null)

  // Computed values
  const grossIncome = incomeItems.reduce((sum, item) => sum + item.gross, 0)
  const tdsDeducted = incomeItems.reduce((sum, item) => sum + item.tds, 0)
  const deductions = deductionItems.filter(d => d.enabled).reduce((sum, item) => sum + item.claimed, 0)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseDetail()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handlers
  const handleSelectIncome = useCallback((item: IncomeItem) => {
    setDetailType("income")
    setSelectedItem(item)
  }, [])

  const handleSelectDeduction = useCallback((item: DeductionItem) => {
    setDetailType("deduction")
    setSelectedItem(item)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailType(null)
    setSelectedItem(null)
  }, [])

  const handleSaveItem = useCallback((item: IncomeItem | DeductionItem) => {
    if (detailType === "income") {
      setIncomeItems(prev => prev.map(i => i.id === item.id ? item as IncomeItem : i))
    } else {
      setDeductionItems(prev => prev.map(d => d.id === item.id ? item as DeductionItem : d))
    }
  }, [detailType])

  const handleDeleteItem = useCallback((id: string) => {
    if (detailType === "income") {
      setIncomeItems(prev => prev.filter(i => i.id !== id))
    } else {
      setDeductionItems(prev => prev.filter(d => d.id !== id))
    }
    handleCloseDetail()
  }, [detailType, handleCloseDetail])

  const handleToggleDeduction = useCallback((id: string) => {
    setDeductionItems(prev => prev.map(d => 
      d.id === id ? { ...d, enabled: !d.enabled } : d
    ))
  }, [])

  const handleAddIncome = useCallback(() => {
    const newItem: IncomeItem = {
      id: `new-${Date.now()}`,
      source: "New Income Source",
      type: "other",
      gross: 0,
      tds: 0,
      section: "",
    }
    setIncomeItems(prev => [...prev, newItem])
    handleSelectIncome(newItem)
  }, [handleSelectIncome])

  const handleAddDeduction = useCallback(() => {
    const newItem: DeductionItem = {
      id: `new-${Date.now()}`,
      name: "New Deduction",
      section: "",
      limit: 0,
      claimed: 0,
      enabled: true,
      proofRequired: true,
      proofSubmitted: false,
    }
    setDeductionItems(prev => [...prev, newItem])
    handleSelectDeduction(newItem)
  }, [handleSelectDeduction])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-sm"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">FY 2024-25</span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            <span className="font-medium text-foreground">Income Tax Return</span>
            <span className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-sm">Draft</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-sm relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-sm">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Rajesh Kumar</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Services Sidebar */}
        <div className={cn(
          "lg:relative lg:block",
          mobileMenuOpen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none" : "hidden"
        )}>
          <div className={cn(
            "h-full",
            mobileMenuOpen && "w-52"
          )}>
            <ServicesSidebar
              activeService={activeService}
              onServiceChange={(service) => {
                setActiveService(service)
                setMobileMenuOpen(false)
              }}
              collapsed={sidebarCollapsed && !mobileMenuOpen}
            />
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 lg:hidden p-2 hover:bg-sidebar-accent rounded-sm text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="bg-muted border-b border-border px-4 flex items-center gap-1 overflow-x-auto">
            {["Summary", "Income", "Deductions", "Tax Paid", "Verification"].map((tab, idx) => (
              <button
                key={tab}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                  idx === 0
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Master View */}
            <div className={cn(
              "flex-1 overflow-auto p-4 transition-all",
              selectedItem && "lg:w-[calc(100%-24rem)]"
            )}>
              <div className="max-w-6xl mx-auto space-y-4">
                {/* Quick Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <SummaryCard
                    label="Gross Income"
                    value={grossIncome}
                    subtext={`${incomeItems.length} sources`}
                  />
                  <SummaryCard
                    label="Deductions"
                    value={deductions}
                    subtext={`${deductionItems.filter(d => d.enabled).length} claimed`}
                    variant="success"
                  />
                  <SummaryCard
                    label="TDS Paid"
                    value={tdsDeducted}
                    subtext="As per 26AS"
                    variant="muted"
                  />
                  <SummaryCard
                    label="Taxable Income"
                    value={Math.max(0, grossIncome - deductions)}
                    subtext="After deductions"
                    variant="primary"
                  />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {/* Income Section */}
                  <div className="xl:col-span-2">
                    <IncomeList
                      items={incomeItems}
                      selectedId={detailType === "income" ? selectedItem?.id ?? null : null}
                      onSelect={handleSelectIncome}
                      onAdd={handleAddIncome}
                    />
                  </div>

                  {/* Tax Summary */}
                  <div className="xl:col-span-1">
                    <TaxSummary
                      grossIncome={grossIncome}
                      deductions={deductions}
                      tdsDeducted={tdsDeducted}
                    />
                  </div>
                </div>

                {/* Deductions Section */}
                <DeductionsList
                  items={deductionItems}
                  selectedId={detailType === "deduction" ? selectedItem?.id ?? null : null}
                  onSelect={handleSelectDeduction}
                  onToggle={handleToggleDeduction}
                  onAdd={handleAddDeduction}
                />
              </div>
            </div>

            {/* Detail Panel */}
            {selectedItem && (
              <>
                {/* Mobile Overlay */}
                <div
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden z-40"
                  onClick={handleCloseDetail}
                />
                {/* Panel */}
                <div className="fixed right-0 top-0 bottom-0 z-50 lg:relative lg:z-auto">
                  <DetailPanel
                    type={detailType}
                    item={selectedItem}
                    onClose={handleCloseDetail}
                    onSave={handleSaveItem}
                    onDelete={handleDeleteItem}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Function Bar */}
      <FunctionBar />
    </div>
  )
}

function SummaryCard({ 
  label, 
  value, 
  subtext, 
  variant = "default" 
}: { 
  label: string
  value: number
  subtext: string
  variant?: "default" | "success" | "primary" | "muted"
}) {
  const variantStyles = {
    default: "text-foreground",
    success: "text-success",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }

  return (
    <div className="bg-card border border-border rounded-sm p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-xl font-mono font-semibold", variantStyles[variant])}>
        {value.toLocaleString("en-IN")}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
    </div>
  )
}
