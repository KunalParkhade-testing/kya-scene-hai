'use client'

import {useEffect,useRef} from 'react'

type Props={value:string;onChange:(value:string)=>void;placeholder?:string}

const colors=[
 {name:'Yellow',value:'#ffe36a'},
 {name:'Green',value:'#bce8c4'},
 {name:'Blue',value:'#c7dcff'},
 {name:'Pink',value:'#ffc7df'},
 {name:'Orange',value:'#ffd0a3'},
 {name:'Red',value:'#ffb5ad'}
]
function escapeHtml(value:string){
 return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}
function inlineHtml(value:string){
 let s=escapeHtml(value)
 s=s.replace(/==(yellow|green|blue|pink|orange|red)\|([\s\S]+?)==/g,(_,color,text)=>'<mark data-highlight="'+color+'">'+text+'</mark>')
 s=s.replace(/==([\s\S]+?)==/g,'<mark data-highlight="yellow">$1</mark>')
 s=s.replace(/\*\*([\s\S]+?)\*\*/g,'<strong>$1</strong>')
 s=s.replace(/~~([\s\S]+?)~~/g,'<del>$1</del>')
 s=s.replace(/\*([^*\n]+)\*/g,'<em>$1</em>')
 s=s.replace(/&lt;u&gt;([\s\S]+?)&lt;\/u&gt;/g,'<u>$1</u>')
 s=s.replace(/\x60([^\x60\n]+)\x60/g,'<code>$1</code>')
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>')
 return s
}
function markdownToHtml(value:string){
 const lines=value.split('\n')
 const out:string[]=[]
 let list:'ul'|'ol'|null=null
 let items:string[]=[]
 const flush=()=>{
  if(list&&items.length)out.push('<'+list+'>'+items.join('')+'</'+list+'>')
  list=null;items=[]
 }
 for(const line of lines){
  const bullet=line.match(/^\s*[•*-]\s+(.+)$/)
  const numbered=line.match(/^\s*\d+[.)]\s+(.+)$/)
  const type=bullet?'ul':numbered?'ol':null
  if(type){
   if(list&&list!==type)flush()
   list=type
   items.push('<li>'+inlineHtml((bullet||numbered)![1])+'</li>')
  }else{
   flush()
   if(line.trim())out.push('<p>'+inlineHtml(line)+'</p>')
  }
 }
 flush()
 return out.join('')
}
function serializeHtml(html:string){
 const doc=new DOMParser().parseFromString(html,'text/html')
 const nodeText=(node:Node):string=>{
  if(node.nodeType===Node.TEXT_NODE)return node.textContent||''
  if(node.nodeType!==Node.ELEMENT_NODE)return ''
  const el=node as HTMLElement
  const children=Array.from(el.childNodes).map(nodeText).join('')
  const tag=el.tagName.toLowerCase()
  if(tag==='br')return '\n'
  if(tag==='strong'||tag==='b')return '**'+children+'**'
  if(tag==='em'||tag==='i')return '*'+children+'*'
  if(tag==='u')return '<u>'+children+'</u>'
  if(tag==='del'||tag==='s'||tag==='strike')return '~~'+children+'~~'
  if(tag==='code')return String.fromCharCode(96)+children+String.fromCharCode(96)
  if(tag==='a'){
   const href=el.getAttribute('href')||''
   return /^https?:\/\//i.test(href)?'['+children+']('+href+')':children
  }
  if(tag==='mark'||tag==='span'||tag==='font'||el.style.backgroundColor||el.hasAttribute('data-highlight')){
   const color=el.getAttribute('data-highlight')||el.style.backgroundColor||''
   const rgb=color.toLowerCase().replace(/\s/g,'')
   const colorName=rgb==='#ffe36a'||rgb==='rgb(255,227,106)'?'yellow':
    rgb==='#bce8c4'||rgb==='rgb(188,232,196)'?'green':
    rgb==='#c7dcff'||rgb==='rgb(199,220,255)'?'blue':
    rgb==='#ffc7df'||rgb==='rgb(255,199,223)'?'pink':
    rgb==='#ffd0a3'||rgb==='rgb(255,208,163)'?'orange':
    rgb==='#ffb5ad'||rgb==='rgb(255,181,173)'?'red':'yellow'
   return '=='+colorName+'|'+children+'=='
  }
  if(tag==='ul')return Array.from(el.children).map(li=>'• '+nodeText(li)).join('\n')+'\n'
  if(tag==='ol')return Array.from(el.children).map((li,i)=>(i+1)+'. '+nodeText(li)).join('\n')+'\n'
  if(tag==='p'||tag==='div')return children+'\n'
  return children
 }
 return Array.from(doc.body.childNodes).map(nodeText).join('').replace(/\n{3,}/g,'\n\n').replace(/\n+$/,'')
}
export default function RichTextEditor({value,onChange,placeholder='Write your text…'}:Props){
 const editor=useRef<HTMLDivElement>(null)
 const lastValue=useRef<string|null>(null)
 useEffect(()=>{
  const el=editor.current
  if(!el)return
  if(lastValue.current!==value){
   el.innerHTML=markdownToHtml(value)
   lastValue.current=value
  }
 },[value])
 function sync(){
  const el=editor.current
  if(!el)return
  const next=serializeHtml(el.innerHTML)
  lastValue.current=next
  onChange(next)
 }
 function command(cmd:string,arg?:string){
  editor.current?.focus()
  document.execCommand(cmd,false,arg)
  sync()
 }
 function highlight(color:string){
  editor.current?.focus()
  document.execCommand('hiliteColor',false,color)
  sync()
 }
 function code(){
  const selection=window.getSelection()
  if(!selection||selection.rangeCount===0||selection.isCollapsed)return
  const range=selection.getRangeAt(0)
  const el=document.createElement('code')
  try{range.surroundContents(el)}catch{
   el.appendChild(range.extractContents());range.insertNode(el)
  }
  selection.removeAllRanges()
  const next=document.createRange();next.selectNodeContents(el);selection.addRange(next)
  sync()
 }
 function link(){
  const url=window.prompt('Paste the full https:// link')
  if(url&&/^https?:\/\//i.test(url))command('createLink',url)
 }
 return <div className="rich-editor">
  <div className="rich-toolbar" role="toolbar" aria-label="Text formatting">
   <div className="rich-toolgroup">
    <button type="button" title="Bold" aria-label="Bold" onMouseDown={e=>e.preventDefault()} onClick={()=>command('bold')}><strong>B</strong></button>
    <button type="button" title="Italic" aria-label="Italic" onMouseDown={e=>e.preventDefault()} onClick={()=>command('italic')}><em>I</em></button>
    <button type="button" title="Underline" aria-label="Underline" onMouseDown={e=>e.preventDefault()} onClick={()=>command('underline')}><u>U</u></button>
    <button type="button" title="Strikethrough" aria-label="Strikethrough" onMouseDown={e=>e.preventDefault()} onClick={()=>command('strikeThrough')}><s>S</s></button>
   </div>
   <span className="rich-toolbar-divider"/>
   <div className="rich-toolgroup">
    <div className="highlight-swatches" role="group" aria-label="Highlight colour">{colors.map(c=><button key={c.name} type="button" title={c.name+' highlight'} aria-label={c.name+' highlight'} className="highlight-swatch" style={{'--swatch':c.value} as React.CSSProperties} onMouseDown={e=>e.preventDefault()} onClick={()=>highlight(c.value)}><span/></button>)}</div>
    <button type="button" title="Inline code" onMouseDown={e=>e.preventDefault()} onClick={code}>Code</button>
   </div>
   <span className="rich-toolbar-divider"/>
   <div className="rich-toolgroup">
    <button type="button" title="Insert link" onMouseDown={e=>e.preventDefault()} onClick={link}>Link</button>
    <button type="button" title="Bulleted list" onMouseDown={e=>e.preventDefault()} onClick={()=>command('insertUnorderedList')}>• List</button>
    <button type="button" title="Numbered list" onMouseDown={e=>e.preventDefault()} onClick={()=>command('insertOrderedList')}>1. List</button>
   </div>
  </div>
  <div ref={editor} className="rich-editable" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={sync} onPaste={e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,text)}}/>
 </div>
}
