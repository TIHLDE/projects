import { Octokit } from "@octokit/rest"

let cachedOctokit: Octokit | null = null

function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN is not configured")
  if (!cachedOctokit) cachedOctokit = new Octokit({ auth: token })
  return cachedOctokit
}

export type GithubIssueRow = {
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  htmlUrl: string
  labels: string[]
}

export async function listGithubIssues(
  owner: string,
  repo: string
): Promise<GithubIssueRow[]> {
  const octokit = getOctokit()
  const rows = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    per_page: 100,
  })

  return rows
    .filter((row) => !("pull_request" in row && row.pull_request))
    .map((row) => ({
      number: row.number,
      title: row.title || `Issue #${row.number}`,
      body: row.body ?? null,
      state: row.state as "open" | "closed",
      htmlUrl: row.html_url,
      labels: (row.labels ?? [])
        .map((l) =>
          typeof l === "object" && l !== null && "name" in l
            ? (l as { name: string }).name
            : null
        )
        .filter((n): n is string => !!n),
    }))
}

export type CreateIssueInput = {
  owner: string
  repo: string
  title: string
  body?: string
  labels?: string[]
}

export type CreateIssueResult = {
  number: number
  url: string
}

export async function createGithubIssue({
  owner,
  repo,
  title,
  body,
  labels,
}: CreateIssueInput): Promise<CreateIssueResult> {
  const octokit = getOctokit()
  const res = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
  })
  return {
    number: res.data.number,
    url: res.data.html_url,
  }
}
