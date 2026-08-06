"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { FolderKanban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function LoginButton() {
  const search = useSearchParams()
  const callbackUrl = search.get("callbackUrl") || "/dashboard"
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    try {
      // Full-page redirect to Photon: the password is entered on tihlde.org,
      // never here, so there is nothing to hand back to this component.
      await signIn("photon", { callbackUrl })
    } catch {
      toast.error("Kunne ikke starte innlogging. Prøv igjen.")
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSignIn} className="w-full" disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Logg inn med TIHLDE
    </Button>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FolderKanban className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Logg inn</CardTitle>
          <CardDescription>
            Du sendes til tihlde.org for å logge inn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginButton />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
