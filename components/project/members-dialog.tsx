"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Users, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"
import type { TihldeMember } from "@/lib/tihlde"
import { addProjectMember, removeProjectMember } from "@/actions/members"

export type ProjectMemberView = {
  userId: string
  role: "OWNER" | "MEMBER"
  user: {
    id: string
    name: string | null
    email: string | null
    username: string | null
    image: string | null
    tihldeUserId: string | null
  }
}

type Props = {
  projectId: string
  members: ProjectMemberView[]
  candidates: TihldeMember[]
  canEdit: boolean
}

export function MembersDialog({
  projectId,
  members,
  candidates,
  canEdit,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const assigned = useMemo(
    () => new Set(members.map((m) => m.user.tihldeUserId).filter(Boolean)),
    [members]
  )

  const available = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates
      .filter((c) => !assigned.has(c.tihldeUserId))
      .filter(
        (c) =>
          q.length === 0 ||
          (c.name ?? "").toLowerCase().includes(q) ||
          (c.username ?? "").toLowerCase().includes(q)
      )
  }, [candidates, assigned, query])

  function handleAdd(member: TihldeMember) {
    setPendingId(member.tihldeUserId)
    startTransition(async () => {
      try {
        await addProjectMember({
          projectId,
          tihldeUserId: member.tihldeUserId,
          role: "MEMBER",
        })
        toast.success(`${member.name ?? "Medlem"} lagt til`)
        setQuery("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleRemove(member: ProjectMemberView) {
    setPendingId(member.userId)
    startTransition(async () => {
      try {
        await removeProjectMember(projectId, member.userId)
        toast.success("Medlem fjernet")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="h-4 w-4" />
        Medlemmer
        <span className="text-muted-foreground">{members.length}</span>
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medlemmer</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ingen er satt på dette prosjektet ennå.
            </p>
          )}
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-md px-2 py-2"
            >
              <Avatar className="h-8 w-8">
                {member.user.image && (
                  <AvatarImage
                    src={member.user.image}
                    alt={member.user.name ?? ""}
                  />
                )}
                <AvatarFallback className="text-xs">
                  {getInitials(member.user.name, member.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {member.user.name ?? member.user.username ?? "Ukjent"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {member.role === "OWNER" ? "Eier" : "Medlem"}
                  {member.user.username && ` · ${member.user.username}`}
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Fjern ${member.user.name ?? "medlem"}`}
                  disabled={pendingId === member.userId}
                  onClick={() => handleRemove(member)}
                >
                  {pendingId === member.userId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <>
            <Separator />
            <div className="space-y-2">
              <Input
                placeholder="Søk i Index-medlemmer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto">
                {available.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Ingen treff
                  </p>
                ) : (
                  available.map((candidate) => (
                    <button
                      key={candidate.tihldeUserId}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary disabled:opacity-50"
                      disabled={pendingId === candidate.tihldeUserId}
                      onClick={() => handleAdd(candidate)}
                    >
                      <Avatar className="h-8 w-8">
                        {candidate.image && (
                          <AvatarImage
                            src={candidate.image}
                            alt={candidate.name ?? ""}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(candidate.name, candidate.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {candidate.name ?? candidate.username}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[candidate.studyProgram, candidate.classYear && `${candidate.classYear}. klasse`]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      {pendingId === candidate.tihldeUserId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
