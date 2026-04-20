"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutGrid, LogOut, FolderKanban } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SidebarProject = {
  id: string
  name: string
  color: string
}

type SidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type Props = {
  projects: SidebarProject[]
  user: SidebarUser
}

export function Sidebar({ projects, user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FolderKanban className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold">Projects</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Oversikt
        </Link>

        <div className="mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Prosjekter
        </div>
        <div className="flex flex-col gap-1">
          {projects.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Ingen prosjekter ennå
            </p>
          )}
          {projects.map((project) => {
            const href = `/projects/${project.id}`
            const active = pathname?.startsWith(href)
            return (
              <Link
                key={project.id}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-secondary">
            <Avatar className="h-8 w-8">
              {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
              <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {user.name || user.email}
              </div>
              {user.name && (
                <div className="truncate text-xs text-muted-foreground">
                  {user.email}
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">{user.name || user.email}</div>
              {user.name && (
                <div className="text-xs text-muted-foreground">{user.email}</div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
