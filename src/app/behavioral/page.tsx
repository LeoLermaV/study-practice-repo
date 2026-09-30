import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function BehavioralPage() {
  return <Library data={getLibrary()} category="behavioral" />
}
