import { Octokit } from "@octokit/rest"

let cachedOctokit: Octokit | null = null

function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN is not configured")
  if (!cachedOctokit) cachedOctokit = new Octokit({ auth: token })
  return cachedOctokit
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
