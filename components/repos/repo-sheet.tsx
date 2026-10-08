"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNowStrict } from "date-fns"
import { nb } from "date-fns/locale"
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  FolderKanban,
  Github,
  Loader2,
  Lock,
  Star,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn, getInitials } from "@/lib/utils"
import type { RepoState, TreeRepo } from "@/lib/repo-tree"
import type { TihldeMember } from "@/lib/tihlde"
import { MemberCombobox } from "@/components/project/member-combobox"
import { languageColor, SECTION_STYLE } from "@/components/repos/tree-nodes"
import {
  assignToProject,
  assignToRepo,
  hideProject,
  showProject,
} from "@/actions/repos"
import { removeProjectMember } from "@/actions/members"

const STATE_LABEL: Record<RepoState, string> = {
  front: "På forsiden",
  hidden: "Skjult",
  unregistered: "Ikke i bruk",
  githubArchived: "Arkivert på GitHub",
}

type Props = {
  repo: TreeRepo | null
  candidates: TihldeMember[]
  viewerId: string
  onClose: () => void
}

export function RepoSheet({ repo, candidates, viewerId, onClose }: Props) {
  return (
    <Sheet open={!!repo} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {repo && (
          <RepoSheetBody
            key={repo.key}
            repo={repo}
            candidates={candidates}
            viewerId={viewerId}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RepoSheetBody({
  repo,
  candidates,
  viewerId,
}: {
  repo: TreeRepo
  candidates: TihldeMember[]
  viewerId: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<TihldeMember | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const project = repo.project
  const members = project?.members ?? []
  const isMember = members.some((m) => m.userId === viewerId)
  // Mirrors `requireCanChange` in actions/repos.ts.
  const canChange =
    !project || repo.state !== "front" || isMember || members.length === 0
  const StateIcon = SECTION_STYLE[repo.state].icon

  const assigned = useMemo(
    () => new Set(members.map((m) => m.tihldeUserId).filter(Boolean)),
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

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  function handleAssign() {
    if (!selected) return
    const member = selected
    run(
      () =>
        repo.repoName
          ? assignToRepo({
              repoName: repo.repoName,
              tihldeUserId: member.tihldeUserId,
            })
          : assignToProject({
              projectId: project!.id,
              tihldeUserId: member.tihldeUserId,
            }),
      repo.state === "front"
        ? `${member.name ?? "Medlem"} lagt til`
        : `${member.name ?? "Medlem"} lagt til · ${repo.name} er nå på forsiden`
    )
    setSelected(null)
    setQuery("")
  }

  function handleRemove(userId: string) {
    if (!project) return
    setRemovingId(userId)
    startTransition(async () => {
      try {
        await removeProjectMember(project.id, userId)
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
    <div className="flex h-full flex-col overflow-y-auto">
      <div
        className="h-1.5 w-full shrink-0"
        style={{
          backgroundColor: project?.color ?? languageColor(repo.language),
        }}
      />
      <div className="flex flex-col gap-3 p-6 pb-4">
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              SECTION_STYLE[repo.state].className
            )}
          >
            <StateIcon className="h-3 w-3" />
            {STATE_LABEL[repo.state]}
          </span>
          {repo.isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3" />
              Privat
            </span>
          )}
        </div>
        <SheetTitle className="text-2xl font-bold tracking-tight">
          {repo.name}
        </SheetTitle>
        <SheetDescription
          className={cn(repo.isPrivate && "italic")}
        >
          {repo.isPrivate
            ? "Privat repo – bare navnet vises her."
            : repo.description || "Ingen beskrivelse"}
        </SheetDescription>

        {!repo.isPrivate && (repo.language || repo.pushedAt) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: languageColor(repo.language) }}
                />
                {repo.language}
              </span>
            )}
            {repo.stars !== null && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                {repo.stars}
              </span>
            )}
            {repo.pushedAt && (
              <span>
                Sist pushet{" "}
                {formatDistanceToNowStrict(new Date(repo.pushedAt), {
                  locale: nb,
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {repo.htmlUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            </Button>
          )}
          {project && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}`}>
                <FolderKanban className="h-4 w-4" />
                Åpne prosjekt
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folk på prosjektet
        </h3>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen er satt på dette ennå.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary"
              >
                <Avatar className="h-8 w-8">
                  {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                  <AvatarFallback>{getInitials(m.name, m.username)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {m.name ?? m.username ?? "Ukjent"}
                  </div>
                  {m.username && (
                    <div className="truncate text-xs text-muted-foreground">
                      {m.username}
                    </div>
                  )}
                </div>
                {isMember && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Fjern ${m.name ?? "medlem"}`}
                    disabled={removingId === m.userId}
                    onClick={() => handleRemove(m.userId)}
                  >
                    {removingId === m.userId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {canChange ? (
          <div className="mt-4 space-y-2 rounded-xl border border-border bg-background/60 p-4">
            <Label>Sett noen fra Index på</Label>
            <MemberCombobox
              selected={selected}
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={setSelected}
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {repo.state === "front"
                  ? "Legges til på prosjektet."
                  : "Prosjektet kommer på forsiden."}
              </p>
              <Button
                size="sm"
                disabled={!selected || pending}
                onClick={handleAssign}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Sett på
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            Bare de som er på prosjektet kan endre det.
          </p>
        )}
      </div>

      {project && canChange && (
        <div className="mt-auto border-t border-border p-6">
          {repo.state === "front" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() =>
                run(
                  () => hideProject(project.id),
                  `${repo.name} er skjult fra forsiden`
                )
              }
            >
              <EyeOff className="h-4 w-4" />
              Skjul
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={pending}
              onClick={() =>
                run(
                  () => showProject(project.id),
                  `${repo.name} er tilbake på forsiden`
                )
              }
            >
              <Eye className="h-4 w-4" />
              Vis på forsiden
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
