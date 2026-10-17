import type { Metadata } from 'next'
import Link from 'next/link'
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

async function getStories(): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*, categories(name,slug)').eq('status','published').order('published_at',{ascending:false}).limit(6)
  return (data ?? []) as Article[]
}

export default async function Home({ searchParams }: HomeProps){
  const [stories, params] = await Promise.all([getStories(), searchParams])
  const newsletterStatus = params.newsletter
  return <div className="site"><SiteHeader/><header className="hero"><div><div className="kicker">Curiosity, explored.</div><h1>KYA SCENE<br/>HAI?</h1><p className="lede">The stories, systems, culture and ideas shaping the world around us — starting with India, explained in ways that make you want to ask more.</p><Link className="btn" href="#stories">Explore the stories →</Link></div><div className="poster"><div className="speech s1">BUT WHY?</div><div className="speech s2">ACCHA, AISA KYUN?</div><div className="speech s3">AB SCENE SAMAJH AAYA.</div><div className="orb"><div className="eye e1"/><div className="eye e2"/></div></div></header><section id="stories"><div className="sectiontop"><h2>Latest scenes.</h2><p>A growing library of stories that connect the dots, not just deliver the facts.</p></div>{stories.length ? <div className="grid">{stories.map((s,i)=><Link className="card" href={`/articles/${s.slug}`} key={s.slug}><div className={`cover ${['blue','yellow','red'][i%3]}`}><span className="tag">{s.categories?.name}</span><strong>{s.hero_text}</strong></div><div className="cardbody"><h3>{s.title}</h3><p>{s.dek}</p><div className="read">{s.reading_minutes} min read · Read story →</div></div></Link>)}</div> : <div className="empty">The newsroom is warming up. The first live stories will appear here.</div>}</section><section><div className="sectiontop"><h2>Pick a rabbit hole.</h2><p>One curious question can lead you anywhere.</p></div><div className="topics">{['systems','economics','culture','science','infrastructure','what-if'].map((t,i)=><Link className="topic" href={`/topics?topic=${t}`} key={t}>{['Systems','Economics','Culture','Science','Infrastructure','What If?'][i]}</Link>)}</div></section><section><div className="feature"><div className="featuremain"><div className="kicker kicker-yellow">The flagship series</div><h3>WHY INDIA<br/>WORKS LIKE THIS</h3><p>Everyday India looks complicated. This series maps the machinery underneath it.</p></div><div className="featureaside"><div className="kicker">What makes Kya Scene Hai?</div><h3>Don’t stop at what happened. Ask why.</h3><p>Approachable storytelling, serious research, and the questions people actually ask.</p><Link href="/about" className="btn btn-inline">About the project →</Link></div></div></section><section id="newsletter"><div className="newsletter"><div><h2>Get the next scene in your inbox.</h2><p>No spam. Just new stories, research rabbit holes and the occasional “bhai, scene kya hai?”</p></div><div className="newsletterform"><form className="inputrow" action="/api/newsletter" method="post"><input aria-label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required/><button type="submit">Subscribe →</button></form>{newsletterStatus === 'success' ? <p className="newsletter-message newsletter-success" role="status">Thanks for your interest. If we can add this address, we’ll be in touch.</p> : null}{newsletterStatus === 'error' ? <p className="newsletter-message newsletter-error" role="alert">We couldn’t save your subscription just now. Please check your email and try again.</p> : null}</div></div></section><section id="about"><div className="sectiontop"><h2>Understand what’s<br/>behind the obvious.</h2><p>Kya Scene Hai? explores the stories, systems and ideas behind everyday life — with India as our home ground, not our limit. Read our <Link href="/about">editorial philosophy</Link>.</p></div></section><SiteFooter/></div>
}
