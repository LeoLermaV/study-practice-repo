import { getTopicFiles } from '@/lib/content/fs'
import { TopicPageContent } from '@/components/topic/TopicPageContent'

export function generateStaticParams() {
  return getTopicFiles('ddia').map((f) => ({ slug: f.slug }))
}

export default async function DdiaTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TopicPageContent category="ddia" slug={slug} />
}
