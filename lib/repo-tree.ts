import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { listPublicOrgRepos, type OrgRepo } from "@/lib/github"
import { PRIVATE_REPOS } from "@/lib/private-repos"

export const GITHUB_ORG = process.env.GITHUB_ORG ?? "TIHLDE"

/** Where a repo sits in the tree. */
export type RepoState = "front" | "hidden" | "unregistered" | "githubArchived"

export type TreeMember = {
  userId: string
  name: string | null
  username: string | null
  image: string | null
  tihldeUserId: string | null
}

/**
 * One node in the repo tree: a GitHub repo, a project, or both. Private repos
 * carry their name and nothing else from GitHub — the description, language
 * and activity are dropped here, on the server, so they never reach the page.
 */
export type TreeRepo = {
  key: string
  name: string
  /** The repo's name on GitHub, or null for a project without one. */
  repoName: string | null
  isPrivate: boolean
  description: string | null
  language: string | null
  stars: number | null
  pushedAt: string | null
  htmlUrl: string | null
  state: RepoState
  project: {
    id: string
    color: string
    members: TreeMember[]
  } | null
}

export type RepoTreeData = {
  repos: TreeRepo[]
  /** Set when the GitHub side could not be read completely. */
  warning: string | null
}

const cachedPublicRepos = unstable_cache(
  (org: string) => listPublicOrgRepos(org),
  ["org-public-repos"],
  { revalidate: 600, tags: ["org-repos"] }
)

/** The private repos from the hand-kept list, carrying nothing but a name. */
function privateRepos(): OrgRepo[] {
  return PRIVATE_REPOS.map((entry) => {
    const slug = entry.slug ?? entry.name
    return {
      slug,
      name: entry.name,
      description: null,
      isPrivate: true,
      isArchived: entry.archived ?? false,
      language: null,
      stars: 0,
      pushedAt: null,
      htmlUrl: `https://github.com/${GITHUB_ORG}/${slug}`,
    }
  })
}

/**
 * Every repo in the organisation: the public ones from GitHub and the
 * private ones from `PRIVATE_REPOS`. Throws when GitHub cannot be reached.
 */
export async function getOrgRepos(): Promise<OrgRepo[]> {
  const publicRepos = await cachedPublicRepos(GITHUB_ORG)
  const known = new Set(publicRepos.map((r) => repoKey(r.slug)))
  const hidden = privateRepos().filter((r) => !known.has(repoKey(r.slug)))
  return [...publicRepos, ...hidden].sort((a, b) =>
    a.name.localeCompare(b.name, "nb")
  )
}

function repoKey(name: string) {
  return name.toLowerCase()
}

/** The project a repo maps to: an active one wins, then the newest. */
export async function findProjectForRepo(repoName: string) {
  return prisma.project.findFirst({
    where: {
      githubOwner: { equals: GITHUB_ORG, mode: "insensitive" },
      githubRepo: { equals: repoName, mode: "insensitive" },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  })
}

export async function loadRepoTree(): Promise<RepoTreeData> {
  let orgRepos: OrgRepo[] = []
  let warning: string | null = null

  try {
    orgRepos = await getOrgRepos()
  } catch (err) {
    console.error("Failed to list GitHub repos", err)
    // The private repos need nothing from GitHub, so they still show.
    orgRepos = privateRepos()
    warning =
      "Kunne ikke hente de offentlige repoene fra GitHub. Viser de private og prosjektene som er registrert her."
  }

  const projects = await prisma.project.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              tihldeUserId: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
    // ACTIVE sorts before ARCHIVED, so a repo linked from more than one
    // project is represented by the one on the front page.
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  })

  const byRepo = new Map<string, (typeof projects)[number]>()
  const unmatched: typeof projects = []
  const orgNames = new Set(orgRepos.map((r) => repoKey(r.slug)))

  for (const project of projects) {
    const owner = project.githubOwner?.trim().toLowerCase()
    const repo = project.githubRepo?.trim()
    const key = repo ? repoKey(repo) : null
    if (
      owner === GITHUB_ORG.toLowerCase() &&
      key &&
      orgNames.has(key) &&
      !byRepo.has(key)
    ) {
      byRepo.set(key, project)
    } else {
      unmatched.push(project)
    }
  }

  function projectView(project: (typeof projects)[number]) {
    return {
      id: project.id,
      color: project.color,
      members: project.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        username: m.user.username,
        image: m.user.image,
        tihldeUserId: m.user.tihldeUserId,
      })),
    }
  }

  const repos: TreeRepo[] = orgRepos.map((repo) => {
    const project = byRepo.get(repoKey(repo.slug)) ?? null
    const state: RepoState =
      project?.status === "ACTIVE"
        ? "front"
        : repo.isArchived
          ? "githubArchived"
          : project
            ? "hidden"
            : "unregistered"

    const shared = {
      key: `repo:${repoKey(repo.slug)}`,
      name: repo.name,
      repoName: repo.slug,
      isPrivate: repo.isPrivate,
      htmlUrl: repo.htmlUrl,
      state,
      project: project ? projectView(project) : null,
    }

    if (repo.isPrivate) {
      return {
        ...shared,
        description: null,
        language: null,
        stars: null,
        pushedAt: null,
      }
    }

    return {
      ...shared,
      description: project?.description || repo.description,
      language: repo.language,
      stars: repo.stars,
      pushedAt: repo.pushedAt,
    }
  })

  // Projects with no repo in the organisation still belong in the tree, next
  // to the repos they share a state with.
  for (const project of unmatched) {
    repos.push({
      key: `project:${project.id}`,
      name: project.name,
      repoName: null,
      isPrivate: false,
      description: project.description,
      language: null,
      stars: null,
      pushedAt: null,
      htmlUrl:
        project.githubOwner && project.githubRepo
          ? `https://github.com/${project.githubOwner}/${project.githubRepo}`
          : null,
      state: project.status === "ACTIVE" ? "front" : "hidden",
      project: projectView(project),
    })
  }

  return { repos, warning }
}
