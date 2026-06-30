import { getTopicFiles } from '@/lib/content/fs'
import { TopicPageContent } from '@/components/topic/TopicPageContent'

export function generateStaticParams() {
  return getTopicFiles('system-design').map((f) => ({ slug: f.slug }))
}

export default async function SystemDesignTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TopicPageContent category="system-design" slug={slug} />
}
