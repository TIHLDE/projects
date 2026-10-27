"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getTaskVersion } from "@/actions/tasks"

const POLL_MS = 5000

/**
 * Keeps a project page in sync with changes other people make. Polls a cheap
 * version of the project's tasks and refreshes the page when it no longer
 * matches the version the page was rendered with.
 */
export function LiveRefresh({
  projectId,
  version,
}: {
  projectId: string
  version: string
}) {
  const router = useRouter()

  useEffect(() => {
    let dragging = false

    async function check() {
      if (document.hidden) return
      const latest = await getTaskVersion(projectId).catch(() => null)
      if (latest === null || latest === version) return
      // Wait until the user is done moving or editing a card, so the board
      // does not shift under them.
      if (dragging || document.querySelector('[role="dialog"]')) return
      router.refresh()
    }

    const onDragStart = () => (dragging = true)
    const onDragEnd = () => (dragging = false)

    const timer = setInterval(check, POLL_MS)
    document.addEventListener("visibilitychange", check)
    window.addEventListener("dragstart", onDragStart)
    window.addEventListener("dragend", onDragEnd)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", check)
      window.removeEventListener("dragstart", onDragStart)
      window.removeEventListener("dragend", onDragEnd)
    }
  }, [projectId, version, router])

  return null
}
