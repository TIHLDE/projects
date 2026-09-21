const API_URL = process.env.PHOTON_API_URL ?? "https://photon.tihlde.org/api"
const GROUP_SLUG = process.env.TIHLDE_GROUP_SLUG ?? "index"

export type TihldeMember = {
  tihldeUserId: string
  name: string | null
  username: string | null
  image: string | null
  studyProgram: string | null
  classYear: number | null
}

type MembersResponse = {
  userId: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    studyProgram: string | null
    classYear: number | null
  }
}[]

export async function fetchGroupMembers(): Promise<TihldeMember[]> {
  const res = await fetch(`${API_URL}/groups/${GROUP_SLUG}/members`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error(`Kunne ikke hente medlemmer fra TIHLDE (${res.status})`)
  }

  const rows = (await res.json()) as MembersResponse
  return rows
    .map((row) => ({
      tihldeUserId: row.user.id,
      name: row.user.name,
      username: row.user.username,
      image: row.user.image,
      studyProgram: row.user.studyProgram,
      classYear: row.user.classYear,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "nb"))
}
