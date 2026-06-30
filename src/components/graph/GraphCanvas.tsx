'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TopicNode, type TopicNodeData } from './TopicNode'

const CATEGORY_COLORS: Record<string, string> = {
  'system-design': '#3b82f6',
  dsa: '#10b981',
  ddia: '#8b5cf6',
  'cs-fundamentals': '#64748b',
  behavioral: '#f59e0b',
}

const CATEGORY_LABELS: Record<string, string> = {
  'system-design': 'System Design',
  dsa: 'DS&A',
  ddia: 'DDIA',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
}

const CATEGORY_ORDER = ['behavioral', 'cs-fundamentals', 'system-design', 'dsa', 'ddia']

const COL_WIDTH = 200
const ROW_HEIGHT = 55
const GAP_X = 40
const PADDING = 50
const MAX_ROWS = 60

interface RawTopicMeta {
  slug: string
  title: string
  category: string
  difficulty: string
}

interface RawGraphEdge {
  source: string
  target: string
  type: string
}

interface RawGraphData {
  nodes: RawTopicMeta[]
  edges: RawGraphEdge[]
}

function computeNodes(topics: RawTopicMeta[]): Node<TopicNodeData>[] {
  const byCategory: Record<string, RawTopicMeta[]> = {}
  for (const t of topics) {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  }

  const result: Node<TopicNodeData>[] = []
  let x = PADDING

  for (const cat of CATEGORY_ORDER) {
    const catNodes = byCategory[cat] ?? []
    if (catNodes.length === 0) continue

    catNodes.sort((a, b) => {
      const order = { beginner: 0, intermediate: 1, advanced: 2 }
      return (order[a.difficulty as keyof typeof order] ?? 0) -
             (order[b.difficulty as keyof typeof order] ?? 0)
    })

    for (let i = 0; i < catNodes.length; i++) {
      const col = Math.floor(i / MAX_ROWS)
      const row = i % MAX_ROWS
      const n = catNodes[i]
      result.push({
        id: n.slug,
        type: 'topic',
        position: {
          x: x + col * (COL_WIDTH + 10),
          y: PADDING + row * ROW_HEIGHT,
        },
        data: {
          slug: n.slug,
          title: n.title,
          category: n.category,
          difficulty: n.difficulty,
          color: CATEGORY_COLORS[n.category] ?? '#666',
        },
      })
    }

    const numCols = Math.ceil(catNodes.length / MAX_ROWS)
    x += numCols * (COL_WIDTH + 10) + GAP_X
  }

  return result
}

function computeEdges(raw: RawGraphData, nodeIds: Set<string>): Edge[] {
  return raw.edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      style: {
        stroke: e.type === 'prerequisite' ? '#666' : '#999',
        strokeWidth: e.type === 'prerequisite' ? 1.5 : 1,
        strokeDasharray: e.type === 'prerequisite' ? 'none' : '4 4',
      },
      animated: e.type === 'prerequisite',
    }))
}

export function GraphCanvas() {
  const router = useRouter()
  const [raw, setRaw] = useState<RawGraphData | null>(null)
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(CATEGORY_ORDER)
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/topics-graph.json')
      .then((r) => r.json())
      .then((data: RawGraphData) => setRaw(data))
      .catch(() => setRaw(null))
      .finally(() => setLoading(false))
  }, [])

  const allNodes = useMemo(() => {
    if (!raw) return []
    return computeNodes(raw.nodes)
  }, [raw])

  const allEdges = useMemo(() => {
    if (!raw) return []
    return computeEdges(raw, new Set(allNodes.map((n) => n.id)))
  }, [raw, allNodes])

  const filteredNodes = useMemo(
    () => allNodes.filter((n) => activeCategories.has(n.data.category)),
    [allNodes, activeCategories]
  )

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  )

  const filteredEdges = useMemo(
    () => allEdges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [allEdges, filteredNodeIds]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges)

  useEffect(() => setNodes(filteredNodes), [filteredNodes, setNodes])
  useEffect(() => setEdges(filteredEdges), [filteredEdges, setEdges])

  const nodeTypes = useMemo(() => ({ topic: TopicNode }), [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<TopicNodeData>) => {
      router.push(`/${node.data.category}/${node.data.slug}`)
    },
    [router]
  )

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading graph...
      </div>
    )
  }

  if (!raw) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Could not load topic graph data.
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {CATEGORY_ORDER.map((cat) => {
          const active = activeCategories.has(cat)
          const color = CATEGORY_COLORS[cat] ?? '#666'
          const count = allNodes.filter((n) => n.data.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200"
              style={{
                backgroundColor: active ? `${color}18` : 'transparent',
                color: active ? '#ffffff' : '#999999',
                border: `1px solid ${active ? color : '#333'}`,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {CATEGORY_LABELS[cat] ?? cat}
              <span className="opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={3}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              const d = (node as Node<TopicNodeData>).data
              return d ? CATEGORY_COLORS[d.category] ?? '#666' : '#666'
            }}
            style={{ width: 180, height: 120 }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
