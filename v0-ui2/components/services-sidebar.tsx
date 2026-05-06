"use client"

import { 
  Calculator, 
  FileText, 
  Receipt, 
  Wallet, 
  Building2, 
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ServicesSidebarProps {
  activeService: string
  onServiceChange: (service: string) => void
  collapsed?: boolean
}

const services = [
  { 
    id: "itr", 
    name: "Income Tax", 
    icon: Calculator, 
    badge: "FY 24-25",
    active: true 
  },
  { 
    id: "gst", 
    name: "GST Filing", 
    icon: Receipt, 
    badge: "Coming Soon",
    active: false 
  },
  { 
    id: "tds", 
    name: "TDS Returns", 
    icon: FileText, 
    badge: "Coming Soon",
    active: false 
  },
  { 
    id: "accounting", 
    name: "Bookkeeping", 
    icon: Building2, 
    badge: "Coming Soon",
    active: false 
  },
  { 
    id: "investments", 
    name: "Investments", 
    icon: TrendingUp, 
    badge: "Coming Soon",
    active: false 
  },
  { 
    id: "payroll", 
    name: "Payroll", 
    icon: Users, 
    badge: "Coming Soon",
    active: false 
  },
]

export function ServicesSidebar({ activeService, onServiceChange, collapsed }: ServicesSidebarProps) {
  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground flex flex-col h-full transition-all duration-200",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Logo */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-sm flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sm leading-tight">KarFile</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Tax Made Simple</p>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className={cn("px-3 mb-2", collapsed && "px-2")}>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 mb-2">Services</p>
          )}
        </div>
        <ul className="space-y-0.5 px-2">
          {services.map((service) => (
            <li key={service.id}>
              <button
                onClick={() => service.active && onServiceChange(service.id)}
                disabled={!service.active}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 text-sm transition-colors rounded-sm",
                  activeService === service.id 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80",
                  !service.active && "opacity-50 cursor-not-allowed"
                )}
                title={collapsed ? service.name : undefined}
              >
                <service.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{service.name}</span>
                    {service.badge && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-sm",
                        service.active 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                          : "bg-sidebar-border text-sidebar-foreground/60"
                      )}>
                        {service.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <button className={cn(
          "w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-sidebar-accent/50 rounded-sm text-sidebar-foreground/80",
        )}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className={cn(
          "w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-sidebar-accent/50 rounded-sm text-sidebar-foreground/80",
        )}>
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Help & Support</span>}
        </button>
      </div>
    </aside>
  )
}
