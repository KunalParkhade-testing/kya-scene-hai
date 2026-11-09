import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/seo'

const PAGE_SIZE = 1000

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/articles` },
    { url: `${SITE_URL}/topics` },
    { url: `${SITE_URL}/series` },
    { url: `${SITE_URL}/about` },
  ]
  const articleRoutes: MetadataRoute.Sitemap = []
  const seriesRoutes: MetadataRoute.Sitemap = []

  try {
    const supabase = await createClient()
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('articles')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('slug')
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        console.error('Failed to load published articles for sitemap:', error)
        break
      }
      if (!data?.length) break

      articleRoutes.push(
        ...data
          .filter((article) => Boolean(article.slug))
          .map((article) => {
            const lastModified = article.updated_at || article.published_at
            return {
              url: `${SITE_URL}/articles/${article.slug}`,
              ...(lastModified ? { lastModified } : {}),
            }
          }),
      )

      if (data.length < PAGE_SIZE) break
    }

    const { data: series, error: seriesError } = await supabase.from('series').select('slug').order('slug')
    if (seriesError) {
      console.error('Failed to load series for sitemap:', seriesError)
    } else {
      seriesRoutes.push(
        ...(series ?? [])
          .filter((item) => Boolean(item.slug))
          .map((item) => ({ url: `${SITE_URL}/series/${item.slug}` })),
      )
    }

    return [...staticRoutes, ...articleRoutes, ...seriesRoutes]
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    return [...staticRoutes, ...articleRoutes, ...seriesRoutes]
  }
}
