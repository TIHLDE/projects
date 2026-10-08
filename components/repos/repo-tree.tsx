"use client"

import "@xyflow/react/dist/style.css"

import { useMemo, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from "@xyflow/react"
import { AlertTriangle, Network, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { TreeRepo } from "@/lib/repo-tree"
import type { TihldeMember } from "@/lib/tihlde"
import {
  buildRepoTree,
  NODE_TYPE,
  type RepoNodeData,
} from "@/lib/repo-tree-layout"
import {
  JunctionNode,
  RepoNode,
  RootNode,
  SECTION_STYLE,
  SectionNode,
} from "@/components/repos/tree-nodes"
import { RepoSheet } from "@/components/repos/repo-sheet"

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
  const { fitView } = useReactFlow()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return new Set(repos.filter((r) => matchesQuery(r, q)).map((r) => r.key))
  }, [repos, query])

  const { nodes, edges } = useMemo(
    () => buildRepoTree(repos, selectedKey, matches),
    [repos, selectedKey, matches]
  )

  const selected = repos.find((r) => r.key === selectedKey) ?? null

  function zoomToMatches() {
    if (!matches || matches.size === 0) return
    fitView({
      nodes: [...matches].map((id) => ({ id })),
      duration: 600,
      padding: 0.4,
      maxZoom: 1.2,
    })
  }

  return (
    <div className="repo-tree relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node: Node) => {
          if (node.type === NODE_TYPE.repo) setSelectedKey(node.id)
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--tree-edge)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeBorderRadius={6}
          nodeColor={(node) =>
            node.type === NODE_TYPE.repo
              ? SECTION_STYLE[(node.data as RepoNodeData).repo.state].minimap
              : "transparent"
          }
          maskColor="rgb(0 0 0 / 0.04)"
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
                  Klikk på et repo for å sette folk på det
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") zoomToMatches()
                  if (e.key === "Escape") {
                    setQuery("")
                    fitView({ duration: 600, padding: 0.15 })
                  }
                }}
                placeholder="Søk på repo, språk eller person…"
                className="pl-8"
              />
            </div>
            {matches && (
              <p className="text-xs text-muted-foreground">
                {matches.size === 0
                  ? "Ingen treff"
                  : `${matches.size} treff · Enter for å zoome inn`}
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
