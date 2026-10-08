/**
 * The organisation's private repositories, kept by hand so the site does not
 * need a token with access to them. Only the name is ever shown.
 *
 * `slug` is the repository's name on GitHub when it differs from the name
 * shown here; `archived` mirrors the repository being archived on GitHub.
 */
export type PrivateRepoEntry = {
  name: string
  slug?: string
  archived?: boolean
}

export const PRIVATE_REPOS: PrivateRepoEntry[] = [
  { name: "img-proxy" },
  { name: "TIHLDER" },
  { name: "tihlde-wiki" },
  { name: "mordvember-v2" },
  { name: "mordvember", slug: "Mordvember" },
  { name: "Drift-challenges" },
  { name: "Tihlde-CTF", slug: "CTF", archived: true },
  { name: "Tihlde-IRC", slug: "tihldeirc", archived: true },
  { name: "Captiveportal", slug: "captiveportal", archived: true },
]
