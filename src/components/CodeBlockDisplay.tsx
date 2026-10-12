'use client'

import { useState } from 'react'

type Props = { code: string; language?: string }

const keywords: Record<string, string[]> = {
  javascript: ['const','let','var','function','return','if','else','new','class','async','await','import','from','export','default','throw','try','catch','for','of','in','while','true','false','null','undefined'],
  typescript: ['const','let','var','function','return','if','else','new','class','async','await','import','from','export','default','throw','try','catch','for','of','in','while','true','false','null','undefined','type','interface','extends','implements','public','private'],
  python: ['def','return','if','elif','else','class','import','from','as','for','in','while','True','False','None','try','except','with','lambda','pass','break','continue','async','await'],
  json: ['true','false','null'],
  sql: ['select','from','where','join','left','right','inner','outer','on','as','insert','into','values','update','set','delete','create','table','order','by','group','limit','and','or','not','null','primary','key'],
  bash: ['if','then','else','fi','for','do','done','in','function','export','echo','sudo','cd','mkdir','npm','npx'],
  c: ['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','int','long','register','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while'],
  cpp: ['alignas','auto','bool','break','case','catch','char','class','const','constexpr','continue','default','delete','do','double','else','enum','explicit','extern','false','float','for','friend','if','inline','int','long','namespace','new','nullptr','private','protected','public','return','short','signed','sizeof','static','struct','switch','template','this','throw','true','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while'],
  csharp: ['abstract','as','async','await','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','virtual','void','volatile','while'],
  java: ['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','if','implements','import','instanceof','int','interface','long','native','new','null','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','true','false'],
  go: ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var','true','false','nil'],
  rust: ['as','async','await','break','const','continue','crate','dyn','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while'],
  swift: ['associatedtype','break','case','catch','class','continue','default','defer','deinit','do','else','enum','extension','fallthrough','false','for','func','guard','if','import','in','init','inout','internal','is','let','nil','open','operator','private','protocol','public','repeat','return','self','static','struct','subscript','super','switch','throw','throws','true','try','typealias','var','where','while'],
}
const aliases: Record<string,string> = { js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript', py:'python', sh:'bash', shell:'bash', yml:'yaml', html:'html', xml:'html', plaintext:'text', text:'text', 'c++':'cpp', 'c#':'csharp', golang:'go', md:'markdown' }
function canonical(language: string) { const l=language.toLowerCase(); return aliases[l] || l || 'text' }
function tokenClass(token: string, language: string) {
  if (/^\s+$/.test(token)) return ''
  if (/^(\/\/|#|--|\/\*)/.test(token)) return 'syntax-comment'
  if (/^(["'`])/.test(token)) return 'syntax-string'
  if (/^\d/.test(token)) return 'syntax-number'
  if (/^[A-Za-z_$][\w$]*$/.test(token) && (keywords[language] || []).includes(token)) return 'syntax-keyword'
  if (/^[A-Za-z_$][\w$]*$/.test(token) && /^(console|Math|JSON|Array|Object|Promise|String|Number|Boolean|Date|React|Supabase)$/.test(token)) return 'syntax-builtin'
  if (/^[A-Za-z_$][\w$]*$/.test(token) && /^(TODO|FIXME|NOTE)$/.test(token)) return 'syntax-comment'
  if (/^[{}()[\].,;:+*/%=<>!?&|~-]+$/.test(token)) return 'syntax-punctuation'
  return ''
}
function highlightLine(line: string, language: string) {
  const pattern = /(\/\/.*$|#.*$|--.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[^\w\s]|\s+)/g
  return line.split(pattern).filter(Boolean).map((token, i) => {
    const cls = tokenClass(token, language)
    return cls ? <span className={cls} key={i}>{token}</span> : token
  })
}

export default function CodeBlockDisplay({ code, language = 'text' }: Props) {
  const [copied, setCopied] = useState(false)
  const lang = canonical(language)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return <div className="published-code-block">
    <div className="code-block-header">
      <span className="code-language">{language || 'Plain text'}</span>
      <button type="button" onClick={copy} className="code-copy" aria-label="Copy code">{copied ? 'Copied ✓' : 'Copy code ↗'}</button>
    </div>
    <pre><code>{code.split('\n').map((line, i) => <span className="code-line" key={i}>{highlightLine(line, lang)}{i < code.split('\n').length - 1 ? '\n' : ''}</span>)}</code></pre>
  </div>
}
