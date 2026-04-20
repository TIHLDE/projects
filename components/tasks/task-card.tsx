"use client"

import { AlertTriangle, Github } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials, TAG_COLORS } from "@/lib/utils"
import { PriorityIcon } from "./priority-icon"

export type TaskCardTask = {
  id: string
  title: string
  priority: string
  tags: string[]
  dueDate: Date | string | null
  status: string
  githubIssueUrl: string | null
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

type Props = {
  task: TaskCardTask
  onClick?: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}

export function TaskCard({ task, onClick, draggable, onDragStart }: Props) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const overdue =
    dueDate && task.status !== "DONE" && isPast(dueDate) && !isToday(dueDate)

  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/50"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {task.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                TAG_COLORS[tag] ?? "bg-secondary text-muted-foreground"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <PriorityIcon priority={task.priority} className="mt-0.5" />
        <p className="text-sm font-medium leading-snug">{task.title}</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          {dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue ? "text-red-600" : "text-muted-foreground"
              )}
            >
              {overdue && <AlertTriangle className="h-3 w-3" />}
              {format(dueDate, "dd. MMM")}
            </span>
          )}
          {task.githubIssueUrl && (
            <a
              href={task.githubIssueUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {task.assignee && (
          <Avatar className="h-6 w-6">
            {task.assignee.image && (
              <AvatarImage
                src={task.assignee.image}
                alt={task.assignee.name || ""}
              />
            )}
            <AvatarFallback className="text-[10px]">
              {getInitials(task.assignee.name, task.assignee.email)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}
