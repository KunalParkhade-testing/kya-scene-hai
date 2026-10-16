import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/lib/types'

const PAGE_SIZE = 20
const topics = [
  ['systems', 'Systems'],
  ['economics', 'Economics'],
  ['culture', 'Culture'],
  ['science', 'Science'],
  ['infrastructure', 'Infrastructure'],
  ['what-if', 'What If?'],
]
const description = 'Browse Kya Scene Hai? stories about systems, economics, culture, science, infrastructure and big questions.'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; page?: string }>
}): Promise<Metadata> {
  const { topic, page: pageParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1
  const query = new URLSearchParams()

  if (topic) query.set('topic', topic)
  if (page > 1) query.set('page', String(page))

  const canonical = `/topics${query.size ? `?${query}` : ''}`

  return {
    title: 'Explore Topics',
    description,
    alternates: { canonical },
    openGraph: {
      title: 'Explore Topics | Kya Scene Hai?',
      description,
      url: `https://kya-scene-hai.vercel.app${canonical}`,
    },
  }
}

export default async function Topics({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; page?: string }>
}) {
  const { topic, page: pageParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const requestedPageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const supabase = await createClient()
  const selection = topic
    ? '*, categories!inner(name,slug)'
    : '*, categories(name,slug)'
  let countQuery = supabase
    .from('articles')
    .select(topic ? 'id, categories!inner(slug)' : 'id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (topic) countQuery = countQuery.eq('categories.slug', topic)

  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  if (requestedPageNumber > Math.max(totalPages, 1)) {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (totalPages) params.set('page', String(totalPages))
    redirect(`/topics${params.size ? `?${params}` : ''}`)
  }
  const page = requestedPageNumber
  let query = supabase
    .from('articles')
    .select(selection)
    .eq('status', 'published')

  if (topic) query = query.eq('categories.slug', topic)

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .order('slug')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) throw error

  const stories = (data ?? []) as Article[]
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (targetPage > 1) params.set('page', String(targetPage))
    return `/topics${params.size ? `?${params}` : ''}`
  }

  return (
    <div className="site">
      <SiteHeader />
      <main className="archive">
        <div className="kicker">Browse by topic</div>
        <h1>GO WHERE<br />CURIOSITY GOES.</h1>
        <div className="topics">
          {topics.map(([slug, name]) => (
            <Link className="topic" href={`/topics?topic=${slug}`} key={slug}>{name}</Link>
          ))}
        </div>
        <div className="grid topic-grid">
          {stories.map((story, index) => (
            <Link className="card" href={`/articles/${story.slug}`} key={story.slug}>
              <div className={`cover ${['blue', 'yellow', 'red'][index % 3]}`}>
                <span className="tag">{story.categories?.name}</span>
                <strong>{story.hero_text}</strong>
              </div>
              <div className="cardbody">
                <h3>{story.title}</h3>
                <p>{story.dek}</p>
              </div>
            </Link>
          ))}
        </div>
        {!stories.length && <div className="empty">Nothing published in this rabbit hole yet.</div>}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Topic story pages">
            {page > 1 ? <Link href={pageHref(page - 1)}>← Newer stories</Link> : <span />}
            <span>Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)}>Older stories →</Link> : <span />}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
