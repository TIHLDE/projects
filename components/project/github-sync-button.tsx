"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { syncGithubIssues } from "@/actions/github-sync"

type Props = {
  projectId: string
}

export function GithubSyncButton({ projectId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

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
