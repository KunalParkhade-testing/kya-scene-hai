import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import StoryCard from '@/components/StoryCard'
import { createClient } from '@/lib/supabase/server'
import type { Article, Series } from '@/lib/types'

const cardColors = ['blue', 'yellow', 'red'] as const
type SeriesStory = Pick<Article, 'slug' | 'title' | 'dek' | 'hero_text' | 'hero_image' | 'reading_minutes' | 'published_at'> & {
  categories?: { name: string; slug: string }[] | null
}

async function getSeries(slug: string): Promise<Series | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('series')
    .select('id,slug,name,description,is_featured')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Series | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const series = await getSeries(slug)
  if (!series) return { title: 'Series not found' }
  const description = series.description || `Read stories in the ${series.name} series.`
  return {
    title: series.name,
    description,
    alternates: { canonical: `/series/${series.slug}` },
    openGraph: { title: `${series.name} | Kya Scene Hai?`, description },
  }
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const series = await getSeries(slug)
  if (!series) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('slug,title,dek,hero_text,hero_image,reading_minutes,published_at,categories(name,slug)')
    .eq('status', 'published')
    .eq('series_id', series.id)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('slug')
  if (error) throw error
  const stories = (data ?? []) as SeriesStory[]

  return (
    <div className="site">
      <SiteHeader />
      <main className="archive">
        <div className="kicker">{series.is_featured ? 'Featured series' : 'Story series'}</div>
        <h1>{series.name}</h1>
        {series.description && <p className="lede">{series.description}</p>}
        <div className="grid topic-grid">
          {stories.map((story, index) => (
            <StoryCard key={story.slug} story={story} color={cardColors[index % cardColors.length]} />
          ))}
        </div>
        {!stories.length && <div className="empty">No published stories in this series yet.</div>}
      </main>
      <SiteFooter />
    </div>
  )
}
