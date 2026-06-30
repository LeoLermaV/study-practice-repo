import { getTopicFiles } from '@/lib/content/fs'
import { TopicPageContent } from '@/components/topic/TopicPageContent'

export function generateStaticParams() {
  return getTopicFiles('cs-fundamentals').map((f) => ({ slug: f.slug }))
}

export default async function CsFundamentalsTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TopicPageContent category="cs-fundamentals" slug={slug} />
}
