import type { PrismaClient } from "@prisma/client"
import { fetchGroupMembers } from "@/lib/tihlde"
import { findLinkedUser } from "@/lib/claim-user"

/**
 * Put an Index member on a project. Callers check permissions first; this
 * lives outside `actions/` so it cannot be called from the client directly.
 */
export async function addMemberToProject(
  prisma: PrismaClient,
  projectId: string,
  tihldeUserId: string
) {
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

  // A project assigned from the repo tree starts without anyone on it, and a
  // project needs an owner before it can be deleted, so the first person in
  // becomes one.
  const owners = await prisma.projectMember.count({
    where: { projectId, role: "OWNER" },
  })

  // Adding someone who is already on the project must not touch their role:
  // that would let any member demote an owner by re-adding them.
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    create: {
      projectId,
      userId: user.id,
      role: owners === 0 ? "OWNER" : "MEMBER",
    },
    update: {},
  })

  return member
}
