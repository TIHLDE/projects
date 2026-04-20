import { ArrowDown, ArrowRight, ArrowUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const CONFIG: Record<string, { icon: typeof ArrowDown; className: string; label: string }> = {
  LOW: { icon: ArrowDown, className: "text-blue-500", label: "Lav" },
  MEDIUM: { icon: ArrowRight, className: "text-gray-500", label: "Middels" },
  HIGH: { icon: ArrowUp, className: "text-orange-500", label: "Høy" },
  URGENT: { icon: AlertCircle, className: "text-red-500", label: "Haster" },
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: string
  className?: string
}) {
  const cfg = CONFIG[priority] ?? CONFIG.MEDIUM
  const Icon = cfg.icon
  return (
    <Icon
      className={cn("h-4 w-4", cfg.className, className)}
      aria-label={cfg.label}
    />
  )
}
