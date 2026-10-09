import {notFound} from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {createClient} from '@/lib/supabase/server';
import type {Article,ArticleBlock} from '@/lib/types';

function inlineText(value:string) {
  const tokenPattern = /(\*\*.+?\*\*|~~.+?~~|==.+?==|\*[^*\n]+\*|\`[^\`\n]+\`|<u>.+?<\/u>|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  return value.split(tokenPattern).filter(Boolean).map((part,index)=>{
    if(part.startsWith('**')&&part.endsWith('**')) return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('~~')&&part.endsWith('~~')) return <del key={index}>{part.slice(2,-2)}</del>;
    if(part.startsWith('==')&&part.endsWith('==')) return <mark key={index}>{part.slice(2,-2)}</mark>;
    if(part.startsWith('*')&&part.endsWith('*')) return <em key={index}>{part.slice(1,-1)}</em>;
    if(part.startsWith('\`')&&part.endsWith('\`')) return <code key={index}>{part.slice(1,-1)}</code>;
    const underline=part.match(/^<u>(.*?)<\/u>$/);
    if(underline) return <u key={index}>{underline[1]}</u>;
    const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if(link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return part;
  });
}
function headingId(value:string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/[\s-]+/g,'-');
}
function formattedParagraphs(value:string) {
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

export default async function Article({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const supabase=await createClient();
  const {data}=await supabase.from('articles').select('*, categories(name,slug)').eq('slug',slug).eq('status','published').maybeSingle();
  const story=data as Article|null;
  if(!story) notFound();

  const allBlocks=story.body??[];
  const sources=allBlocks.filter((b:any)=>typeof b==='object'&&b?.type==='source') as {type:'source';title:string;url:string;publisher?:string;verified?:boolean}[];
  const contentBlocks=allBlocks.filter((b:any)=>!(typeof b==='object'&&b?.type==='source'));
  const headings=contentBlocks.filter((b:any)=>typeof b==='object'&&b?.type==='heading'&&b.text?.trim()) as {type:'heading';text:string}[];
  const headingCounts=new Map<string,number>();
  const toc=headings.map(h=>{
    const base=headingId(h.text)||'section';
    const count=headingCounts.get(base)||0;
    headingCounts.set(base,count+1);
    return {text:h.text,id:count?base+'-'+(count+1):base};
  });
  let headingIndex=0;

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
