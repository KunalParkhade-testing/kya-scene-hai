import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/server'
import type { Series } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Series',
  description: 'Explore connected story collections from Kya Scene Hai?',
  alternates: { canonical: '/series' },
}

export default async function SeriesIndex() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('series').select('id,slug,name,description,is_featured').order('name')
  if (error) throw error

  const series = (data ?? []) as Series[]
  return (
    <div className="site">
      <SiteHeader />
      <main className="archive">
        <div className="kicker">Explore connected stories</div>
        <h1>FOLLOW A<br />SERIES.</h1>
        {series.length ? (
          <div className="series-grid">
            {series.map(item => (
              <Link className="series-card" href={`/series/${item.slug}`} key={item.id}>
                <span className="kicker">{item.is_featured ? 'Featured series' : 'Story series'}</span>
                <h2>{item.name}</h2>
                {item.description && <p>{item.description}</p>}
                <span className="series-card-link">Explore series →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">No series have been published yet. Check back soon.</div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
