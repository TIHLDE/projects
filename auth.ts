import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

type TihldeLoginResponse = {
  token: string
}

type TihldeProfile = {
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  image?: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Brukernavn", type: "text" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined
        const password = credentials?.password as string | undefined
        if (!username || !password) return null

        const baseUrl = process.env.TIHLDE_API_URL
        if (!baseUrl) throw new Error("TIHLDE_API_URL is not configured")

        const loginRes = await fetch(`${baseUrl}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: username, password }),
        })
        if (!loginRes.ok) return null
        const loginJson = (await loginRes.json()) as TihldeLoginResponse
        const token = loginJson.token
        if (!token) return null

        const meRes = await fetch(`${baseUrl}/users/me/`, {
          headers: { "x-csrf-token": token },
        })
        if (!meRes.ok) return null
        const profile = (await meRes.json()) as TihldeProfile

        const name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim()

        const user = await prisma.user.upsert({
          where: { email: profile.email },
          create: {
            email: profile.email,
            name: name || null,
            image: profile.image || null,
            tihldeUserId: profile.user_id,
            tihldeToken: token,
          },
          update: {
            name: name || null,
            image: profile.image || null,
            tihldeUserId: profile.user_id,
            tihldeToken: token,
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        }
      },
    }),
  ],
})
