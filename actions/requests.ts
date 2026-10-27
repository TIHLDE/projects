"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isIndexMember } from "@/lib/tihlde"

// These actions return a message instead of throwing it, because Next.js
// hides the message of a thrown error in production builds.

const requestSchema = z.object({
  title: z.string().trim().min(1, "Tittel er påkrevd"),
  body: z.string().trim().min(1, "Beskrivelse er påkrevd"),
})

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function createRequest(
  input: z.infer<typeof requestSchema>
): Promise<string | undefined> {
  const user = await requireUser()
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return parsed.error.issues[0].message

  await prisma.request.create({
    data: { ...parsed.data, createdById: user.id },
  })
  revalidatePath("/foresporsler")
}

/** Index can delete any request; everyone else only their own. */
export async function deleteRequest(
  requestId: string
): Promise<string | undefined> {
  const user = await requireUser()
  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) return "Forespørselen finnes ikke"
  if (
    request.createdById !== user.id &&
    !(await isIndexMember(user.tihldeUserId))
  ) {
    return "Bare Index kan slette andres forespørsler"
  }

  await prisma.request.delete({ where: { id: requestId } })
  revalidatePath("/foresporsler")
}

/** Turns a request into a To Do task in a project, then removes the request. */
export async function addRequestToProject(
  requestId: string,
  projectId: string
): Promise<string | undefined> {
  const user = await requireUser()
  if (!(await isIndexMember(user.tihldeUserId))) {
    return "Bare Index kan legge forespørsler til i et prosjekt"
  }
  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) return "Forespørselen finnes ikke"
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return "Prosjektet finnes ikke"

  await prisma.$transaction([
    prisma.task.create({
      data: {
        title: request.title,
        description: request.body,
        status: "TODO",
        projectId,
        // Credit the person who asked for it.
        createdById: request.createdById,
      },
    }),
    prisma.request.delete({ where: { id: requestId } }),
  ])

  revalidatePath("/foresporsler")
  revalidatePath(`/projects/${projectId}`)
}
