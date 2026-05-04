"use client"

import { useState, useCallback } from "react"
import { TaxFormSidebar } from "@/components/tax-form/sidebar"
import { FormEditor } from "@/components/tax-form/form-editor"
import { Menu } from "lucide-react"

const sections = [
  { id: "personal", label: "Personal Info", status: "complete" as const },
  { id: "salary", label: "Salary", status: "complete" as const, amount: "₹12,00,000" },
  { id: "other-income", label: "Other Income", status: "pending" as const, amount: "₹50,000" },
  { id: "capital-gains", label: "Capital Gains", status: "pending" as const },
  { id: "deductions", label: "Deductions", status: "pending" as const, amount: "-₹2,50,000" },
  { id: "bank", label: "Bank & Submit", status: "pending" as const },
]

const initialSummary = {
  grossIncome: 1450000,
  deductions: 250000,
  taxable: 1200000,
  tax: 117000,
  tds: 100000,
  refund: 17000,
}

const initialFormData = {
  name: "Vivek Rungta",
  pan: "ABCPR4243N",
  dob: "1985-10-05",
  gender: "M",
  email: "rungta.vivek@gmail.com",
  phone: "9311011515",
  aadhaar: "",
  flatBuilding: "",
  roadStreet: "",
  city: "",
  state: "",
  pincode: "",
  area: "",
  filingStatus: "original",
  employerCategory: "private",
  residentialStatus: "resident",
}

export default function TaxFilingPage() {
  const [activeSection, setActiveSection] = useState("personal")
  const [formData, setFormData] = useState(initialFormData)
  const [summary] = useState(initialSummary)
  const [regime, setRegime] = useState<"old" | "new">("new")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  return (
    <div className="flex min-h-screen lg:h-screen w-full overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:hidden z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-bold text-gold">BurnBlack</span>
        <span className="text-xs px-2 py-1 bg-gold/15 text-gold rounded">10/14</span>
      </div>

      {/* Sidebar */}
      <TaxFormSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        summary={summary}
        regime={regime}
        onRegimeChange={setRegime}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content - offset on mobile for fixed header */}
      <div className="flex-1 pt-14 lg:pt-0">
        <FormEditor data={formData} onChange={handleFieldChange} />
      </div>
    </div>
  )
}
