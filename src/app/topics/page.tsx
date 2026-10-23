import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import StoryCard from '@/components/StoryCard'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/lib/types'

const PAGE_SIZE = 20
const cardColors = ['blue', 'yellow', 'red'] as const
type TopicStory = Pick<Article, 'slug' | 'title' | 'dek' | 'hero_text' | 'hero_image' | 'reading_minutes' | 'published_at'> & {
  categories?: { name: string; slug: string }[] | null
}
const topics = [
  ['systems', 'Systems'],
  ['economics', 'Economics'],
  ['culture', 'Culture'],
  ['science', 'Science'],
  ['infrastructure', 'Infrastructure'],
  ['what-if', 'What If?'],
  ['politics', 'Politics'],
]
const description = 'Browse Kya Scene Hai? stories about systems, politics, economics, culture, science, infrastructure and big questions.'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; page?: string; sort?: string }>
}): Promise<Metadata> {
  const { topic, page: pageParam, sort: sortParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1
  const sort = sortParam === 'oldest' ? 'oldest' : 'newest'
  const query = new URLSearchParams()

  if (topic) query.set('topic', topic)
  if (sort === 'oldest') query.set('sort', sort)
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
  searchParams: Promise<{ topic?: string; page?: string; sort?: string }>
}) {
  const { topic, page: pageParam, sort: sortParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const requestedPageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const sort = sortParam === 'oldest' ? 'oldest' : 'newest'
  const supabase = await createClient()
  const selection = topic
    ? 'slug,title,dek,hero_text,hero_image,reading_minutes,published_at,categories!inner(name,slug)'
    : 'slug,title,dek,hero_text,hero_image,reading_minutes,published_at,categories(name,slug)'
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
    if (sort === 'oldest') params.set('sort', sort)
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
    .order('published_at', { ascending: sort === 'oldest', nullsFirst: false })
    .order('slug')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) throw error

  const stories = (data ?? []) as TopicStory[]
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (sort === 'oldest') params.set('sort', sort)
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
            <Link className="topic" href={`/topics?topic=${slug}${sort === 'oldest' ? '&sort=oldest' : ''}`} key={slug}>{name}</Link>
          ))}
        </div>
        <form className="sort-control" action="/topics" method="get">
          {topic && <input type="hidden" name="topic" value={topic} />}
          <label htmlFor="topic-sort">Sort stories</label>
          <select id="topic-sort" name="sort" defaultValue={sort}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button type="submit">Apply</button>
        </form>
        <div className="grid topic-grid">
          {stories.map((story, index) => (
            <StoryCard key={story.slug} story={story} color={cardColors[index % cardColors.length]} />
          ))}
        </div>
        {!stories.length && <div className="empty">Nothing published in this rabbit hole yet.</div>}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Topic story pages">
            {page > 1 ? <Link href={pageHref(page - 1)}>{sort === 'oldest' ? '← Older stories' : '← Newer stories'}</Link> : <span />}
            <span>Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)}>{sort === 'oldest' ? 'Newer stories →' : 'Older stories →'}</Link> : <span />}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
