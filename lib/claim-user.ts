import type { PrismaClient, User } from "@prisma/client"

export type TihldeIdentity = {
  tihldeUserId: string | null
  email: string | null
  name: string | null
  username: string | null
  image: string | null
}

/**
 * The row this person already has here, if any.
 *
 * Four ways in, tried in order of how certain they are. The last one exists
 * because Lepton identified users by their username, so rows written before
 * the move to Photon carry a username in `tihldeUserId` where newer rows
 * carry a Photon user id — without it, the same person gets a second row and
 * their projects stay behind on the first.
 */
export async function findLinkedUser(
  prisma: PrismaClient,
  identity: Pick<TihldeIdentity, "tihldeUserId" | "email" | "username">
): Promise<User | null> {
  const { tihldeUserId, email, username } = identity

  if (tihldeUserId) {
    const bySub = await prisma.user.findUnique({ where: { tihldeUserId } })
    if (bySub) return bySub
  }
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) return byEmail
  }
  if (username) {
    const byUsername = await prisma.user.findFirst({ where: { username } })
    if (byUsername) return byUsername

    const byLeptonId = await prisma.user.findUnique({
      where: { tihldeUserId: username },
    })
    if (byLeptonId) return byLeptonId
  }
  return null
}

/** Adopt the person's existing row, or make one for them. */
export async function claimUser(
  prisma: PrismaClient,
  identity: TihldeIdentity
): Promise<User> {
  const { tihldeUserId, email } = identity
  const existing = await findLinkedUser(prisma, identity)

  // Writing the email onto a row claimed by the TIHLDE id would collide with
  // an older duplicate that still carries it; that row is left alone rather
  // than failing the login.
  const emailTakenByOther = email
    ? await prisma.user.findFirst({
        where: { email, NOT: { id: existing?.id ?? "" } },
        select: { id: true },
      })
    : null

  /**
   * Only fields Photon actually sent overwrite what is stored. A login
   * without `preferred_username` would otherwise blank the username an
   * assignment wrote, and that is what later logins are matched on.
   */
  const data = {
    email: emailTakenByOther ? (existing?.email ?? null) : email,
    name: identity.name ?? existing?.name ?? null,
    username: identity.username ?? existing?.username ?? null,
    image: identity.image ?? existing?.image ?? null,
    tihldeUserId: tihldeUserId ?? existing?.tihldeUserId ?? null,
  }

  return existing
    ? prisma.user.update({ where: { id: existing.id }, data })
    : prisma.user.create({ data })
}
