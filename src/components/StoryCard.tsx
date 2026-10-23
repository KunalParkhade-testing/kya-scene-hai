import Image from 'next/image'
import Link from 'next/link'
import type { Article } from '@/lib/types'

type StoryCardArticle = Pick<Article, 'slug' | 'title' | 'dek' | 'hero_text' | 'hero_image' | 'reading_minutes' | 'published_at'> & {
  categories?: { name: string; slug: string }[] | { name: string; slug: string } | null
}

type StoryCardProps = {
  story: StoryCardArticle
  color: 'blue' | 'yellow' | 'red'
}

function getCategoryName(categories: StoryCardArticle['categories']) {
  return Array.isArray(categories) ? categories[0]?.name : categories?.name
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

export default function StoryCard({ story, color }: StoryCardProps) {
  const categoryName = getCategoryName(story.categories)
  const publishedDate = formatPublishedDate(story.published_at)

  return (
    <Link className="card archive-story-card" href={`/articles/${story.slug}`}>
      <div className={`cover ${color}`}>
        {story.hero_image ? (
          <Image
            className="archive-story-image"
            src={story.hero_image}
            alt=""
            width={600}
            height={315}
            unoptimized
          />
        ) : (
          <strong>{story.hero_text || story.title}</strong>
        )}
        {categoryName && <span className="tag">{categoryName}</span>}
      </div>
      <div className="cardbody">
        <h3>{story.title}</h3>
        {story.dek && <p>{story.dek}</p>}
        <div className="archive-story-meta">
          <span>{story.reading_minutes ?? '—'} min read</span>
          {publishedDate && <time dateTime={story.published_at ?? undefined}>{publishedDate}</time>}
          <span className="archive-story-arrow" aria-label="Open story">→</span>
        </div>
      </div>
    </Link>
  )
}
