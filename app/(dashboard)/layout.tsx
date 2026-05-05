import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "@/components/layout/sidebar"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { prisma } = await import("@/lib/prisma")
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: { project: true },
    orderBy: { joinedAt: "desc" },
  })

  const projects = memberships
    .map((m) => m.project)
    .filter((p) => p.status === "ACTIVE")
    .map((p) => ({ id: p.id, name: p.name, color: p.color }))

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        projects={projects}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  )
}
