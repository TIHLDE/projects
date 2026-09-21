"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { fetchGroupMembers } from "@/lib/tihlde"

const addSchema = z.object({
  projectId: z.string().min(1),
  tihldeUserId: z.string().min(1),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
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
  const { projectId, tihldeUserId, role } = addSchema.parse(input)
  await requireProjectMember(projectId)

  const members = await fetchGroupMembers()
  const member = members.find((m) => m.tihldeUserId === tihldeUserId)
  if (!member) throw new Error("Fant ikke personen i Index")

  // A person can be assigned before they have ever signed in here, so the row
  // is created from the TIHLDE profile and claimed by `tihldeUserId` at login.
  const user = await prisma.user.upsert({
    where: { tihldeUserId },
    create: {
      tihldeUserId,
      name: member.name,
      username: member.username,
      image: member.image,
    },
    update: {
      name: member.name,
      username: member.username,
      image: member.image,
    },
  })

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    create: { projectId, userId: user.id, role },
    update: { role },
  })

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
