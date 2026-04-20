"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createGithubIssue } from "@/lib/github"

const taskSchema = z.object({
  title: z.string().min(1, "Tittel er påkrevd"),
  description: z.string().optional().nullable(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  tags: z.array(z.string()).default([]),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

async function ensureMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new Error("Ikke medlem av prosjektet")
  return member
}

export async function createTask(
  projectId: string,
  input: z.infer<typeof taskSchema>
) {
  const userId = await requireUserId()
  await ensureMember(projectId, userId)
  const data = taskSchema.parse(input)

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new Error("Prosjekt finnes ikke")

  let githubIssueUrl: string | null = null
  let githubIssueNumber: number | null = null

  const shouldCreateIssue =
    data.tags.includes("code") &&
    !!project.githubOwner &&
    !!project.githubRepo

  if (shouldCreateIssue) {
    try {
      const issue = await createGithubIssue({
        owner: project.githubOwner!,
        repo: project.githubRepo!,
        title: data.title,
        body: data.description ?? undefined,
        labels: data.tags,
      })
      githubIssueUrl = issue.url
      githubIssueNumber = issue.number
    } catch (err) {
      console.error("Failed to create GitHub issue", err)
    }
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      tags: data.tags,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      createdById: userId,
      projectId,
      createGithubIssue: shouldCreateIssue,
      githubIssueUrl,
      githubIssueNumber,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return { id: task.id }
}

export async function updateTask(
  taskId: string,
  input: z.infer<typeof taskSchema>
) {
  const userId = await requireUserId()
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Oppgave finnes ikke")
  await ensureMember(task.projectId, userId)

  const data = taskSchema.parse(input)

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      tags: data.tags,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
    },
  })

  revalidatePath(`/projects/${task.projectId}`)
}

export async function updateTaskStatus(taskId: string, status: string) {
  const userId = await requireUserId()
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Oppgave finnes ikke")
  await ensureMember(task.projectId, userId)

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: status as "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
    },
  })

  revalidatePath(`/projects/${task.projectId}`)
}

export async function deleteTask(taskId: string) {
  const userId = await requireUserId()
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Oppgave finnes ikke")
  await ensureMember(task.projectId, userId)

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/projects/${task.projectId}`)
}
