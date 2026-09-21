"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { fetchGroupMembers } from "@/lib/tihlde"
import { findLinkedUser } from "@/lib/claim-user"

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

  const members = await fetchGroupMembers()
  const member = members.find((m) => m.tihldeUserId === tihldeUserId)
  if (!member) throw new Error("Fant ikke personen i Index")

  // A person can be assigned before they have ever signed in here, so the row
  // is created from the TIHLDE profile and claimed at login. The lookup is
  // shared with the login path so an account from the Lepton era is adopted
  // rather than duplicated.
  const existing = await findLinkedUser(prisma, {
    tihldeUserId,
    email: null,
    username: member.username,
  })

  const profile = {
    name: member.name,
    username: member.username,
    image: member.image,
    tihldeUserId,
  }

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: profile })
    : await prisma.user.create({ data: profile })

  // Adding someone who is already on the project must not touch their role:
  // that would let any member demote an owner by re-adding them.
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    create: { projectId, userId: user.id, role: "MEMBER" },
    update: {},
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
