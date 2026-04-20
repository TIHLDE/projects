import { notFound, redirect } from "next/navigation"
import { ExternalLink, Github } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/project/kanban-board"
import { ListView } from "@/components/project/list-view"
import { SettingsDialog } from "@/components/project/settings-dialog"
import { ViewToggle } from "@/components/project/view-toggle"

type PageProps = {
  params: { id: string }
  searchParams: { view?: string }
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      },
    },
  })
  if (!project) notFound()

  const membership = project.members.find((m) => m.userId === userId)
  if (!membership) redirect("/dashboard")

  const view: "board" | "list" = searchParams.view === "list" ? "list" : "board"
  const hasGithub = !!project.githubOwner && !!project.githubRepo
  const isOwner = membership.role === "OWNER"

  const total = project.tasks.length
  const done = project.tasks.filter((t) => t.status === "DONE").length
  const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS").length

  const tasks = project.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    tags: t.tags,
    dueDate: t.dueDate,
    githubIssueUrl: t.githubIssueUrl,
    assignee: t.assignee,
    assigneeId: t.assigneeId,
  }))

  const members = project.members.map((m) => ({
    userId: m.userId,
    user: m.user,
  }))

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="truncate text-2xl font-bold">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{done}</span> ferdig
            </span>
            <span>
              <span className="font-medium text-foreground">{inProgress}</span>{" "}
              pågår
            </span>
            <span>
              <span className="font-medium text-foreground">{total}</span> totalt
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} />
          {hasGithub && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://github.com/${project.githubOwner}/${project.githubRepo}`}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          {isOwner && (
            <SettingsDialog
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                color: project.color,
                githubOwner: project.githubOwner,
                githubRepo: project.githubRepo,
                githubProjectNumber: project.githubProjectNumber,
              }}
            />
          )}
        </div>
      </div>

      {view === "board" ? (
        <KanbanBoard
          projectId={project.id}
          tasks={tasks}
          members={members}
          hasGithub={hasGithub}
        />
      ) : (
        <ListView
          projectId={project.id}
          tasks={tasks}
          members={members}
          hasGithub={hasGithub}
        />
      )}
    </div>
  )
}
