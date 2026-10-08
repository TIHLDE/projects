"use client"

import "@xyflow/react/dist/style.css"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from "@xyflow/react"
import { AlertTriangle, Network, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { RepoState, TreeRepo } from "@/lib/repo-tree"
import type { TihldeMember } from "@/lib/tihlde"
import {
  buildRepoTree,
  NODE_TYPE,
  type SectionNodeData,
} from "@/lib/repo-tree-layout"
import {
  JunctionNode,
  RepoNode,
  RootNode,
  SectionNode,
} from "@/components/repos/tree-nodes"
import { RepoSheet } from "@/components/repos/repo-sheet"

const FIT_VIEW = { padding: 0.12, maxZoom: 1 } as const

const nodeTypes = {
  [NODE_TYPE.root]: RootNode,
  [NODE_TYPE.section]: SectionNode,
  [NODE_TYPE.junction]: JunctionNode,
  [NODE_TYPE.repo]: RepoNode,
}

type Props = {
  repos: TreeRepo[]
  candidates: TihldeMember[]
  viewerId: string
  warning: string | null
}

export function RepoTree(props: Props) {
  return (
    <ReactFlowProvider>
      <RepoTreeCanvas {...props} />
    </ReactFlowProvider>
  )
}

function matchesQuery(repo: TreeRepo, q: string) {
  if (repo.name.toLowerCase().includes(q)) return true
  if (repo.description?.toLowerCase().includes(q)) return true
  if (repo.language?.toLowerCase().includes(q)) return true
  return (repo.project?.members ?? []).some(
    (m) =>
      m.name?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q)
  )
}

function RepoTreeCanvas({ repos, candidates, viewerId, warning }: Props) {
  const router = useRouter()
  const { fitView } = useReactFlow()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<ReadonlySet<RepoState>>(
    () => new Set(["front"])
  )
  const [focused, setFocused] = useState<RepoState | null>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return new Set(repos.filter((r) => matchesQuery(r, q)).map((r) => r.key))
  }, [repos, query])

  // A search opens every category it finds something in, without closing
  // the ones already open.
  function search(next: string) {
    setQuery(next)
    const q = next.trim().toLowerCase()
    if (!q) return
    const found = repos.filter((r) => matchesQuery(r, q)).map((r) => r.state)
    if (found.some((state) => !open.has(state))) {
      setOpen((prev) => new Set([...prev, ...found]))
    }
  }

  const { nodes, edges } = useMemo(
    () => buildRepoTree(repos, { selectedKey, matches, open, focused }),
    [repos, selectedKey, matches, open, focused]
  )

  // The tree cannot be moved by hand, so it is refitted whenever its shape
  // changes and whenever the window does.
  const shape = [...open].sort().join(",") + `:${repos.length}`
  useEffect(() => {
    // A timer rather than an animation frame: frames are paused while the
    // tab is in the background, and the tree would stay unfitted.
    const timer = setTimeout(() => fitView({ ...FIT_VIEW, duration: 400 }))
    return () => clearTimeout(timer)
  }, [shape, fitView])

  useEffect(() => {
    const onResize = () => fitView(FIT_VIEW)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [fitView])

  function toggleSection(state: RepoState) {
    if (open.has(state)) {
      setOpen((prev) => {
        const next = new Set(prev)
        next.delete(state)
        return next
      })
      setFocused((prev) => (prev === state ? null : prev))
    } else {
      setOpen((prev) => new Set(prev).add(state))
      setFocused(state)
    }
  }

  const selected = repos.find((r) => r.key === selectedKey) ?? null

  return (
    <div className="repo-tree relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        fitView
        fitViewOptions={FIT_VIEW}
        minZoom={0.1}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node: Node) => {
          if (node.type === NODE_TYPE.repo) setSelectedKey(node.id)
          if (node.type === NODE_TYPE.section) {
            const { state } = node.data as SectionNodeData
            // The front page has its own view; its repos stay open here.
            if (state === "front") router.push("/dashboard")
            else toggleSection(state)
          }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--tree-edge)"
        />
        <Panel position="top-left" className="!m-6">
          <div className="flex w-80 flex-col gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">Repotre</h1>
                <p className="text-xs text-muted-foreground">
                  Åpne en kategori, og klikk på et repo for å sette folk på det
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => search(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") search("")
                }}
                placeholder="Søk på repo, språk eller person…"
                className="pl-8"
              />
            </div>
            {matches && (
              <p className="text-xs text-muted-foreground">
                {matches.size === 0
                  ? "Ingen treff"
                  : `${matches.size} treff`}
              </p>
            )}
          </div>
        </Panel>

        {warning && (
          <Panel position="top-right" className="!m-6">
            <div className="flex max-w-sm items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <RepoSheet
        repo={selected}
        candidates={candidates}
        viewerId={viewerId}
        onClose={() => setSelectedKey(null)}
      />
    </div>
  )
}
