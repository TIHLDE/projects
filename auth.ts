import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { claimUser } from "@/lib/claim-user"

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
  preferred_username?: string
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
          username: profile.preferred_username,
        }
      },
    },
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Mirror the member into the local table so a project can be owned by a
     * row that exists here, not just by a claim in a token.
     */
    async signIn({ user, profile }) {
      const photon = profile as PhotonProfile | undefined
      const tihldeUserId = photon?.sub ?? null
      const email = user.email ?? photon?.email ?? null
      if (!tihldeUserId && !email) return false

      const prisma = await getPrismaClient()
      const row = await claimUser(prisma, {
        tihldeUserId,
        email,
        name: user.name ?? null,
        username: photon?.preferred_username ?? null,
        image: user.image ?? null,
      })

      // The rest of the app joins on this id, so the JWT must carry the local
      // row id rather than Photon's subject.
      user.id = row.id
      return true
    },
  },
})
