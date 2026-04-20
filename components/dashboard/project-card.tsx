import Link from "next/link"
import { CheckCircle2, Github, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

type CardMember = {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

type Props = {
  id: string
  name: string
  color: string
  description: string | null
  totalTasks: number
  doneTasks: number
  members: CardMember[]
  githubOwner: string | null
  githubRepo: string | null
}

export function ProjectCard({
  id,
  name,
  color,
  description,
  totalTasks,
  doneTasks,
  members,
  githubOwner,
  githubRepo,
}: Props) {
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const hasGithub = !!githubOwner && !!githubRepo

  return (
    <Link href={`/projects/${id}`} className="block">
      <Card className="h-full p-5 transition-colors hover:border-primary/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="truncate text-base font-semibold">{name}</h3>
          </div>
          {hasGithub && (
            <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground min-h-[2.5rem]">
          {description || "Ingen beskrivelse"}
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Fremdrift</span>
            <span>
              {doneTasks}/{totalTasks} oppgaver
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full transition-all")}
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {totalTasks}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {members.length}
            </span>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <Avatar
                key={m.user.id}
                className="h-6 w-6 border-2 border-card"
              >
                {m.user.image && (
                  <AvatarImage src={m.user.image} alt={m.user.name || ""} />
                )}
                <AvatarFallback className="text-[10px]">
                  {getInitials(m.user.name, m.user.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
