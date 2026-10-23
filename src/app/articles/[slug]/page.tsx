import * as React from 'react';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CodeBlockDisplay from '@/components/CodeBlockDisplay';
import ArticleContentsNav from '@/components/ArticleContentsNav';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import ArticleShare from '@/components/ArticleShare';
import {createClient} from '@/lib/supabase/server';
import type {Article,ArticleBlock} from '@/lib/types';



const TIPTAP_PREFIX = '__TIPTAP_JSON__:'
const highlightClass: Record<string, string> = {
  '#ffe36a': 'highlight-yellow', yellow: 'highlight-yellow',
  '#bce8c4': 'highlight-green', green: 'highlight-green',
  '#c7dcff': 'highlight-blue', blue: 'highlight-blue',
  '#ffc7df': 'highlight-pink', pink: 'highlight-pink',
  '#ffd0a3': 'highlight-orange', orange: 'highlight-orange',
  '#8b1e1e': 'highlight-red', '#ffb5ad': 'highlight-red', red: 'highlight-red',
}
type TipNode = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: TipNode[] }
const textSizeValues = new Set(['small', 'normal', 'large', 'x-large'])
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
function headingLevel(value: unknown): HeadingLevel {
  switch (Number(value)) {
    case 1: return 1
    case 2: return 2
    case 3: return 3
    case 4: return 4
    case 5: return 5
    case 6: return 6
    default: return 2
  }
}
function tipNode(node: TipNode, key: string, nextHeadingId?: () => string | undefined): React.ReactNode {
  if (node.type === 'text') {
    let child: React.ReactNode = node.text ?? ''
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === 'bold') child = <strong key={key + '-m' + index}>{child}</strong>
      else if (mark.type === 'italic') child = <em key={key + '-m' + index}>{child}</em>
      else if (mark.type === 'underline') child = <u key={key + '-m' + index}>{child}</u>
      else if (mark.type === 'strike') child = <del key={key + '-m' + index}>{child}</del>
      else if (mark.type === 'code') child = <code key={key + '-m' + index}>{child}</code>
      else if (mark.type === 'highlight') {
        const raw = String(mark.attrs?.color ?? 'yellow').toLowerCase()
        child = <mark key={key + '-m' + index} className={highlightClass[raw] ?? 'highlight-yellow'}>{child}</mark>
      }
      else if (mark.type === 'textSize') {
        const size = String(mark.attrs?.size ?? '')
        if (textSizeValues.has(size)) child = <span key={key + '-m' + index} data-text-size={size}>{child}</span>
      }
      else if (mark.type === 'link') {
        const href = String(mark.attrs?.href ?? '')
        if (isSafeArticleLink(href)) {
          const external = /^https?:\/\//i.test(href)
          child = <a key={key + '-m' + index} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{child}</a>
        }
      }
    }
    return <React.Fragment key={key}>{child}</React.Fragment>
  }
  if (node.type === 'hardBreak') return <br key={key} />
  if (node.type === 'codeBlock') return <CodeBlockDisplay key={key} code={(node.content ?? []).map(child => child.text ?? '').join('')} language={String(node.attrs?.language ?? 'text')} />
  if (node.type === 'heading') {
    const level = headingLevel(node.attrs?.level)
    const id = nextHeadingId?.()
    const children = (node.content ?? []).map((child, i) => tipNode(child, key + '-' + i, nextHeadingId))
    const tag = `h${level}`
    return React.createElement(tag, { key, id }, children)
  }
  const children = (node.content ?? []).map((child, i) => tipNode(child, key + '-' + i, nextHeadingId))
  if (node.type === 'paragraph') return <p key={key}>{children}</p>
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>
  if (node.type === 'listItem') return <li key={key}>{children}</li>
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>
  if (node.type === 'doc') return <React.Fragment key={key}>{children}</React.Fragment>
  return <React.Fragment key={key}>{children}</React.Fragment>
}
function tiptapContent(value: string, nextHeadingId?: () => string | undefined): React.ReactNode | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    return tipNode(parsed, 'tiptap', nextHeadingId)
  } catch {
    return null
  }
}
function inlineTiptap(value: string, nextHeadingId?: () => string | undefined): React.ReactNode[] | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    const content = parsed.type === 'doc' ? parsed.content ?? [] : [parsed]
    return content.flatMap((node, i) => {
      if (node.type === 'paragraph') return (node.content ?? []).map((child, j) => tipNode(child, 'inline-' + i + '-' + j, nextHeadingId))
      return [tipNode(node, 'inline-' + i, nextHeadingId)]
    })
  } catch {
    return null
  }
}

