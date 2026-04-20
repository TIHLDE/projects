"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, Github, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn, PROJECT_COLORS } from "@/lib/utils"
import { createProject } from "@/actions/projects"

export function CreateProjectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [githubOpen, setGithubOpen] = useState(false)
  const [githubOwner, setGithubOwner] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [githubProjectNumber, setGithubProjectNumber] = useState("")
  const [pending, startTransition] = useTransition()

  function reset() {
    setName("")
    setDescription("")
    setColor(PROJECT_COLORS[0])
    setGithubOpen(false)
    setGithubOwner("")
    setGithubRepo("")
    setGithubProjectNumber("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await createProject({
          name: name.trim(),
          description: description.trim() || null,
          color,
          githubOwner: githubOwner.trim() || null,
          githubRepo: githubRepo.trim() || null,
          githubProjectNumber: githubProjectNumber
            ? Number(githubProjectNumber)
            : null,
        })
        toast.success("Prosjekt opprettet")
        setOpen(false)
        reset()
        router.push(`/projects/${res.id}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Kunne ikke opprette")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nytt prosjekt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nytt prosjekt</DialogTitle>
          <DialogDescription>
            Opprett et nytt prosjekt for å organisere oppgavene dine.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
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
                  aria-label={`Velg farge ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <button
              type="button"
              onClick={() => setGithubOpen(!githubOpen)}
              className="flex w-full items-center justify-between text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub-integrasjon (valgfritt)
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  githubOpen && "rotate-180"
                )}
              />
            </button>
            {githubOpen && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="gh-owner">Organisasjon / bruker</Label>
                  <Input
                    id="gh-owner"
                    placeholder="f.eks. TIHLDE"
                    value={githubOwner}
                    onChange={(e) => setGithubOwner(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gh-repo">Repo-navn</Label>
                  <Input
                    id="gh-repo"
                    placeholder="f.eks. Lepton"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gh-proj">GitHub Projects-nummer</Label>
                  <Input
                    id="gh-proj"
                    type="number"
                    placeholder="f.eks. 4"
                    value={githubProjectNumber}
                    onChange={(e) => setGithubProjectNumber(e.target.value)}
                    disabled={pending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nummeret fra URL til ditt GitHub Project-board.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Opprett
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
