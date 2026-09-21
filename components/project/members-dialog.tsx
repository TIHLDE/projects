"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Users, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"
import type { TihldeMember } from "@/lib/tihlde"
import { MemberCombobox } from "@/components/project/member-combobox"
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
  const [selected, setSelected] = useState<TihldeMember | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [adding, startAdding] = useTransition()
  const [, startRemoving] = useTransition()

  const assigned = useMemo(
    () => new Set(members.map((m) => m.user.tihldeUserId).filter(Boolean)),
    [members]
  )

  const results = useMemo(() => {
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

  function resetPicker() {
    setSelected(null)
    setQuery("")
  }

  function handleAdd() {
    if (!selected) return
    const member = selected
    startAdding(async () => {
      try {
        await addProjectMember({
          projectId,
          tihldeUserId: member.tihldeUserId,
        })
        toast.success(`${member.name ?? "Medlem"} lagt til`)
        resetPicker()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  function handleRemove(member: ProjectMemberView) {
    setRemovingId(member.userId)
    startRemoving(async () => {
      try {
        await removeProjectMember(projectId, member.userId)
        toast.success("Medlem fjernet")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      } finally {
        setRemovingId(null)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetPicker()
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Users className="h-4 w-4" />
        Medlemmer
        <span className="text-muted-foreground">{members.length}</span>
      </Button>
      <DialogContent className="max-w-md">
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
                <AvatarFallback>
                  {getInitials(member.user.name, member.user.username)}
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
                  disabled={removingId === member.userId}
                  onClick={() => handleRemove(member)}
                >
                  {removingId === member.userId ? (
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
              <Label>Legg til fra Index</Label>
              <MemberCombobox
                selected={selected}
                query={query}
                onQueryChange={setQuery}
                results={results}
                onSelect={setSelected}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!selected || adding}
                  onClick={handleAdd}
                >
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  {adding ? "Legger til …" : "Legg til medlem"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
