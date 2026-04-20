"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, Github, Info, Loader2, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AVAILABLE_TAGS,
  cn,
  PRIORITY_LABELS,
  TAG_COLORS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/utils"
import { createTask, deleteTask, updateTask } from "@/actions/tasks"

type Member = {
  userId: string
  user: { id: string; name: string | null; email: string }
}

export type TaskDialogTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  tags: string[]
  dueDate: string | null
  assigneeId: string | null
  githubIssueUrl: string | null
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId: string
  members: Member[]
  hasGithub: boolean
  task?: TaskDialogTask | null
  defaultStatus?: string
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
  hasGithub,
  task,
  defaultStatus,
}: Props) {
  const router = useRouter()
  const isEdit = !!task

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<string>("BACKLOG")
  const [priority, setPriority] = useState<string>("MEDIUM")
  const [tags, setTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState<string>("")
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setPriority(task.priority)
      setTags(task.tags)
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "")
      setAssigneeId(task.assigneeId ?? "")
    } else {
      setTitle("")
      setDescription("")
      setStatus(defaultStatus || "BACKLOG")
      setPriority("MEDIUM")
      setTags([])
      setDueDate("")
      setAssigneeId("")
    }
    setConfirmDelete(false)
  }, [open, task, defaultStatus])

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          status: status as "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
          priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          tags,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        }
        if (isEdit && task) {
          await updateTask(task.id, payload)
          toast.success("Oppgave oppdatert")
        } else {
          await createTask(projectId, payload)
          toast.success("Oppgave opprettet")
        }
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  function handleDelete() {
    if (!task) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      try {
        await deleteTask(task.id)
        toast.success("Oppgave slettet")
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  const codeTagActive = tags.includes("code")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Rediger oppgave" : "Ny oppgave"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioritet</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Etiketter</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const active = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all",
                      active
                        ? TAG_COLORS[tag]
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            {codeTagActive && hasGithub && !isEdit && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Denne oppgaven vil automatisk opprette et GitHub-issue
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due">Frist</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label>Ansvarlig</Label>
              <Select
                value={assigneeId || "__none__"}
                onValueChange={(v) => setAssigneeId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ingen</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && task?.githubIssueUrl && (
            <a
              href={task.githubIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Github className="h-4 w-4" />
              Åpne GitHub-issue
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <DialogFooter className="justify-between gap-2 sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? "Bekreft sletting" : "Slett"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={pending || !title.trim()}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Lagre" : "Opprett"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
