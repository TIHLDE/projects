"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Archive, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { archiveProject } from "@/actions/repos"

export function ProjectCardMenu({
  projectId,
  name,
}: {
  projectId: string
  name: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveProject(projectId)
        toast.success(`${name} er arkivert`, {
          description: "Du finner det igjen i repotreet.",
          action: {
            label: "Åpne repotre",
            onClick: () => router.push("/repoer"),
          },
        })
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Valg for ${name}`}
        disabled={pending}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleArchive}>
          <Archive className="h-4 w-4" />
          Arkiver
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
