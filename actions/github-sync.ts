"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { listGithubIssues } from "@/lib/github"
import { AVAILABLE_TAGS } from "@/lib/utils"

function tagsFromGithubLabels(labelNames: string[]): string[] {
  const lower = new Set(AVAILABLE_TAGS.map((t) => t.toLowerCase()))
  return labelNames
    .map((n) => n.trim().toLowerCase())
    .filter((n) => lower.has(n))
    .map(
      (n) =>
        AVAILABLE_TAGS.find((t) => t.toLowerCase() === n) as string
    )
}

async function requireMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new Error("Ikke medlem av prosjektet")
  return member
}

export type SyncGithubIssuesResult = {
  imported: number
  updated: number
  total: number
}

export async function syncGithubIssues(
  projectId: string
): Promise<SyncGithubIssuesResult> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  const userId = session.user.id

  await requireMember(projectId, userId)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })
  if (!project?.githubOwner?.trim() || !project.githubRepo?.trim()) {
    throw new Error("GitHub-repo er ikke konfigurert for prosjektet")
  }

  const owner = project.githubOwner.trim()
  const repo = project.githubRepo.trim()

  const issues = await listGithubIssues(owner, repo)

  let imported = 0
  let updated = 0

  for (const issue of issues) {
    const existing = await prisma.task.findFirst({
      where: { projectId, githubIssueNumber: issue.number },
    })

    const labelTags = tagsFromGithubLabels(issue.labels)

    if (existing) {
      const nextStatus =
        issue.state === "closed"
          ? "DONE"
          : existing.status === "DONE"
            ? "TODO"
            : existing.status

      const mergedTags = [
        ...new Set([...existing.tags, ...labelTags]),
      ]

      await prisma.task.update({
        where: { id: existing.id },
        data: {
          title: issue.title,
          description: issue.body,
          githubIssueUrl: issue.htmlUrl,
          status: nextStatus,
          tags: mergedTags,
        },
      })
      updated += 1
    } else {
      const tags = [...new Set(["code", ...labelTags])]
      await prisma.task.create({
        data: {
          title: issue.title,
          description: issue.body,
          status: issue.state === "closed" ? "DONE" : "TODO",
          priority: "MEDIUM",
          tags,
          githubIssueUrl: issue.htmlUrl,
          githubIssueNumber: issue.number,
          createGithubIssue: false,
          projectId,
          createdById: userId,
        },
      })
      imported += 1
    }
  }

  revalidatePath(`/projects/${projectId}`)
  return { imported, updated, total: issues.length }
}
