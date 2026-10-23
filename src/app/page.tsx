import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/lib/types'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

type HomeProps = { searchParams: Promise<{ newsletter?: string }> }
type TopicSlug = 'systems' | 'economics' | 'culture' | 'science' | 'infrastructure' | 'what-if'
type HomepageStory = Pick<Article, 'id' | 'slug' | 'title' | 'dek' | 'hero_text' | 'hero_image' | 'is_featured' | 'reading_minutes' | 'published_at'> & {
  categories?: { name: string; slug: string }[] | null
}

const topicCards: { slug: TopicSlug; name: string; icon: 'systems' | 'economics' | 'culture' | 'science' | 'infrastructure' | 'what-if' }[] = [
  { slug: 'systems', name: 'Systems', icon: 'systems' },
  { slug: 'economics', name: 'Economics', icon: 'economics' },
  { slug: 'culture', name: 'Culture', icon: 'culture' },
  { slug: 'science', name: 'Science', icon: 'science' },
  { slug: 'infrastructure', name: 'Infrastructure', icon: 'infrastructure' },
  { slug: 'what-if', name: 'What if?', icon: 'what-if' },
]

async function getStories(): Promise<HomepageStory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('id,slug,title,dek,hero_text,hero_image,is_featured,reading_minutes,published_at,categories(name,slug)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(5)
  if (error) throw error
  return (data ?? []) as HomepageStory[]
}

