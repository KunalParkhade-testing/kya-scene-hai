import * as React from 'react';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CodeBlockDisplay from '@/components/CodeBlockDisplay';
import {createClient} from '@/lib/supabase/server';
import type {Article,ArticleBlock} from '@/lib/types';



const TIPTAP_PREFIX = '__TIPTAP_JSON__:'
const highlightClass: Record<string, string> = {
  '#ffe36a': 'highlight-yellow', yellow: 'highlight-yellow',
  '#bce8c4': 'highlight-green', green: 'highlight-green',
  '#c7dcff': 'highlight-blue', blue: 'highlight-blue',
  '#ffc7df': 'highlight-pink', pink: 'highlight-pink',
  '#ffd0a3': 'highlight-orange', orange: 'highlight-orange',
  '#ffb5ad': 'highlight-red', red: 'highlight-red',
}
type TipNode = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: TipNode[] }
function tipNode(node: TipNode, key: string): React.ReactNode {
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
      else if (mark.type === 'link') {
        const href = String(mark.attrs?.href ?? '')
        if (/^https?:\/\//i.test(href)) child = <a key={key + '-m' + index} href={href} target="_blank" rel="noreferrer">{child}</a>
      }
    }
    return <React.Fragment key={key}>{child}</React.Fragment>
  }
  if (node.type === 'hardBreak') return <br key={key} />
  if (node.type === 'codeBlock') return <CodeBlockDisplay key={key} code={(node.content ?? []).map(child => child.text ?? '').join('')} language={String(node.attrs?.language ?? 'text')} />
  const children = (node.content ?? []).map((child, i) => tipNode(child, key + '-' + i))
  if (node.type === 'paragraph') return <p key={key}>{children}</p>
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>
  if (node.type === 'listItem') return <li key={key}>{children}</li>
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>
  if (node.type === 'doc') return <React.Fragment key={key}>{children}</React.Fragment>
  return <React.Fragment key={key}>{children}</React.Fragment>
}
function tiptapContent(value: string): React.ReactNode | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    return tipNode(parsed, 'tiptap')
  } catch {
    return null
  }
}
function inlineTiptap(value: string): React.ReactNode[] | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    const content = parsed.type === 'doc' ? parsed.content ?? [] : [parsed]
    return content.flatMap((node, i) => {
      if (node.type === 'paragraph') return (node.content ?? []).map((child, j) => tipNode(child, 'inline-' + i + '-' + j))
      return [tipNode(node, 'inline-' + i)]
    })
  } catch {
    return null
  }
}

function inlineText(value: string): React.ReactNode[] {
  const tiptap = inlineTiptap(value)
  if (tiptap) return tiptap
  const tokenPattern =
    /(\*\*.+?\*\*|~~.+?~~|==(?:yellow|green|blue|pink|orange|red)\|.+?==|==.+?==|\*[^*\n]+\*|\x60[^\x60\n]+\x60|<u>.+?<\/u>|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g

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

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) {
      return (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer">
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
function formattedParagraphs(value:string) {
  const tiptap = tiptapContent(value)
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
import { absoluteUrl, plainText, SITE_NAME } from '@/lib/seo'

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
  const {data}=await supabase.from('articles').select('*, categories(name,slug)').eq('slug',slug).eq('status','published').maybeSingle();
  const story=data as Article|null;
  if(!story) notFound();

  const allBlocks=story.body??[];
  const sources=allBlocks.filter((block): block is Extract<ArticleBlock,{type:'source'}> => typeof block==='object'&&block.type==='source'&&!!block.verified&&!!block.title?.trim()&&!!block.url?.trim());
  const contentBlocks=allBlocks.filter((block): block is Exclude<ArticleBlock,Extract<ArticleBlock,{type:'source'}>> => typeof block==='string'||block.type!=='source');
  const headings=contentBlocks.filter((block): block is {type:'heading';text:string} => typeof block==='object'&&block.type==='heading'&&!!block.text?.trim());
  const headingCounts=new Map<string,number>();
  const toc=headings.map(h=>{
    const base=headingId(h.text)||'section';
    const count=headingCounts.get(base)||0;
    headingCounts.set(base,count+1);
    return {text:h.text,id:count?base+'-'+(count+1):base};
  });
  let headingIndex=0;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: plainText(story.title),
    description: plainText(story.seo_description) || plainText(story.dek),
    mainEntityOfPage: absoluteUrl(`/articles/${story.slug}`),
    datePublished: story.published_at || undefined,
    dateModified: story.updated_at || story.published_at || undefined,
    image: story.hero_image ? [story.hero_image] : undefined,
    publisher: { '@type': 'Organization', name: SITE_NAME },
    articleSection: story.categories?.name || undefined,
  };

  return <div className="site">
    <SiteHeader/>
    <main className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
      <Link href="/articles" className="back">← Back to archive</Link>
      <div className="kicker article-kicker">{story.categories?.name}</div>
      <h1>{story.title}</h1>
      {story.dek&&<p className="lede">{story.dek}</p>}
      <div className="meta"><span>{story.reading_minutes} min read</span><span>•</span><span>Kya Scene Hai?</span></div>
      {story.hero_image
        ? <img className="articleimage" src={story.hero_image} alt={story.title}/>
        : story.hero_text ? <div className="articlehero yellow"><h2>{story.hero_text}</h2></div> : null}
      {toc.length>0&&<nav className="article-toc" aria-label="In this article"><h2>IN THIS ARTICLE</h2><ol>{toc.map(item=><li key={item.id}><a href={'#'+item.id}>{item.text}</a></li>)}</ol></nav>}
      <article className="prose">
        {contentBlocks.map((block:ArticleBlock,i:number)=>{
          if(typeof block==='string') return <div className="formatted-content" key={i}>{formattedParagraphs(block)}</div>;
          if(block.type==='paragraph') return block.text ? <div className="formatted-content" key={i}>{formattedParagraphs(block.text)}</div> : null;
          if(block.type==='heading') {
            const item=block.text?.trim()?toc[headingIndex++]:undefined;
            return block.text ? <h2 id={item?.id} key={i}>{inlineText(block.text)}</h2> : null;
          }
          if(block.type==='quote') return block.text ? <blockquote key={i}>{inlineText(block.text)}</blockquote> : null;
          if(block.type==='callout') return block.text ? <div className="articlecallout" key={i}>{inlineText(block.text)}</div> : null;
          if(block.type==='image'&&block.url) return <figure key={i}><img className="articleimage" src={block.url} alt={block.alt||''}/>{block.alt&&<figcaption>{block.alt}</figcaption>}</figure>;
          if(block.type==='source') return null;
          return null;
        })}
      </article>
      {sources.length>0&&<section className="article-sources"><h2>SOURCES &amp; FURTHER READING</h2><ol>{sources.map((source,i)=><li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>{source.publisher&&<span className="source-publisher"> — {source.publisher}</span>}{source.verified&&<span className="source-verified">Verified</span>}</li>)}</ol><p className="source-note">Sources are provided for readers to inspect. “Verified” means the editorial team checked the linked material directly; it is not an endorsement of every claim on the source website.</p></section>}
    </main>
    <SiteFooter/>
  </div>;
}
