import type { PrismaClient, User } from "@prisma/client"

export type TihldeIdentity = {
  tihldeUserId: string | null
  email: string | null
  name: string | null
  username: string | null
  image: string | null
}

/**
 * Find the row this person already has, or make one.
 *
 * `tihldeUserId` is checked before email: a member assigned to a project
 * before their first login has a row keyed on that id alone, and every
 * account from the Lepton era has an email but a foreign user id. Matching
 * both ways adopts either row instead of creating a second one for the same
 * person.
 */
export async function claimUser(
  prisma: PrismaClient,
  identity: TihldeIdentity
): Promise<User> {
  const { tihldeUserId, email } = identity

  const existing =
    (tihldeUserId
      ? await prisma.user.findUnique({ where: { tihldeUserId } })
      : null) ??
    (email ? await prisma.user.findUnique({ where: { email } }) : null)

  // Writing the email onto a row claimed by the TIHLDE id would collide with
  // an older duplicate that still carries it; that row is left alone rather
  // than failing the login.
  const emailTakenByOther = email
    ? await prisma.user.findFirst({
        where: { email, NOT: { id: existing?.id ?? "" } },
        select: { id: true },
      })
    : null

  const data = {
    email: emailTakenByOther ? (existing?.email ?? null) : email,
    name: identity.name,
    username: identity.username,
    image: identity.image,
    tihldeUserId,
  }

  return existing
    ? prisma.user.update({ where: { id: existing.id }, data })
    : prisma.user.create({ data })
}
