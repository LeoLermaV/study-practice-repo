import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function SystemDesignPage() {
  return <Library data={getLibrary()} category="system-design" />
}
