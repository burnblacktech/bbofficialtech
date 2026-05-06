"use client"

import { cn } from "@/lib/utils"

interface FunctionBarProps {
  className?: string
}

const functions = [
  { key: "F1", label: "Help" },
  { key: "F2", label: "Save" },
  { key: "F3", label: "Company" },
  { key: "F4", label: "Search" },
  { key: "F5", label: "Refresh" },
  { key: "F6", label: "Reports" },
  { key: "F7", label: "Print" },
  { key: "F8", label: "Export" },
  { key: "F9", label: "E-File" },
  { key: "F10", label: "Exit" },
]

export function FunctionBar({ className }: FunctionBarProps) {
  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto",
      className
    )}>
      {functions.map((fn) => (
        <button
          key={fn.key}
          className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-sidebar-accent rounded-sm transition-colors whitespace-nowrap"
        >
          <span className="font-mono text-sidebar-primary font-semibold">{fn.key}</span>
          <span className="text-sidebar-foreground/80">{fn.label}</span>
        </button>
      ))}
    </div>
  )
}
