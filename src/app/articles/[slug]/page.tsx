import {notFound} from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {createClient} from '@/lib/supabase/server';
import type {Article,ArticleBlock} from '@/lib/types';

export default async function Article({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const supabase=await createClient();
  const {data}=await supabase.from('articles').select('*, categories(name,slug)').eq('slug',slug).eq('status','published').maybeSingle();
  const story=data as Article|null;
  if(!story) notFound();

  return <div className="site">
    <SiteHeader/>
    <main className="article">
      <Link href="/articles" className="back">← Back to archive</Link>
      <div className="kicker article-kicker">{story.categories?.name}</div>
      <h1>{story.title}</h1>
      {story.dek&&<p className="lede">{story.dek}</p>}
      <div className="meta"><span>{story.reading_minutes} min read</span><span>•</span><span>Kya Scene Hai?</span></div>
      {story.hero_image
        ? <img className="articleimage" src={story.hero_image} alt={story.title}/>
        : story.hero_text ? <div className="articlehero yellow"><h2>{story.hero_text}</h2></div> : null}
      <article className="prose">
        {(story.body??[]).map((block:ArticleBlock,i:number)=>{
          if(typeof block==='string') return <p key={i}>{block}</p>;
          if(block.type==='paragraph') return block.text ? <p key={i}>{block.text}</p> : null;
          if(block.type==='heading') return block.text ? <h2 key={i}>{block.text}</h2> : null;
          if(block.type==='quote') return block.text ? <blockquote key={i}>{block.text}</blockquote> : null;
          if(block.type==='callout') return block.text ? <div className="articlecallout" key={i}>{block.text}</div> : null;
          if(block.type==='image'&&block.url) return <figure key={i}><img className="articleimage" src={block.url} alt={block.alt||''}/>{block.alt&&<figcaption>{block.alt}</figcaption>}</figure>;
          return null;
        })}
      </article>
    </main>
    <SiteFooter/>
  </div>;
}
