import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true,
  // Support both Auth.js v5 and legacy NextAuth env naming.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
      }
      return token
    },
    async session({ session, token }) {
      const userId = (token.id as string | undefined) ?? token.sub
      if (session.user && userId) {
        session.user.id = userId
      }
      return session
    },
  },
} satisfies NextAuthConfig
