"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

export function ViewToggle({ view }: { view: "board" | "list" }) {
  const pathname = usePathname()
  const search = useSearchParams()

  function href(v: "board" | "list") {
    const params = new URLSearchParams(search.toString())
    params.set("view", v)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border">
      <Link
        href={href("board")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
          view === "board"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </Link>
      <Link
        href={href("list")}
        className={cn(
          "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors",
          view === "list"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary"
        )}
      >
        <List className="h-3.5 w-3.5" />
        Liste
      </Link>
    </div>
  )
}