function inlineText(value: string, nextHeadingId?: () => string | undefined): React.ReactNode[] {
  const tiptap = inlineTiptap(value, nextHeadingId)
  if (tiptap) return tiptap
  const tokenPattern =
    /(\*\*.+?\*\*|~~.+?~~|==(?:yellow|green|blue|pink|orange|red)\|.+?==|==.+?==|\*[^*\n]+\*|\x60[^\x60\n]+\x60|<u>.+?<\/u>|\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\))/g

  return value.split(tokenPattern).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{inlineText(part.slice(2, -2))}</strong>
    }

    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={index}>{inlineText(part.slice(2, -2))}</del>
    }

    if (part.startsWith('==') && part.endsWith('==')) {
      const colored = part.match(/^==(yellow|green|blue|pink|orange|red)\|([\s\S]+)==$/)
      const color = colored?.[1] ?? 'yellow'
      const content = colored ? colored[2] : part.slice(2, -2)

      return (
        <mark key={index} className={`highlight-${color}`}>
          {inlineText(content)}
        </mark>
      )
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{inlineText(part.slice(1, -1))}</em>
    }

    if (part.startsWith(String.fromCharCode(96)) && part.endsWith(String.fromCharCode(96))) {
      return <code key={index}>{inlineText(part.slice(1, -1))}</code>
    }

    const underline = part.match(/^<u>(.*?)<\/u>$/)
    if (underline) {
      return <u key={index}>{inlineText(underline[1])}</u>
    }

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\)$/)
    if (link && isSafeArticleLink(link[2])) {
      const external = /^https?:\/\//i.test(link[2])
      return (
        <a key={index} href={link[2]} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {inlineText(link[1])}
        </a>
      )
    }

    return part
  })
}

function headingId(value:string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/[\s-]+/g,'-');
}
function textContent(node: TipNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return ' '
  return (node.content ?? []).map(textContent).join('')
}
function tiptapHeadings(value: string): { text: string; level: HeadingLevel }[] {
  if (!value.startsWith(TIPTAP_PREFIX)) return []
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    const headings: { text: string; level: HeadingLevel }[] = []
    const visit = (node: TipNode) => {
      if (node.type === 'heading') {
        const text = textContent(node).trim()
        if (text) headings.push({ text, level: headingLevel(node.attrs?.level) })
      }
      node.content?.forEach(visit)
    }
    visit(parsed)
    return headings
  } catch {
    return []
  }
}
function formattedParagraphs(value:string, nextHeadingId?: () => string | undefined) {
  const tiptap = tiptapContent(value, nextHeadingId)
  if (tiptap) return tiptap
  const lines=value.split('\n');
  const output:React.ReactNode[]=[];
  let paragraph:string[]=[];
  let listType:'ul'|'ol'|null=null;
  let listItems:React.ReactNode[]=[];
  const flushParagraph=()=>{
    if(paragraph.length) output.push(<p key={'p-'+output.length}>{paragraph.map((line,i)=><span key={i}>{i>0?<br/>:null}{inlineText(line)}</span>)}</p>);
    paragraph=[];
  };
  const flushList=()=>{
    if(!listType||!listItems.length)return;
    output.push(listType==='ul'?<ul key={'ul-'+output.length}>{listItems}</ul>:<ol key={'ol-'+output.length}>{listItems}</ol>);
    listType=null;listItems=[];
  };
  lines.forEach((line,index)=>{
    const bullet=line.match(/^\s*[•*-]\s+(.+)$/);
    const numbered=line.match(/^\s*\d+[.)]\s+(.+)$/);
    const type=bullet?'ul':numbered?'ol':null;
    if(type){
      flushParagraph();
      if(listType&&listType!==type)flushList();
      listType=type;
      listItems.push(<li key={index}>{inlineText((bullet||numbered)![1])}</li>);
    }else{
      flushList();
      if(line.trim())paragraph.push(line);
      else flushParagraph();
    }
  });
  flushList();flushParagraph();
  return output;
}

import type { Metadata } from 'next'
import { absoluteUrl, isSafeArticleLink, plainText, SITE_NAME } from '@/lib/seo'

