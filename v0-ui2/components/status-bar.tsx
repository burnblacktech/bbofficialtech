"use client"

import { useEffect, useState } from "react"

export function StatusBar() {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-secondary border-t border-border px-3 py-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse"></span>
          CONNECTED
        </span>
        <span>PAN: ABCDE1234F</span>
        <span>AY 2025-26</span>
      </div>
      <div className="flex items-center gap-4">
        <span>ITR-2</span>
        <span>DRAFT</span>
        <span>{time}</span>
      </div>
    </div>
  )
}
