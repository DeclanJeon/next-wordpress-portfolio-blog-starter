"use client"

import * as React from "react"

interface LiveClockProps {
  timeZone: string
  className?: string
}

export function LiveClock({ timeZone, className }: LiveClockProps) {
  const [now, setNow] = React.useState<Date | null>(null)

  React.useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--"

  return <span className={className}>{time}</span>
}
