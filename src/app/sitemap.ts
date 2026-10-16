import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/articles` },
    { url: `${SITE_URL}/topics` },
    { url: `${SITE_URL}/about` },
  ]

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')

    if (error || !data) return staticRoutes

    const articleRoutes: MetadataRoute.Sitemap = data
      .filter((article) => Boolean(article.slug))
      .map((article) => {
        const lastModified = article.updated_at || article.published_at
        return {
          url: `${SITE_URL}/articles/${article.slug}`,
          ...(lastModified ? { lastModified } : {}),
        }
      })

    return [...staticRoutes, ...articleRoutes]
  } catch {
    return staticRoutes
  }
}
