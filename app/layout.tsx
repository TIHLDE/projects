import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Projects",
  description: "Prosjektstyring for TIHLDE",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
