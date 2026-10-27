"use client"

import { useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { syncGithubIssues } from "@/actions/github-sync"

const AUTO_SYNC_MS = 2 * 60 * 1000

type Props = {
  projectId: string
}

export function GithubSyncButton({ projectId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Sync quietly when the page opens, when you come back to it, and every few
  // minutes while it is visible, so nobody has to press the button.
  useEffect(() => {
    async function autoSync() {
      if (document.hidden) return
      const res = await syncGithubIssues(projectId).catch(() => null)
      if (res && res.imported + res.updated > 0) router.refresh()
    }

    autoSync()
    const timer = setInterval(autoSync, AUTO_SYNC_MS)
    document.addEventListener("visibilitychange", autoSync)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", autoSync)
    }
  }, [projectId, router])

  function handleSync() {
    startTransition(async () => {
      try {
        const res = await syncGithubIssues(projectId)
        toast.success(
          `Synkronisert: ${res.imported} nye, ${res.updated} oppdatert (${res.total} issues)`
        )
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Synkronisering feilet")
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={pending}
      aria-label="Synkroniser issues fra GitHub"
    >
      <RefreshCw
        className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
      />
      Synkroniser
    </Button>
  )
}
