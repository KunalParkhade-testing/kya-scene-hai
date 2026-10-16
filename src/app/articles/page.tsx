import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/lib/types'

const PAGE_SIZE = 20
const description = 'Explore stories, systems, culture and ideas shaping the world, starting with India.'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1

  return {
    title: 'Articles & Stories',
    description,
    alternates: { canonical: page > 1 ? `/articles?page=${page}` : '/articles' },
    openGraph: {
      title: 'Articles & Stories | Kya Scene Hai?',
      description,
      url: `https://kya-scene-hai.vercel.app/articles${page > 1 ? `?page=${page}` : ''}`,
    },
  }
}

export default async function Articles({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const requestedPageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (countError) throw countError

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  if (requestedPageNumber > Math.max(totalPages, 1)) {
    redirect(totalPages ? `/articles?page=${totalPages}` : '/articles')
  }
  const page = requestedPageNumber
  const { data, error } = await supabase
    .from('articles')
    .select('*, categories(name,slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('slug')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) throw error

  const stories = (data ?? []) as Article[]

  return (
    <div className="site">
      <SiteHeader />
      <main className="archive">
        <div className="kicker">The archive</div>
        <h1>ALL THE<br />SCENES.</h1>
        <div className="grid">
          {stories.map((story, index) => (
            <Link className="card" href={`/articles/${story.slug}`} key={story.slug}>
              <div className={`cover ${['blue', 'yellow', 'red'][index % 3]}`}>
                <span className="tag">{story.categories?.name}</span>
                <strong>{story.hero_text}</strong>
              </div>
              <div className="cardbody">
                <h3>{story.title}</h3>
                <p>{story.dek}</p>
                <div className="read">{story.reading_minutes} min read · Open story →</div>
              </div>
            </Link>
          ))}
        </div>
        {!stories.length && <div className="empty">No published stories yet.</div>}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Article pages">
            {page > 1 ? <Link href={page === 2 ? '/articles' : `/articles?page=${page - 1}`}>← Newer stories</Link> : <span />}
            <span>Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={`/articles?page=${page + 1}`}>Older stories →</Link> : <span />}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
