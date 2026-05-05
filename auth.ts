import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
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

async function getPrismaClient() {
  const { prisma } = await import("@/lib/prisma")
  return prisma
}

function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

async function fetchTihldeProfile(
  baseUrl: string,
  token: string
): Promise<Response> {
  const profileUrl = `${baseUrl}/users/me/`
  const headerAttempts: HeadersInit[] = [
    { "x-csrf-token": token },
    { Authorization: `Bearer ${token}` },
    { "x-csrf-token": token, Authorization: `Bearer ${token}` },
  ]

  let lastResponse: Response | null = null

  for (const headers of headerAttempts) {
    const response = await fetch(profileUrl, { headers })
    if (response.ok) return response
    lastResponse = response
    if (response.status !== 401 && response.status !== 403) return response
  }

  if (!lastResponse) {
    throw new Error("Profile request failed before receiving a response")
  }

  return lastResponse
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
        try {
          const username = credentials?.username as string | undefined
          const password = credentials?.password as string | undefined
          if (!username || !password) return null

          const rawBaseUrl = process.env.TIHLDE_API_URL
          if (!rawBaseUrl) throw new Error("TIHLDE_API_URL is not configured")
          const baseUrl = normalizeApiBaseUrl(rawBaseUrl)

          const loginRes = await fetch(`${baseUrl}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: username, password }),
          })

          if (!loginRes.ok) {
            if (loginRes.status === 400 || loginRes.status === 401) return null
            console.error("TIHLDE login request failed", {
              status: loginRes.status,
            })
            throw new Error("Authentication service is unavailable")
          }

          const loginJson = (await loginRes.json()) as Partial<TihldeLoginResponse>
          const token = loginJson.token
          if (!token) {
            console.error("TIHLDE login response missing token")
            throw new Error("Authentication service returned invalid data")
          }

          const meRes = await fetchTihldeProfile(baseUrl, token)
          if (!meRes.ok) {
            if (meRes.status === 401 || meRes.status === 403) return null
            console.error("TIHLDE profile request failed", {
              status: meRes.status,
            })
            throw new Error("Authentication service is unavailable")
          }

          const profile = (await meRes.json()) as TihldeProfile
          if (!profile.email || !profile.user_id) {
            console.error("TIHLDE profile response missing required fields")
            throw new Error("Authentication service returned invalid data")
          }

          const name = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ")
            .trim()

          const prisma = await getPrismaClient()
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
        } catch (error) {
          if (error instanceof Error) {
            console.error("Credentials authorize failed", {
              message: error.message,
            })
          } else {
            console.error("Credentials authorize failed")
          }
          throw error
        }
      },
    }),
  ],
})
