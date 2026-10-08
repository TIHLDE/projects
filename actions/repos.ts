"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PROJECT_COLORS } from "@/lib/utils"
import { addMemberToProject } from "@/lib/project-members"
import {
  findProjectForRepo,
  getOrgRepos,
  GITHUB_ORG,
  STATUS_BY_STATE,
} from "@/lib/repo-tree"

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

/**
 * Anyone in Index may pick up a repo nobody is on, or bring back a hidden
 * one. A project on the front page that already has people on it is theirs
 * to change.
 */
async function requireCanChange(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  })
  if (!project) throw new Error("Fant ikke prosjektet")

  const isMember = project.members.some((m) => m.userId === userId)
  const unclaimed = project.members.length === 0
  if (project.status === "ACTIVE" && !isMember && !unclaimed) {
    throw new Error("Bare medlemmer kan endre prosjektet")
  }
  return project
}

function colorFor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PROJECT_COLORS[hash % PROJECT_COLORS.length]
}

function revalidateAll() {
  // The sidebar lists the viewer's projects, so the layout is stale too.
  revalidatePath("/", "layout")
}

const assignToRepoSchema = z.object({
  repoName: z.string().min(1),
  tihldeUserId: z.string().min(1),
})

/**
 * Put someone on a repo, registering it as a project the first time, and
 * bring it to the front page.
 */
export async function assignToRepo(input: z.infer<typeof assignToRepoSchema>) {
  const userId = await requireUserId()
  const { repoName, tihldeUserId } = assignToRepoSchema.parse(input)

  const repos = await getOrgRepos()
  const repo = repos.find(
    (r) => r.slug.toLowerCase() === repoName.toLowerCase()
  )
  if (!repo) throw new Error(`Fant ikke ${repoName} i ${GITHUB_ORG}`)

  const existing = await findProjectForRepo(repo.slug)
  if (existing) await requireCanChange(existing.id, userId)

  const project =
    existing ??
    (await prisma.project.create({
      data: {
        name: repo.name,
        description: repo.isPrivate ? null : repo.description,
        color: colorFor(repo.name),
        githubOwner: GITHUB_ORG,
        githubRepo: repo.slug,
        createdById: userId,
      },
    }))

  const member = await addMemberToProject(prisma, project.id, tihldeUserId)
  if (project.status !== "ACTIVE") {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    })
  }

  revalidateAll()
  return { projectId: project.id, name: member.name }
}

const assignToProjectSchema = z.object({
  projectId: z.string().min(1),
  tihldeUserId: z.string().min(1),
})

/** Same as `assignToRepo`, for a project without a repo in the organisation. */
export async function assignToProject(
  input: z.infer<typeof assignToProjectSchema>
) {
  const userId = await requireUserId()
  const { projectId, tihldeUserId } = assignToProjectSchema.parse(input)

  const project = await requireCanChange(projectId, userId)
  const member = await addMemberToProject(prisma, project.id, tihldeUserId)
  if (project.status !== "ACTIVE") {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    })
  }

  revalidateAll()
  return { projectId: project.id, name: member.name }
}

/**
 * Take a project off the front page. Its members and tasks are kept. Anyone
 * in Index may do this, so the front page can be tidied without being on
 * every project.
 */
export async function hideProject(projectId: string) {
  await requireUserId()

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ARCHIVED" },
  })
  revalidateAll()
}

/** Put a hidden project back on the front page as it was. */
export async function showProject(projectId: string) {
  await requireUserId()

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ACTIVE" },
  })
  revalidateAll()
}

const moveSchema = z
  .object({
    repoName: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    to: z.enum(["front", "hidden", "listed", "archived"]),
  })
  .refine((v) => v.repoName || v.projectId, "Mangler repo eller prosjekt")

/**
 * Move a repo to another category in the tree. A repo nobody has picked up
 * yet has no project to carry its category, so it is registered as one with
 * no members. Members and tasks are kept whichever way it moves.
 */
export async function moveRepo(input: z.infer<typeof moveSchema>) {
  const userId = await requireUserId()
  const { repoName, projectId, to } = moveSchema.parse(input)
  const status = STATUS_BY_STATE[to]

  if (projectId) {
    await prisma.project.update({ where: { id: projectId }, data: { status } })
    revalidateAll()
    return
  }

  const repos = await getOrgRepos()
  const repo = repos.find(
    (r) => r.slug.toLowerCase() === repoName!.toLowerCase()
  )
  if (!repo) throw new Error(`Fant ikke ${repoName} i ${GITHUB_ORG}`)

  const existing = await findProjectForRepo(repo.slug)
  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data: { status },
    })
  } else {
    await prisma.project.create({
      data: {
        name: repo.name,
        description: repo.isPrivate ? null : repo.description,
        color: colorFor(repo.name),
        githubOwner: GITHUB_ORG,
        githubRepo: repo.slug,
        status,
        createdById: userId,
      },
    })
  }
  revalidateAll()
}
