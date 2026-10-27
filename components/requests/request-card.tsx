"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addRequestToProject, deleteRequest } from "@/actions/requests"

type Props = {
  request: {
    id: string
    title: string
    body: string
    createdAt: Date
    author: string
  }
  canDelete: boolean
  /** Projects to add the request to. Empty for anyone outside Index. */
  projects: { id: string; name: string }[]
}

export function RequestCard({ request, canDelete, projects }: Props) {
  const router = useRouter()
  const [projectId, setProjectId] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<string | undefined>, success: string) {
    startTransition(async () => {
      try {
        const error = await action()
        if (error) {
          toast.error(error)
          return
        }
        toast.success(success)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">{request.title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {request.author} · {format(request.createdAt, "dd.MM.yyyy")}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm">{request.body}</p>

      {(projects.length > 0 || canDelete) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {projects.length > 0 && (
            <>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-8 w-56">
                  <SelectValue placeholder="Velg prosjekt" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!projectId || pending}
                onClick={() =>
                  run(
                    () => addRequestToProject(request.id, projectId),
                    "Lagt til i To Do"
                  )
                }
              >
                <Plus />
                Legg til i To Do
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant={confirmDelete ? "destructive" : "ghost"}
              className="ml-auto"
              disabled={pending}
              onBlur={() => setConfirmDelete(false)}
              onClick={() =>
                confirmDelete
                  ? run(() => deleteRequest(request.id), "Forespørsel slettet")
                  : setConfirmDelete(true)
              }
            >
              <Trash2 />
              {confirmDelete ? "Bekreft sletting" : "Slett"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