async function getTopicCounts(): Promise<Record<TopicSlug, number>> {
  const supabase = await createClient()
  const results = await Promise.all(topicCards.map(async ({ slug }) => {
    const { count, error } = await supabase
      .from('articles')
      .select('id, categories!inner(slug)', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('categories.slug', slug)
    if (error) throw error
    return [slug, count ?? 0] as const
  }))
  return Object.fromEntries(results) as Record<TopicSlug, number>
}

function formatPublishedDate(date: string | null) {
  if (!date) return null
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}

export default async function Home({ searchParams }: HomeProps) {
  const [stories, topicCounts, params] = await Promise.all([getStories(), getTopicCounts(), searchParams])
  const newsletterStatus = params.newsletter
  const selectedStory = stories.find(story => story.is_featured)
  const featuredStory = selectedStory ?? stories[0]
  const featuredLabel = selectedStory ? 'Featured story' : 'Latest story'
  const otherStories = stories.filter(story => story.id !== featuredStory?.id)

  return (
    <div className="site">
      <SiteHeader />
      <header className="hero">
        <div>
          <div className="kicker">Curiosity, explored.</div>
          <h1>KYA SCENE<br />HAI?</h1>
          <p className="lede">The stories, systems, culture and ideas shaping the world around us — starting with India, explained in ways that make you want to ask more.</p>
          <div className="hero-actions">
            <Link className="btn" href="#stories">Explore the stories →</Link>
            <Link className="btn btn-secondary" href="#topics">Start with a question →</Link>
          </div>
        </div>
        <div className="poster">
          <div className="speech s1">BUT WHY?</div>
          <div className="speech s2">ACCHA, AISA KYUN?</div>
          <div className="speech s3">AB SCENE SAMAJH AAYA.</div>
          <div className="orb"><div className="eye e1" /><div className="eye e2" /></div>
        </div>
      </header>

      {featuredStory ? (
        <section className="featured-section" aria-labelledby="featured-heading">
          <div id="featured-heading" className="kicker featured-section-label">{featuredLabel}</div>
          <Link className="featured-story" href={`/articles/${featuredStory.slug}`}>
            <div className="featured-story-visual">
              {featuredStory.hero_image ? (
                <Image
                  className="featured-story-image"
                  src={featuredStory.hero_image}
                  alt=""
                  width={1200}
                  height={630}
                  priority
                  unoptimized
                />
              ) : (
                <div className="featured-story-illustration yellow">
                  <strong>{featuredStory.hero_text || featuredStory.title}</strong>
                </div>
              )}
            </div>
            <div className="featured-story-copy">
              {featuredStory.categories?.[0]?.name && <span className="featured-story-category">{featuredStory.categories[0].name}</span>}
              <h2>{featuredStory.title}</h2>
              {featuredStory.dek && <p>{featuredStory.dek}</p>}
              <div className="featured-story-meta">
                <span className="read-time">{featuredStory.reading_minutes ?? '—'} min read</span>
                {formatPublishedDate(featuredStory.published_at) && <><span aria-hidden="true">·</span><time dateTime={featuredStory.published_at ?? undefined}>{formatPublishedDate(featuredStory.published_at)}</time></>}
                <span className="featured-story-read">Read story →</span>
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      <section id="stories" className="latest-section" aria-labelledby="latest-heading">
        <div className="sectiontop">
          <div>
            <h2 id="latest-heading">Latest scenes.</h2>
            <p>A growing library of stories that connect the dots, not just deliver the facts.</p>
          </div>
          <Link className="stories-all-link" href="/articles">View all stories →</Link>
        </div>
        {otherStories.length > 0 ? (
          <div className="grid latest-story-grid">
            {otherStories.map((story, index) => (
              <Link className="card latest-story-card" href={`/articles/${story.slug}`} key={story.slug}>
                <div className={`cover ${['blue', 'yellow', 'red', 'blue'][index % 4]}`}>
                  {story.hero_image ? (
                    <Image
                      className="latest-story-image"
                      src={story.hero_image}
                      alt=""
                      width={600}
                      height={315}
                      unoptimized
                    />
                  ) : null}
                  {story.categories?.[0]?.name && <span className="tag">{story.categories[0].name}</span>}
                  {!story.hero_image && <strong>{story.hero_text || story.title}</strong>}
                </div>
                <div className="cardbody">
                  <h3>{story.title}</h3>
                  {story.dek && <p>{story.dek}</p>}
                  <div className="latest-story-meta">
                    <span className="read-time">{story.reading_minutes ?? '—'} min read</span>
                    {formatPublishedDate(story.published_at) && <time dateTime={story.published_at ?? undefined}>{formatPublishedDate(story.published_at)}</time>}
                    <span className="latest-story-arrow" aria-label="Read story">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="empty">The newsroom is warming up. The first live stories will appear here.</div>
        ) : null}
      </section>

      <section id="topics" className="topics-section">
        <div className="sectiontop">
          <h2>Pick a rabbit hole.</h2>
          <p>One curious question can lead you anywhere.</p>
        </div>
        <div className="topic-tiles">
          {topicCards.map(({ slug, name, icon }) => (
            <Link className={`topic-tile topic-tile-${icon}`} href={`/topics?topic=${slug}`} key={slug}>
              <svg className="topic-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {icon === 'systems' && <><path d="M12 3.2 14 4l1.5-.8 1.8 1.8-.8 1.5.8 2 .0 0 1.6 1v2.6l-1.6 1-.8 2 .8 1.5-1.8 1.8-1.5-.8-2 .8-1 1.6H8.4l-1-1.6-2-.8-1.5.8-1.8-1.8.8-1.5-.8-2-1.6-1v-2.6l1.6-1 .8-2-.8-1.5 1.8-1.8 1.5.8 2-.8 1-1.6H11z" transform="translate(2 0) scale(.84)"/><circle cx="12" cy="12" r="2.5" /></>}
                {icon === 'economics' && <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3 .8 0 1.6-.1 2.3-.2M5 14v4c0 1.7 3.1 3 7 3M16 14v6m-3-3h6"/></>}
                {icon === 'culture' && <><circle cx="9" cy="8" r="3"/><path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19zM16 5.5a3 3 0 0 1 0 5.8m1.5 2a5 5 0 0 1 3 4.6V19h-3"/></>}
                {icon === 'science' && <><path d="M9 3h6m-5 0v6l-5.3 9.1A1.9 1.9 0 0 0 6.3 21h11.4a1.9 1.9 0 0 0 1.6-2.9L14 9V3M8 16h8"/><circle cx="11" cy="13" r=".7"/><circle cx="14" cy="18" r=".7"/></>}
                {icon === 'infrastructure' && <><path d="M3 20V8l3 3 3-3v12M15 20V8l3 3 3-3v12M2 20h20M6 11v9m12-9v9M8 5l4-3 4 3M12 2v7"/></>}
                {icon === 'what-if' && <><path d="M20.5 11.5a4.5 4.5 0 0 0-4.4-4.5A6 6 0 0 0 5 9a4.5 4.5 0 0 0 .5 9H17a3.5 3.5 0 0 0 3.5-3.5 3.8 3.8 0 0 0-.8-2.3"/><path d="M12 11v5m0 2h.01"/></>}
              </svg>
              <span className="topic-tile-copy">
                <strong>{name}</strong>
                <span>{topicCounts[slug]} {topicCounts[slug] === 1 ? 'story' : 'stories'}</span>
              </span>
              <span className="topic-tile-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <div className="topics-more-wrap">
          <Link className="topics-more-link" href="/topics">Show more topics <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section>
        <div className="feature">
          <div className="featuremain">
            <div className="kicker kicker-yellow">The flagship series</div>
            <h3>WHY INDIA<br />WORKS LIKE THIS</h3>
            <p>Everyday India looks complicated. This series maps the machinery underneath it.</p>
          </div>
          <div className="featureaside">
            <div className="kicker">What makes Kya Scene Hai?</div>
            <h3>Don’t stop at what happened. Ask why.</h3>
            <p>Approachable storytelling, serious research, and the questions people actually ask.</p>
            <Link href="/about" className="btn btn-inline">About the project →</Link>
          </div>
        </div>
      </section>

      <section id="newsletter">
        <div className="newsletter">
          <div>
            <h2>Get the next scene in your inbox.</h2>
            <p>No spam. Just new stories, research rabbit holes and the occasional “bhai, scene kya hai?”</p>
          </div>
          <div className="newsletterform">
            <form className="inputrow" action="/api/newsletter" method="post">
              <input aria-label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
              <button type="submit">Subscribe →</button>
            </form>
            {newsletterStatus === 'success' ? <p className="newsletter-message newsletter-success" role="status">Thanks for your interest. If we can add this address, we’ll be in touch.</p> : null}
            {newsletterStatus === 'error' ? <p className="newsletter-message newsletter-error" role="alert">We couldn’t save your subscription just now. Please check your email and try again.</p> : null}
          </div>
        </div>
      </section>

      <section id="about">
        <div className="sectiontop">
          <h2>Understand what’s<br />behind the obvious.</h2>
          <p>Kya Scene Hai? explores the stories, systems and ideas behind everyday life — with India as our home ground, not our limit. Read our <Link href="/about">editorial philosophy</Link>.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
