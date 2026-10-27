"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRequest } from "@/actions/requests"

export function RequestForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const error = await createRequest({ title, body })
        if (error) {
          toast.error(error)
          return
        }
        toast.success("Forespørsel sendt til Index")
        setTitle("")
        setBody("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Kunne ikke sende")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="request-title">Tittel</Label>
        <Input
          id="request-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="request-body">Beskrivelse</Label>
        <Textarea
          id="request-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          required
          disabled={pending}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Send inn
        </Button>
      </div>
    </form>
  )
}
