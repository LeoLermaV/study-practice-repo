import { Handle, Position, type NodeProps } from '@xyflow/react'

export type TopicNodeData = {
  slug: string
  title: string
  category: string
  difficulty: string
  color: string
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
}

export function TopicNode(props: NodeProps) {
  const data = props.data as unknown as TopicNodeData
  const diffColor = difficultyColors[data.difficulty] ?? 'bg-gray-500'

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div
        className="flex items-center gap-2 rounded-lg border-2 bg-card px-3 py-2 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
        style={{ borderColor: data.color, minWidth: 140, maxWidth: 180 }}
      >
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="truncate text-xs font-medium leading-tight">
          {data.title}
        </span>
        <span className={`ml-auto inline-block h-1.5 w-1.5 shrink-0 rounded-full ${diffColor}`} />
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
}
