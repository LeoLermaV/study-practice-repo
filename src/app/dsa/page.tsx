import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function DsaPage() {
  return <Library data={getLibrary()} category="dsa" />
}
