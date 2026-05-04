"use client"

import { cn } from "@/lib/utils"
import { Lock, Check } from "lucide-react"

interface FormData {
  name: string
  pan: string
  dob: string
  gender: string
  email: string
  phone: string
  aadhaar: string
  flatBuilding: string
  roadStreet: string
  city: string
  state: string
  pincode: string
  area: string
  filingStatus: string
  employerCategory: string
  residentialStatus: string
}

interface FormEditorProps {
  data: FormData
  onChange: (field: keyof FormData, value: string) => void
}

export function FormEditor({ data, onChange }: FormEditorProps) {
  return (
    <div className="flex-1 min-h-screen lg:h-screen flex flex-col bg-background overflow-hidden">
      {/* Section Header */}
      <header className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">
          Personal Information
        </h1>
        <span className="text-xs px-2.5 py-1 bg-gold/15 text-gold rounded flex items-center gap-1.5">
          10/14 <span className="text-gold/70">⚠</span>
        </span>
      </header>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
        {/* Identity Card - Read Only */}
        <section className="bg-card border border-border rounded-md p-3 md:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
            <ReadOnlyField label="Name" value={data.name} />
            <ReadOnlyField label="PAN" value={`XXXXX${data.pan.slice(-5)}`} />
            <ReadOnlyField label="DOB" value={formatDate(data.dob)} />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1.5 text-xs text-success">
              <Check className="w-3.5 h-3.5" /> PAN Verified
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Gender</span>
              <select
                value={data.gender}
                onChange={(e) => onChange("gender", e.target.value)}
                className="h-7 px-2.5 py-0.5 text-xs bg-input border border-border rounded appearance-none text-foreground"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Source: From PAN verification
          </p>
        </section>

        {/* Contact Section */}
        <section>
          <SectionLabel>Contact</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <FormField
              label="Email"
              value={data.email}
              onChange={(v) => onChange("email", v)}
              type="email"
            />
            <FormField
              label="Phone"
              value={data.phone}
              onChange={(v) => onChange("phone", v)}
              type="tel"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
            <input
              type="text"
              value="............"
              readOnly
              className="flex-1 h-8 px-3 text-sm bg-input border border-border rounded text-muted-foreground tracking-widest"
              placeholder="Aadhaar"
            />
            <button className="h-8 px-4 text-xs text-gold border border-gold rounded hover:bg-gold/10 whitespace-nowrap">
              Verify via OTP
            </button>
          </div>
        </section>

        {/* Address Section */}
        <section>
          <SectionLabel>Address</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <FormField
              label="Flat/Building"
              value={data.flatBuilding}
              onChange={(v) => onChange("flatBuilding", v)}
            />
            <FormField
              label="Road/Street"
              value={data.roadStreet}
              onChange={(v) => onChange("roadStreet", v)}
            />
            <FormField
              label="City"
              value={data.city}
              onChange={(v) => onChange("city", v)}
            />
            <FormField
              label="State"
              value={data.state}
              onChange={(v) => onChange("state", v)}
              type="select"
              options={[
                { value: "", label: "Select" },
                { value: "MH", label: "Maharashtra" },
                { value: "DL", label: "Delhi" },
                { value: "KA", label: "Karnataka" },
                { value: "TN", label: "Tamil Nadu" },
                { value: "GJ", label: "Gujarat" },
                { value: "WB", label: "West Bengal" },
                { value: "RJ", label: "Rajasthan" },
              ]}
            />
            <FormField
              label="Pincode"
              value={data.pincode}
              onChange={(v) => onChange("pincode", v)}
            />
            <FormField
              label="Area"
              value={data.area}
              onChange={(v) => onChange("area", v)}
            />
          </div>
        </section>

        {/* Filing Metadata Section */}
        <section>
          <SectionLabel>Filing Metadata</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <FormField
              label="Filing Status"
              value={data.filingStatus}
              onChange={(v) => onChange("filingStatus", v)}
              type="select"
              options={[
                { value: "original", label: "Original" },
                { value: "revised", label: "Revised" },
                { value: "belated", label: "Belated" },
              ]}
            />
            <FormField
              label="Employer Category"
              value={data.employerCategory}
              onChange={(v) => onChange("employerCategory", v)}
              type="select"
              options={[
                { value: "private", label: "Private" },
                { value: "government", label: "Government" },
                { value: "psu", label: "PSU" },
                { value: "pensioner", label: "Pensioner" },
                { value: "na", label: "Not Applicable" },
              ]}
            />
            <FormField
              label="Residential Status"
              value={data.residentialStatus}
              onChange={(v) => onChange("residentialStatus", v)}
              type="select"
              options={[
                { value: "resident", label: "Resident" },
                { value: "nri", label: "Non-Resident" },
                { value: "rnor", label: "RNOR" },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
      {children}
    </h2>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label} <Lock className="w-3 h-3" />
      </label>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "tel" | "select"
  placeholder?: string
  options?: { value: string; label: string }[]
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options = [],
}: FormFieldProps) {
  const inputClasses = cn(
    "w-full h-9 px-3 text-sm bg-input border border-border rounded",
    "text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20"
  )

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClasses, "appearance-none")}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
