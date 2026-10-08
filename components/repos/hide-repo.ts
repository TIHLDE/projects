import { hideProject, hideRepo } from "@/actions/repos"
import type { TreeRepo } from "@/lib/repo-tree"

/** Whether a repo in this state can be sent to Skjult. */
export function canHide(repo: TreeRepo) {
  return repo.state === "front" || repo.state === "unregistered"
}

export function hideTreeRepo(repo: TreeRepo) {
  if (repo.project) return hideProject(repo.project.id)
  if (repo.repoName) return hideRepo(repo.repoName)
  throw new Error("Fant ikke prosjektet")
}
