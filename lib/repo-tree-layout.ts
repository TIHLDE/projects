import type { Edge, Node } from "@xyflow/react"
import type { RepoState, TreeRepo } from "@/lib/repo-tree"

export const CARD_WIDTH = 272
export const CARD_HEIGHT = 108
export const ROOT_WIDTH = 320
export const ROOT_HEIGHT = 84
export const SECTION_WIDTH = 248
export const SECTION_HEIGHT = 40

const ROWS_PER_COLUMN = 7
const ROW_GAP = 16
const TRUNK_INDENT = 28
const COLUMN_GAP = 40
const SECTION_GAP = 120
const ROOT_TO_SECTION = 88
const SECTION_TO_CARDS = 64
const COLUMN_STRIDE = TRUNK_INDENT + CARD_WIDTH + COLUMN_GAP

export const SECTIONS: { state: RepoState; label: string }[] = [
  { state: "front", label: "På forsiden" },
  { state: "hidden", label: "Skjult" },
  { state: "listed", label: "Repoliste" },
  { state: "archived", label: "Arkivert" },
]

export const NODE_TYPE = {
  root: "repoTreeRoot",
  section: "repoTreeSection",
  junction: "repoTreeJunction",
  repo: "repoTreeRepo",
} as const

export const HANDLE = {
  top: "top",
  bottom: "bottom",
  left: "left",
} as const

export type RootNodeData = { total: number; onFront: number }
export type SectionNodeData = {
  state: RepoState
  label: string
  count: number
  open: boolean
  /** Another category is in focus, so this one steps back. */
  muted: boolean
}
export type RepoNodeData = {
  repo: TreeRepo
  selected: boolean
  /** Not a search match. */
  dimmed: boolean
  /** In a category other than the one in focus. */
  muted: boolean
}

export type TreeView = {
  selectedKey: string | null
  matches: Set<string> | null
  open: ReadonlySet<RepoState>
  /** The category opened last, whose repos stay at full strength. */
  focused: RepoState | null
}

export type RepoTreeLayout = {
  nodes: Node[]
  edges: Edge[]
}

const EDGE_COLOR = "var(--tree-edge)"
const FRONT_EDGE_COLOR = "var(--primary)"

function edge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  front: boolean
): Edge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: "smoothstep",
    animated: front,
    selectable: false,
    focusable: false,
    pathOptions: { borderRadius: 14 },
    style: {
      stroke: front ? FRONT_EDGE_COLOR : EDGE_COLOR,
      strokeWidth: front ? 2 : 1.5,
    },
  } as Edge
}

/**
 * Root at the top, one branch per state, and each branch's repos in columns
 * of at most `ROWS_PER_COLUMN` hanging off a trunk on their left — a file
 * tree turned sideways, so no edge ever crosses a card.
 */
export function buildRepoTree(
  repos: TreeRepo[],
  { selectedKey, matches, open, focused }: TreeView
): RepoTreeLayout {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: repos
      .filter((r) => r.state === section.state)
      .sort((a, b) => a.name.localeCompare(b.name, "nb")),
  }))

  const widths = sections.map((s) => {
    if (!open.has(s.state)) return SECTION_WIDTH
    const columns = Math.ceil(s.items.length / ROWS_PER_COLUMN)
    return Math.max(columns * COLUMN_STRIDE - COLUMN_GAP, SECTION_WIDTH)
  })
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) +
    SECTION_GAP * Math.max(sections.length - 1, 0)

  nodes.push({
    id: "root",
    type: NODE_TYPE.root,
    position: { x: totalWidth / 2 - ROOT_WIDTH / 2, y: 0 },
    width: ROOT_WIDTH,
    height: ROOT_HEIGHT,
    draggable: false,
    selectable: false,
    data: {
      total: repos.filter((r) => r.repoName).length,
      onFront: repos.filter((r) => r.state === "front").length,
    } satisfies RootNodeData,
  })

  const sectionY = ROOT_HEIGHT + ROOT_TO_SECTION
  const cardsY = sectionY + SECTION_HEIGHT + SECTION_TO_CARDS

  let x = 0
  sections.forEach((section, i) => {
    const width = widths[i]
    const sectionId = `section:${section.state}`
    const front = section.state === "front"
    const isOpen = open.has(section.state)
    const muted = focused !== null && focused !== section.state

    nodes.push({
      id: sectionId,
      type: NODE_TYPE.section,
      position: { x: x + width / 2 - SECTION_WIDTH / 2, y: sectionY },
      width: SECTION_WIDTH,
      height: SECTION_HEIGHT,
      draggable: false,
      selectable: false,
      data: {
        state: section.state,
        label: section.label,
        count: section.items.length,
        open: isOpen,
        muted,
      } satisfies SectionNodeData,
    })
    edges.push(
      edge(`e:root:${sectionId}`, "root", HANDLE.bottom, sectionId, HANDLE.top, front)
    )

    // An empty category still shows, so it is clear where repos end up.
    if (!isOpen || section.items.length === 0) {
      x += width + SECTION_GAP
      return
    }

    section.items.forEach((repo, index) => {
      const column = Math.floor(index / ROWS_PER_COLUMN)
      const row = index % ROWS_PER_COLUMN
      const columnX = x + column * COLUMN_STRIDE
      const junctionId = `junction:${section.state}:${column}`

      if (row === 0) {
        nodes.push({
          id: junctionId,
          type: NODE_TYPE.junction,
          position: { x: columnX, y: cardsY - SECTION_TO_CARDS / 2 },
          width: 2,
          height: 2,
          draggable: false,
          selectable: false,
          data: {},
        })
        edges.push(
          edge(
            `e:${sectionId}:${junctionId}`,
            sectionId,
            HANDLE.bottom,
            junctionId,
            HANDLE.top,
            front
          )
        )
      }

      const nodeId = repo.key
      nodes.push({
        id: nodeId,
        type: NODE_TYPE.repo,
        position: {
          x: columnX + TRUNK_INDENT,
          y: cardsY + row * (CARD_HEIGHT + ROW_GAP),
        },
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        draggable: false,
        data: {
          repo,
          selected: repo.key === selectedKey,
          dimmed: matches !== null && !matches.has(repo.key),
          muted,
        } satisfies RepoNodeData,
      })
      edges.push(
        edge(
          `e:${junctionId}:${nodeId}`,
          junctionId,
          HANDLE.bottom,
          nodeId,
          HANDLE.left,
          front
        )
      )
    })

    x += width + SECTION_GAP
  })

  return { nodes, edges }
}
