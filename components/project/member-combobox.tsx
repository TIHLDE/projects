"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getInitials } from "@/lib/utils"
import type { TihldeMember } from "@/lib/tihlde"

type Props = {
  /** The person picked so far, shown on the trigger, or null. */
  selected: TihldeMember | null
  query: string
  onQueryChange: (query: string) => void
  results: TihldeMember[]
  onSelect: (member: TihldeMember) => void
  emptyLabel?: string
  placeholder?: string
}

export function MemberCombobox({
  selected,
  query,
  onQueryChange,
  results,
  onSelect,
  emptyLabel = "Velg medlem",
  placeholder = "Søk på navn eller brukernavn…",
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    // `modal`: the picker lives inside a dialog, and a non-modal popover is
    // portalled outside the dialog's pointer-events guard — the first click
    // in the search field then counts as a click outside and shuts it again.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger className="flex cursor-pointer items-center gap-2">
        {selected ? (
          <>
            <Avatar className="h-7 w-7">
              {selected.image && (
                <AvatarImage src={selected.image} alt={selected.name ?? ""} />
              )}
              <AvatarFallback>
                {getInitials(selected.name, selected.username)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{selected.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{emptyLabel}</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="flex w-72 flex-col gap-2">
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        {results.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground">
            Ingen treff
          </span>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {results.map((member) => (
              <li key={member.tihldeUserId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(member)
                    setOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-secondary"
                >
                  <Avatar className="h-7 w-7">
                    {member.image && (
                      <AvatarImage
                        src={member.image}
                        alt={member.name ?? ""}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(member.name, member.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {member.name ?? member.username}
                    </span>
                    {member.username && (
                      <span className="truncate text-xs text-muted-foreground">
                        {member.username}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
