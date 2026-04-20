"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Github, Loader2, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn, PROJECT_COLORS } from "@/lib/utils"
import { deleteProject, updateProject } from "@/actions/projects"

type Props = {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    githubOwner: string | null
    githubRepo: string | null
    githubProjectNumber: number | null
  }
}

export function SettingsDialog({ project }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? "")
  const [color, setColor] = useState(project.color)
  const [githubOwner, setGithubOwner] = useState(project.githubOwner ?? "")
  const [githubRepo, setGithubRepo] = useState(project.githubRepo ?? "")
  const [githubProjectNumber, setGithubProjectNumber] = useState(
    project.githubProjectNumber?.toString() ?? ""
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setName(project.name)
      setDescription(project.description ?? "")
      setColor(project.color)
      setGithubOwner(project.githubOwner ?? "")
      setGithubRepo(project.githubRepo ?? "")
      setGithubProjectNumber(project.githubProjectNumber?.toString() ?? "")
      setConfirmDelete(false)
    }
  }, [open, project])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
          githubOwner: githubOwner.trim() || null,
          githubRepo: githubRepo.trim() || null,
          githubProjectNumber: githubProjectNumber
            ? Number(githubProjectNumber)
            : null,
        })
        toast.success("Prosjekt oppdatert")
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      try {
        await deleteProject(project.id)
        toast.success("Prosjekt slettet")
        setOpen(false)
        router.push("/dashboard")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Innstillinger"
      >
        <Settings className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prosjektinnstillinger</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Navn</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Beskrivelse</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label>Farge</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Github className="h-4 w-4" />
              GitHub-integrasjon
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-owner">Organisasjon / bruker</Label>
              <Input
                id="s-owner"
                value={githubOwner}
                onChange={(e) => setGithubOwner(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-repo">Repo-navn</Label>
              <Input
                id="s-repo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-num">GitHub Projects-nummer</Label>
              <Input
                id="s-num"
                type="number"
                value={githubProjectNumber}
                onChange={(e) => setGithubProjectNumber(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lagre
            </Button>
          </DialogFooter>
        </form>

        <Separator className="my-2" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/10">
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
            Faresone
          </h4>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            Sletting er permanent. Alle oppgaver forsvinner.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete ? "Klikk igjen for å bekrefte" : "Slett prosjekt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
