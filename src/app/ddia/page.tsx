import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function DdiaPage() {
  return <Library data={getLibrary()} category="ddia" />
}
