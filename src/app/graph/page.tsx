'use client'

import dynamic from 'next/dynamic'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then((m) => m.GraphCanvas),
  { ssr: false }
)

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-6rem)] w-full">
      <GraphCanvas />
    </div>
  )
}
