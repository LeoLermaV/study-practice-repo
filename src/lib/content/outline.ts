export interface OutlineItem {
  id: string
  text: string
  depth: 2 | 3
}

/** The subset of an mdast node this plugin reads and writes. */
interface MdNode {
  type: string
  depth?: number
  value?: string
  children?: MdNode[]
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>
}

export function headingSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'section'
}

function textOf(node: MdNode): string {
  if ((node.type === 'text' || node.type === 'inlineCode') && typeof node.value === 'string') return node.value
  return (node.children ?? []).map(textOf).join('')
}

/**
 * Remark plugin factory: gives every heading a unique id (so it can be linked
 * and scrolled to) and records h2/h3 headings into `out` for the outline.
 */
export function remarkOutline(out: OutlineItem[]) {
  return () => (tree: MdNode) => {
    const used = new Set<string>()
    const visit = (node: MdNode) => {
      if (node.type === 'heading') {
        const text = textOf(node).trim()
        if (!text) return
        const base = headingSlug(text)
        let id = base
        for (let n = 1; used.has(id); n++) id = `${base}-${n}`
        used.add(id)
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
        if (node.depth === 2 || node.depth === 3) out.push({ id, text, depth: node.depth })
        return
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}
