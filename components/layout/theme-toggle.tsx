"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  // The class is set before paint by the script in the root layout.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch {}
    setDark(next)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Bytt til lys modus" : "Bytt til mørk modus"}
      title={dark ? "Lys modus" : "Mørk modus"}
      className="fixed right-4 top-4 z-30 bg-card shadow-sm"
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