const EDITORIAL_AUTHOR = 'Kya Scene Hai? Editorial Desk'
type RelatedArticle = Pick<Article, 'slug' | 'title' | 'dek' | 'hero_text' | 'reading_minutes'> & {
  categories: { name: string; slug: string }[] | null
}

function displayDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: story } = await supabase
    .from('articles')
    .select('slug, title, dek, seo_title, seo_description, hero_image, categories(name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!story) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  const title = plainText(story.seo_title) || plainText(story.title) || SITE_NAME
  const description = (plainText(story.seo_description) || plainText(story.dek) || 'Read this story from Kya Scene Hai?').slice(0, 160)
  const url = absoluteUrl(`/articles/${story.slug}`)
  const image = story.hero_image || undefined
  const category = Array.isArray(story.categories) ? story.categories[0]?.name : (story.categories as {name?: string} | null)?.name

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: plainText(story.title) }] } : {}),
      ...(category ? { section: category } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function Article({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const supabase=await createClient();
  const {data}=await supabase.from('articles').select('id,slug,title,dek,editorial_note,body,hero_text,hero_image,category_id,published_at,updated_at,reading_minutes,seo_description,categories(name,slug)').eq('slug',slug).eq('status','published').maybeSingle();
  const story=data as Article|null;
  if(!story) notFound();

  let relatedStories: RelatedArticle[] = []
  if (story.category_id) {
    const { data: sameTopic, error: relatedError } = await supabase
      .from('articles')
      .select('slug,title,dek,hero_text,reading_minutes,categories(name,slug)')
      .eq('status', 'published')
      .eq('category_id', story.category_id)
      .neq('id', story.id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('slug')
      .limit(4)

    if (relatedError) throw relatedError
    relatedStories = (sameTopic ?? []) as RelatedArticle[]
  }

  const showingRelated = relatedStories.length > 0
  if (!showingRelated) {
    const { data: latestStories, error: latestError } = await supabase
      .from('articles')
      .select('slug,title,dek,hero_text,reading_minutes,categories(name,slug)')
      .eq('status', 'published')
      .neq('id', story.id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('slug')
      .limit(4)

    if (latestError) throw latestError
    relatedStories = (latestStories ?? []) as RelatedArticle[]
  }

  const allBlocks=story.body??[];
  const publishedDate=displayDate(story.published_at);
  const updatedDate=displayDate(story.updated_at);
  const hasUpdatedDate=Boolean(updatedDate&&story.updated_at&&story.published_at&&new Date(story.updated_at).getTime()>new Date(story.published_at).getTime());
  const sources=allBlocks.filter((block): block is Extract<ArticleBlock,{type:'source'}> => typeof block==='object'&&block.type==='source'&&!!block.verified&&!!block.title?.trim()&&!!block.url?.trim());
  const contentBlocks=allBlocks.filter((block): block is Exclude<ArticleBlock,Extract<ArticleBlock,{type:'source'}>> => typeof block==='string'||block.type!=='source');
  const headings = contentBlocks.flatMap(block => {
    if (typeof block === 'object' && block.type === 'heading') {
      return block.text?.trim() ? [{ text: block.text.trim(), level: 2 as const }] : []
    }
    return typeof block === 'string' ? tiptapHeadings(block) : tiptapHeadings(block.text ?? '')
  })
  const headingCounts=new Map<string,number>();
  const toc=headings.map(h=>{
    const base=headingId(h.text)||'section';
    const count=headingCounts.get(base)||0;
    headingCounts.set(base,count+1);
    return {text:h.text,id:count?base+'-'+(count+1):base,level:h.level};
  });
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: plainText(story.title),
    description: plainText(story.seo_description) || plainText(story.dek),
    mainEntityOfPage: absoluteUrl(`/articles/${story.slug}`),
    datePublished: story.published_at || undefined,
    dateModified: story.updated_at || story.published_at || undefined,
    image: story.hero_image ? [story.hero_image] : undefined,
    author: { '@type': 'Organization', name: EDITORIAL_AUTHOR },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    articleSection: story.categories?.name || undefined,
  };
  let headingIndex = 0
  const nextHeadingId = () => toc[headingIndex++]?.id
  const renderedContent = contentBlocks.map((block:ArticleBlock,i:number)=>{
    if(typeof block==='string') return <div className="formatted-content" key={i}>{formattedParagraphs(block,nextHeadingId)}</div>;
    if(block.type==='paragraph') return block.text ? <div className="formatted-content" key={i}>{formattedParagraphs(block.text,nextHeadingId)}</div> : null;
    if(block.type==='heading') {
      const item=block.text?.trim()?toc[headingIndex++]:undefined;
      return block.text ? <h2 id={item?.id} key={i}>{inlineText(block.text)}</h2> : null;
    }
    if(block.type==='quote') return block.text ? <blockquote key={i}><div className="quote-text">{inlineText(block.text,nextHeadingId)}</div>{block.attribution?.trim()&&<footer className="quote-attribution">— {block.attribution.trim()}</footer>}</blockquote> : null;
    if(block.type==='callout') return block.text ? <div className="articlecallout" key={i}>{inlineText(block.text,nextHeadingId)}</div> : null;
    if(block.type==='image'&&block.url) return <figure key={i}><Image className="articleimage" src={block.url} alt={block.alt||''} width={1200} height={800} unoptimized/>{block.alt&&<figcaption>{block.alt}</figcaption>}</figure>;
    if(block.type==='source') return null;
    return null;
  })

  return <div className="site article-site">
    <SiteHeader/>
    <main className="article">
      <ReadingProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
      <div className="article-reading-layout" id="article-reading-content">
      {toc.length > 0 && <ArticleContentsNav sections={toc} />}
      <div className="article-main-column">
      <Link href="/articles" className="back">← Back to archive</Link>
      <div className="kicker article-kicker">{story.categories?.name}</div>
      <h1>{story.title}</h1>
      {story.dek&&<p className="lede">{story.dek}</p>}
      <div className="meta article-byline">
        <span>{story.reading_minutes} min read</span>
        <span aria-hidden="true">•</span>
        <span>By {EDITORIAL_AUTHOR}</span>
        {publishedDate && (
          <>
            <span aria-hidden="true">•</span>
            <span>Published <time dateTime={story.published_at ?? undefined}>{publishedDate}</time></span>
          </>
        )}
        {hasUpdatedDate && updatedDate && (
          <>
            <span aria-hidden="true">•</span>
            <span>Updated <time dateTime={story.updated_at}>{updatedDate}</time></span>
          </>
        )}
      </div>
      {story.editorial_note?.trim() && (
        <aside className="editorial-note" aria-label="Editorial note">
          <h2>Editorial note</h2>
          <p>{story.editorial_note}</p>
        </aside>
      )}
      <ArticleShare title={plainText(story.title)} url={absoluteUrl(`/articles/${story.slug}`)} />
      {story.hero_image
        ? <Image className="articleimage" src={story.hero_image} alt={story.title} width={1200} height={800} unoptimized loading="eager"/>
        : story.hero_text ? <div className="articlehero yellow"><h2>{story.hero_text}</h2></div> : null}
      <article className="prose">
        {renderedContent}
      </article>
      {sources.length>0&&<section className="article-sources"><h2>SOURCES &amp; FURTHER READING</h2><ol>{sources.map((source,i)=><li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.publisher&&<span className="source-publisher"> — {source.publisher}</span>}{source.verified&&<span className="source-verified">Verified</span>}</li>)}</ol><p className="source-note">Sources are provided for readers to inspect. “Verified” means the editorial team checked the linked material directly; it is not an endorsement of every claim on the source website.</p></section>}
      </div>
      </div>
      {relatedStories.length > 0 && (
        <section className="related-articles" aria-labelledby="related-articles-title">
          <div className="sectiontop">
            <div>
              <div className="kicker">{showingRelated ? 'Keep exploring' : 'From the archive'}</div>
              <h2 id="related-articles-title">{showingRelated ? 'RELATED STORIES' : 'LATEST STORIES'}</h2>
            </div>
          </div>
          <div className="grid">
            {relatedStories.map((related, index) => (
              <Link className="card" href={`/articles/${related.slug}`} key={related.slug}>
                <div className={`cover ${['blue', 'yellow', 'red'][index % 3]}`}>
                  <span className="tag">{related.categories?.[0]?.name}</span>
                  <strong>{related.hero_text}</strong>
                </div>
                <div className="cardbody">
                  <h3>{related.title}</h3>
                  <p>{related.dek}</p>
                  <div className="read">{related.reading_minutes} min read · Open story →</div>
                </div>
              </Link>
            ))}
          </div>
          <Link className="related-more" href="/articles">Show more articles →</Link>
        </section>
      )}
    </main>
    <SiteFooter/>
  </div>;
}
