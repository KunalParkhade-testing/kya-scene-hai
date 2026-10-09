import {notFound} from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {createClient} from '@/lib/supabase/server';
import type {Article,ArticleBlock} from '@/lib/types';

function inlineText(value:string) {
  const tokenPattern = /(\*\*.+?\*\*|~~.+?~~|\*[^*\n]+\*|`[^`\n]+`|<u>.+?<\/u>|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  return value.split(tokenPattern).filter(Boolean).map((part,index)=>{
    if(part.startsWith('**')&&part.endsWith('**')) return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('~~')&&part.endsWith('~~')) return <del key={index}>{part.slice(2,-2)}</del>;
    if(part.startsWith('*')&&part.endsWith('*')) return <em key={index}>{part.slice(1,-1)}</em>;
    if(part.startsWith('`')&&part.endsWith('`')) return <code key={index}>{part.slice(1,-1)}</code>;
    const underline=part.match(/^<u>(.*?)<\/u>$/);
    if(underline) return <u key={index}>{underline[1]}</u>;
    const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if(link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return part;
  });
}
function formattedText(value:string) {
  const lines=value.split('\n');
  const output:React.ReactNode[]=[];
  let listType:'ul'|'ol'|null=null;
  let listItems:React.ReactNode[]=[];
  const flush=()=>{
    if(!listType||!listItems.length)return;
    output.push(listType==='ul'?<ul key={`ul-${output.length}`}>{listItems}</ul>:<ol key={`ol-${output.length}`}>{listItems}</ol>);
    listType=null;listItems=[];
  };
  lines.forEach((line,index)=>{
    const bullet=line.match(/^\s*[•*-]\s+(.+)$/);
    const numbered=line.match(/^\s*\d+[.)]\s+(.+)$/);
    const type=bullet?'ul':numbered?'ol':null;
    if(type){
      if(listType&&listType!==type)flush();
      listType=type;
      listItems.push(<li key={index}>{inlineText((bullet||numbered)![1])}</li>);
    }else{
      flush();
      if(line.trim())output.push(<span key={index}>{index>0?<br/>:null}{inlineText(line)}</span>);
      else if(index>0)output.push(<br key={`br-${index}`}/>);
    }
  });
  flush();
  return output;
}

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
          if(typeof block==='string') return <p key={i}>{formattedText(block)}</p>;
          if(block.type==='paragraph') return block.text ? <p key={i}>{formattedText(block.text)}</p> : null;
          if(block.type==='heading') return block.text ? <h2 key={i}>{inlineText(block.text)}</h2> : null;
          if(block.type==='quote') return block.text ? <blockquote key={i}>{formattedText(block.text)}</blockquote> : null;
          if(block.type==='callout') return block.text ? <div className="articlecallout" key={i}>{formattedText(block.text)}</div> : null;
          if(block.type==='image'&&block.url) return <figure key={i}><img className="articleimage" src={block.url} alt={block.alt||''}/>{block.alt&&<figcaption>{block.alt}</figcaption>}</figure>;
          return null;
        })}
      </article>
    </main>
    <SiteFooter/>
  </div>;
}
