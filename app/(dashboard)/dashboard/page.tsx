import { FolderKanban } from "lucide-react"
import { auth } from "@/auth"
import { ProjectCard } from "@/components/dashboard/project-card"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const { prisma } = await import("@/lib/prisma")
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          tasks: { select: { id: true, status: true } },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const projects = memberships
    .map((m) => m.project)
    .filter((p) => p.status === "ACTIVE")

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prosjekter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Oversikt over alle dine prosjekter
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Ingen prosjekter ennå</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Opprett ditt første prosjekt for å komme i gang med å organisere
            oppgaver.
          </p>
          <div className="mt-6">
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              color={p.color}
              description={p.description}
              totalTasks={p.tasks.length}
              doneTasks={p.tasks.filter((t) => t.status === "DONE").length}
              members={p.members}
              githubOwner={p.githubOwner}
              githubRepo={p.githubRepo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
