import { auth } from "@/auth"
import { isIndexMember } from "@/lib/tihlde"
import { RequestForm } from "@/components/requests/request-form"
import { RequestCard } from "@/components/requests/request-card"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function RequestsPage() {
  const session = await auth()
  const userId = session!.user.id

  const { prisma } = await import("@/lib/prisma")
  const [user, requests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.request.findMany({
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const isIndex = await isIndexMember(user?.tihldeUserId)
  const projects = isIndex
    ? await prisma.project.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : []

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 pr-14">
        <h1 className="text-3xl font-bold">Forespørsler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send inn forespørsel til Index. Sjekk gjerne listen under først, så
          slipper vi doble forslag.
        </p>
      </div>

      <RequestForm />

      <h2 className="mb-3 mt-10 text-lg font-semibold">
        Aktive forespørsler ({requests.length})
      </h2>
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen forespørsler ennå.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              request={{
                id: r.id,
                title: r.title,
                body: r.body,
                createdAt: r.createdAt,
                author: r.createdBy.name || r.createdBy.email || "Ukjent",
              }}
              canDelete={isIndex || r.createdById === userId}
              projects={projects}
            />
          ))}
        </div>
      )}
    </div>
  )
}
