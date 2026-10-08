"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EyeOff, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { hideProject } from "@/actions/repos"

export function ProjectCardMenu({
  projectId,
  name,
}: {
  projectId: string
  name: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleHide() {
    startTransition(async () => {
      try {
        await hideProject(projectId)
        toast.success(`${name} er skjult`, {
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
        <DropdownMenuItem onClick={handleHide}>
          <EyeOff className="h-4 w-4" />
          Skjul
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
