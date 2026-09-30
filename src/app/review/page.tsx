import type { Metadata } from 'next'
import { ReviewList } from '@/components/review/ReviewList'
import { getLibrary } from '@/lib/content/library'

export const metadata: Metadata = { title: 'Review · FAANG Study' }

export default function ReviewPage() {
  return <ReviewList data={getLibrary()} />
}
