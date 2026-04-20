"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Github } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  TaskDialog,
  type TaskDialogTask,
} from "@/components/tasks/task-dialog"
import { PriorityIcon } from "@/components/tasks/priority-icon"
import {
  cn,
  getInitials,
  TAG_COLORS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/utils"
import type { TaskCardTask } from "@/components/tasks/task-card"

type Task = TaskCardTask & {
  description: string | null
  assigneeId: string | null
}

type Member = {
  userId: string
  user: { id: string; name: string | null; email: string }
}

type Props = {
  projectId: string
  tasks: Task[]
  members: Member[]
  hasGithub: boolean
}

export function ListView({ projectId, tasks, members, hasGithub }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskDialogTask | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    DONE: true,
  })

  function openEdit(task: Task) {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      assigneeId: task.assigneeId,
      githubIssueUrl: task.githubIssueUrl,
    })
    setDialogOpen(true)
  }

  function toggle(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  return (
    <>
      <div className="space-y-4">
        {TASK_STATUSES.map((status) => {
          const group = tasks.filter((t) => t.status === status)
          const isCollapsed = collapsed[status]
          return (
            <div
              key={status}
              className="overflow-hidden rounded-lg border border-border"
            >
              <button
                type="button"
                onClick={() => toggle(status)}
                className="flex w-full items-center justify-between gap-2 bg-card px-4 py-2.5 text-left"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {TASK_STATUS_LABELS[status]}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {group.length}
                  </span>
                </div>
              </button>
              {!isCollapsed && group.length > 0 && (
                <div className="divide-y divide-border">
                  {group.map((task) => {
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null
                    const overdue =
                      dueDate &&
                      task.status !== "DONE" &&
                      isPast(dueDate) &&
                      !isToday(dueDate)
                    return (
                      <div
                        key={task.id}
                        onClick={() => openEdit(task)}
                        className="flex cursor-pointer items-center gap-3 bg-card px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
                      >
                        <PriorityIcon priority={task.priority} />
                        <span className="flex-1 truncate font-medium">
                          {task.title}
                        </span>
                        {task.tags.length > 0 && (
                          <div className="hidden gap-1 md:flex">
                            {task.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                  TAG_COLORS[tag] ??
                                    "bg-secondary text-muted-foreground"
                                )}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {dueDate && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              overdue
                                ? "text-red-600"
                                : "text-muted-foreground"
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
                        {task.assignee && (
                          <Avatar className="h-6 w-6">
                            {task.assignee.image && (
                              <AvatarImage
                                src={task.assignee.image}
                                alt={task.assignee.name || ""}
                              />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(
                                task.assignee.name,
                                task.assignee.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        members={members}
        hasGithub={hasGithub}
        task={editingTask}
      />
    </>
  )
}
