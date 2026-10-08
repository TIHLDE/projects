"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { addMemberToProject } from "@/lib/project-members"

const addSchema = z.object({
  projectId: z.string().min(1),
  tihldeUserId: z.string().min(1),
})

async function requireProjectMember(projectId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Not authenticated")

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new Error("Bare medlemmer kan endre prosjektet")
  return member
}

export async function addProjectMember(input: z.infer<typeof addSchema>) {
  const { projectId, tihldeUserId } = addSchema.parse(input)
  await requireProjectMember(projectId)
  await addMemberToProject(prisma, projectId, tihldeUserId)

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireProjectMember(projectId)

  const target = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!target) return

  if (target.role === "OWNER") {
    const owners = await prisma.projectMember.count({
      where: { projectId, role: "OWNER" },
    })
    if (owners <= 1) throw new Error("Prosjektet må ha minst én eier")
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  })

  await prisma.task.updateMany({
    where: { projectId, assigneeId: userId },
    data: { assigneeId: null },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
}
