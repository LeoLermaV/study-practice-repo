import { Library } from '@/components/library/Library'
import { getLibrary } from '@/lib/content/library'

export default function HomePage() {
  return <Library data={getLibrary()} category={null} />
}
