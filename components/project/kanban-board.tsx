"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard, type TaskCardTask } from "@/components/tasks/task-card"
import {
  TaskDialog,
  type TaskDialogTask,
} from "@/components/tasks/task-dialog"
import {
  cn,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/utils"
import { updateTaskStatus } from "@/actions/tasks"

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

export function KanbanBoard({ projectId, tasks, members, hasGithub }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskDialogTask | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<string>("BACKLOG")
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openCreate(status: string) {
    setEditingTask(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString()
        : null,
      assigneeId: task.assigneeId,
      githubIssueUrl: task.githubIssueUrl,
    })
    setDialogOpen(true)
  }

  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault()
    setDragOver(null)
    const taskId = e.dataTransfer.getData("text/plain")
    if (!taskId) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === status) return
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, status)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Kunne ikke flytte")
      }
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status)
          return (
            <div
              key={status}
              className={cn(
                "flex min-h-[500px] flex-col rounded-lg border border-border bg-card/50 p-3 transition-colors",
                dragOver === status && "bg-secondary"
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(status)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {TASK_STATUS_LABELS[status]}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => openCreate(status)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", task.id)
                    }
                    onClick={() => openEdit(task)}
                  />
                ))}
              </div>
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
        defaultStatus={defaultStatus}
      />
    </>
  )
}
