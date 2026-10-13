import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/articles`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/topics`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
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
      .map((article) => ({
        url: `${SITE_URL}/articles/${article.slug}`,
        lastModified: article.updated_at || article.published_at || now,
        changeFrequency: 'monthly',
        priority: 0.8,
      }))

    return [...staticRoutes, ...articleRoutes]
  } catch {
    return staticRoutes
  }
}
