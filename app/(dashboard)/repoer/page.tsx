import { auth } from "@/auth"
import { fetchGroupMembers } from "@/lib/tihlde"
import { loadRepoTree } from "@/lib/repo-tree"
import { RepoTree } from "@/components/repos/repo-tree"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function RepoTreePage() {
  const session = await auth()
  const [{ repos, warning }, candidates] = await Promise.all([
    loadRepoTree(),
    fetchGroupMembers().catch(() => []),
  ])

  return (
    <div className="h-screen">
      <RepoTree
        repos={repos}
        candidates={candidates}
        viewerId={session!.user.id}
        warning={warning}
      />
    </div>
  )
}
