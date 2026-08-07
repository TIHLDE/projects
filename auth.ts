import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

/**
 * Claims Photon returns from the OIDC userinfo endpoint.
 *
 * `sub` is Photon's own user id, not the NTNU username Lepton handed out. It
 * is stored on the row so a member stays recognisable across logins even if
 * they change their email.
 */
type PhotonProfile = {
  sub: string
  email?: string
  name?: string
  picture?: string
}

async function getPrismaClient() {
  const { prisma } = await import("@/lib/prisma")
  return prisma
}

const issuer = process.env.PHOTON_ISSUER ?? "https://photon.tihlde.org/api/auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    {
      id: "photon",
      name: "TIHLDE",
      type: "oidc",
      issuer,
      clientId: process.env.PHOTON_CLIENT_ID,
      clientSecret: process.env.PHOTON_CLIENT_SECRET,
      // Bare identitetsscopene. Sesjonen her er Auth.js sin egen JWT, og
      // Photons access-token brukes aldri etter innlogging — så `offline_access`
      // ga ingenting, og klienten har det ikke registrert: Photon svarte
      // `invalid_scope` og avbrøt før innloggingssiden i det hele tatt kom opp.
      authorization: {
        params: { scope: "openid profile email" },
      },
      profile(profile: PhotonProfile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        }
      },
    },
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Mirror the member into the local table so a project can be owned by a
     * row that exists here, not just by a claim in a token.
     *
     * Keyed on email rather than `sub`: every account that logged in while
     * this app still talked to Lepton was written with a Lepton user id, so
     * matching on email adopts those rows instead of creating a second one
     * for the same person.
     */
    async signIn({ user, profile }) {
      const email = user.email ?? profile?.email
      if (!email) return false

      const prisma = await getPrismaClient()
      const row = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          tihldeUserId: profile?.sub ?? null,
        },
        update: {
          name: user.name ?? null,
          image: user.image ?? null,
          tihldeUserId: profile?.sub ?? null,
        },
      })

      // The rest of the app joins on this id, so the JWT must carry the local
      // row id rather than Photon's subject.
      user.id = row.id
      return true
    },
  },
})
