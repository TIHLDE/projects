import { moveRepo } from "@/actions/repos"
import type { RepoState, TreeRepo } from "@/lib/repo-tree"

/** What moving a repo into each category is called. */
export const MOVE_LABEL: Record<RepoState, string> = {
  front: "Vis på forsiden",
  listed: "Flytt til repoliste",
  archived: "Arkiver",
}

/** The categories a repo can move to from where it is now. */
export function moveTargets(repo: TreeRepo): RepoState[] {
  const order: RepoState[] = ["front", "listed", "archived"]
  return order.filter((state) => state !== repo.state)
}

export function moveTreeRepo(repo: TreeRepo, to: RepoState) {
  return moveRepo(
    repo.project
      ? { projectId: repo.project.id, to }
      : { repoName: repo.repoName ?? undefined, to }
  )
}

export function movedMessage(repo: TreeRepo, to: RepoState) {
  switch (to) {
    case "front":
      return `${repo.name} er på forsiden`
    case "listed":
      return `${repo.name} er flyttet til repolisten`
    case "archived":
      return `${repo.name} er arkivert`
  }
}
