import { getTopicFiles } from '@/lib/content/fs'
import { TopicPageContent } from '@/components/topic/TopicPageContent'

export function generateStaticParams() {
  return getTopicFiles('dsa').map((f) => ({ slug: f.slug }))
}

export default async function DsaTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TopicPageContent category="dsa" slug={slug} />
}
