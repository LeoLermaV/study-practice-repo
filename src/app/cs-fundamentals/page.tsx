import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function CsFundamentalsPage() {
  return <Library data={getLibrary()} category="cs-fundamentals" />
}
