"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const projectSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  description: z.string().optional().nullable(),
  color: z.string().default("#4f8ef7"),
  githubOwner: z.string().optional().nullable(),
  githubRepo: z.string().optional().nullable(),
  githubProjectNumber: z.coerce.number().int().optional().nullable(),
})

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

export async function createProject(input: z.infer<typeof projectSchema>) {
  const userId = await requireUserId()
  const data = projectSchema.parse(input)

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      color: data.color,
      githubOwner: data.githubOwner || null,
      githubRepo: data.githubRepo || null,
      githubProjectNumber: data.githubProjectNumber ?? null,
      createdById: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  })

  revalidatePath("/dashboard")
  return { id: project.id }
}

export async function updateProject(
  projectId: string,
  input: z.infer<typeof projectSchema>
) {
  const userId = await requireUserId()
  const data = projectSchema.parse(input)

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new Error("Ikke medlem av prosjektet")

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name,
      description: data.description ?? null,
      color: data.color,
      githubOwner: data.githubOwner || null,
      githubRepo: data.githubRepo || null,
      githubProjectNumber: data.githubProjectNumber ?? null,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteProject(projectId: string) {
  const userId = await requireUserId()
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member || member.role !== "OWNER") {
    throw new Error("Kun eiere kan slette prosjekter")
  }

  await prisma.project.delete({ where: { id: projectId } })
  revalidatePath("/dashboard")
}
