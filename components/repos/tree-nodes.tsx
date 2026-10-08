"use client"

import { memo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { formatDistanceToNowStrict } from "date-fns"
import { nb } from "date-fns/locale"
import {
  Archive,
  ArrowRight,
  ChevronDown,
  CircleDashed,
  Loader2,
  Lock,
  MoveRight,
  Sparkles,
  Star,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MOVE_LABEL,
  movedMessage,
  moveTargets,
  moveTreeRepo,
} from "@/components/repos/move-repo"
import type { RepoState, TreeRepo } from "@/lib/repo-tree"
import {
  HANDLE,
  type RepoNodeData,
  type RootNodeData,
  type SectionNodeData,
} from "@/lib/repo-tree-layout"

const HIDDEN_HANDLE = { visibility: "hidden", pointerEvents: "none" } as const

function Handles({ sides }: { sides: (keyof typeof HANDLE)[] }) {
  const position = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
  } as const
  return (
    <>
      {sides.map((side) => (
        <Handle
          key={side}
          id={HANDLE[side]}
          type={side === "bottom" ? "source" : "target"}
          position={position[side]}
          style={HIDDEN_HANDLE}
          isConnectable={false}
        />
      ))}
    </>
  )
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Vue: "#41b883",
  HCL: "#844fba",
  Typst: "#239dad",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  Dart: "#00b4ab",
  "C#": "#178600",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
}

export function languageColor(language: string | null) {
  return (language && LANGUAGE_COLORS[language]) || "var(--muted-foreground)"
}

export const SECTION_STYLE: Record<
  RepoState,
  { icon: typeof Sparkles; className: string; minimap: string }
> = {
  front: {
    icon: Sparkles,
    className: "bg-primary text-primary-foreground shadow-md shadow-primary/25",
    minimap: "var(--primary)",
  },

  listed: {
    icon: CircleDashed,
    className:
      "border border-dashed border-muted-foreground/40 bg-card text-muted-foreground",
    minimap: "hsl(215 16% 80%)",
  },
  archived: {
    icon: Archive,
    className: "bg-muted text-muted-foreground",
    minimap: "hsl(215 16% 88%)",
  },
}

export const RootNode = memo(function RootNode({ data }: NodeProps) {
  const { total, onFront } = data as RootNodeData
  return (
    <>
      <Handles sides={["bottom"]} />
      <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-card px-5 shadow-lg shadow-primary/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://github.com/TIHLDE.png?size=96"
          alt=""
          className="h-12 w-12 rounded-xl ring-1 ring-border"
        />
        <div className="min-w-0">
          <div className="text-lg font-bold tracking-tight">TIHLDE</div>
          <div className="text-xs text-muted-foreground">
            {total} repoer · {onFront} på forsiden
          </div>
        </div>
      </div>
    </>
  )
})

export const SectionNode = memo(function SectionNode({ data }: NodeProps) {
  const { state, label, count, open, muted } = data as SectionNodeData
  const style = SECTION_STYLE[state]
  const Icon = style.icon
  return (
    <>
      <Handles sides={["top", "bottom"]} />
      <button
        type="button"
        aria-expanded={state === "front" ? undefined : open}
        aria-label={
          state === "front"
            ? "Gå til oversikten"
            : `${open ? "Lukk" : "Åpne"} ${label}`
        }
        className={cn(
          "flex h-full w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md",
          style.className,
          muted && "opacity-50 hover:opacity-100"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs tabular-nums">
          {count}
        </span>
        {state === "front" ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
        )}
      </button>
    </>
  )
})

export const JunctionNode = memo(function JunctionNode() {
  return (
    <>
      <Handles sides={["top", "bottom"]} />
      <div className="h-0.5 w-0.5" />
    </>
  )
})

export const RepoNode = memo(function RepoNode({ data }: NodeProps) {
  const { repo, selected, dimmed, muted } = data as RepoNodeData
  const members = repo.project?.members ?? []
  const accent = repo.project?.color ?? languageColor(repo.language)
  const front = repo.state === "front"
  const archived = repo.state === "archived"

  return (
    <>
      <Handles sides={["left"]} />
      <div
        className={cn(
          "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card pl-4 pr-3 py-2.5 shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
          front ? "border-primary/30" : "border-border",
          archived && "opacity-60 grayscale",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          dimmed ? "opacity-20" : muted && "opacity-40 hover:opacity-100"
        )}
      >
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: accent }}
        />

        <CardActions repo={repo} />

        <div className="flex items-center gap-1.5">
          {repo.isPrivate && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          )}
          <span className="truncate text-sm font-semibold">{repo.name}</span>
          {repo.stars !== null && repo.stars > 0 && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              {repo.stars}
            </span>
          )}
        </div>

        <p
          className={cn(
            "mt-1 line-clamp-2 text-xs leading-snug",
            repo.isPrivate
              ? "italic text-muted-foreground/70"
              : "text-muted-foreground"
          )}
        >
          {repo.isPrivate
            ? "Privat repo"
            : repo.description || "Ingen beskrivelse"}
        </p>

        <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: languageColor(repo.language) }}
              />
              {repo.language}
            </span>
          )}
          {repo.pushedAt && (
            <span className="truncate">
              {formatDistanceToNowStrict(new Date(repo.pushedAt), {
                locale: nb,
                addSuffix: true,
              })}
            </span>
          )}
          <div className="ml-auto">
            {members.length > 0 ? (
              <AvatarGroup className="-space-x-1">
                {members.slice(0, 3).map((m) => (
                  <Avatar
                    key={m.userId}
                    className="h-6 w-6"
                    title={m.name ?? undefined}
                  >
                    {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                    <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                      {getInitials(m.name, m.username)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 3 && (
                  <AvatarGroupCount>
                    +{members.length - 3}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            ) : (
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                + Sett på folk
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
})

const ACTION_CLASS =
  "nodrag nopan flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground"

/**
 * Moves a repo straight from its card, shown on hover over the star count.
 * Repos on the front page and in the list get Arkiver; archived ones get a
 * menu of where they can go back to. Clicks stop here so the panel does
 * not open — React bubbles events out of the menu's portal too.
 */
function CardActions({ repo }: { repo: TreeRepo }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function move(to: RepoState) {
    startTransition(async () => {
      try {
        await moveTreeRepo(repo, to)
        toast.success(movedMessage(repo, to))
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Noe gikk galt")
      }
    })
  }

  const asMenu = repo.state === "archived"

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-2 top-2 z-10 transition-opacity",
        pending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}
    >
      {asMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={pending}
            aria-label={`Flytt ${repo.name}`}
            className={ACTION_CLASS}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MoveRight className="h-3 w-3" />
            )}
            Flytt
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            {moveTargets(repo).map((to) => (
              <DropdownMenuItem key={to} onSelect={() => move(to)}>
                {MOVE_LABEL[to]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          aria-label={`Arkiver ${repo.name}`}
          disabled={pending}
          onClick={() => move("archived")}
          className={ACTION_CLASS}
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Archive className="h-3 w-3" />
          )}
          Arkiver
        </button>
      )}
    </div>
  )
}
