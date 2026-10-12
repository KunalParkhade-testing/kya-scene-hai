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
function commentRules(language: string) {
  const slashLanguages = ['javascript','typescript','jsx','tsx','c','cpp','csharp','java','go','rust','swift','css']
  const hashLanguages = ['python','bash','yaml']
  return {
    line: slashLanguages.includes(language) ? '//' : hashLanguages.includes(language) ? '#' : language === 'sql' ? '--' : '',
    block: ['javascript','typescript','jsx','tsx','c','cpp','csharp','java','go','rust','swift','css','sql'].includes(language) ? ['/*','*/'] as [string,string] : null,
    html: ['html','xml','markdown'].includes(language) ? ['<!--','-->'] as [string,string] : null,
  }
}

function highlightLine(line: string, language: string, wasInBlockComment: boolean) {
  const rules = commentRules(language)
  const tokens: { text: string; kind: string }[] = []
  let i = 0
  let inBlockComment = wasInBlockComment
  const add = (text: string, kind = '') => {
    if (!text) return
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.text += text
    else tokens.push({ text, kind })
  }

  while (i < line.length) {
    if (inBlockComment && rules.block) {
      const close = line.indexOf(rules.block[1], i)
      if (close === -1) { add(line.slice(i), 'syntax-comment'); i = line.length }
      else { add(line.slice(i, close + rules.block[1].length), 'syntax-comment'); i = close + rules.block[1].length; inBlockComment = false }
      continue
    }
    if (inBlockComment && rules.html) {
      const close = line.indexOf(rules.html[1], i)
      if (close === -1) { add(line.slice(i), 'syntax-comment'); i = line.length }
      else { add(line.slice(i, close + rules.html[1].length), 'syntax-comment'); i = close + rules.html[1].length; inBlockComment = false }
      continue
    }
    const blockStart = rules.block && line.startsWith(rules.block[0], i) ? rules.block : rules.html && line.startsWith(rules.html[0], i) ? rules.html : null
    if (blockStart) {
      const close = line.indexOf(blockStart[1], i + blockStart[0].length)
      if (close === -1) { add(line.slice(i), 'syntax-comment'); inBlockComment = true; i = line.length }
      else { add(line.slice(i, close + blockStart[1].length), 'syntax-comment'); i = close + blockStart[1].length }
      continue
    }
    if (rules.line && line.startsWith(rules.line, i)) { add(line.slice(i), 'syntax-comment'); break }
    const ch = line[i]
    if (ch === '"' || ch === "'" || (ch === String.fromCharCode(96) && ['javascript','typescript','jsx','tsx','markdown'].includes(language))) {
      const quote = ch
      let j = i + 1
      while (j < line.length) {
        if (line[j] === String.fromCharCode(92)) { j += 2; continue }
        if (line[j] === quote) { j++; break }
        j++
      }
      add(line.slice(i, j), 'syntax-string')
      i = j
      continue
    }
    const rest = line.slice(i)
    const number = rest.match(/^\d+(?:\.\d+)?/)
    if (number) { add(number[0], 'syntax-number'); i += number[0].length; continue }
    const word = rest.match(/^[A-Za-z_$][\w$]*/)
    if (word) {
      const value = word[0]
      if ((keywords[language] || []).includes(value)) add(value, 'syntax-keyword')
      else if (['console','Math','JSON','Array','Object','Promise','String','Number','Boolean','Date','React','Supabase'].includes(value) && ['javascript','typescript','jsx','tsx'].includes(language)) add(value, 'syntax-builtin')
      else add(value)
      i += value.length
      continue
    }
    add(ch, /[{}()[\].,;:+*/%=<>!?&|~-]/.test(ch) ? 'syntax-punctuation' : '')
    i++
  }
  return { nodes: tokens.map((token, index) => token.kind ? <span className={token.kind} key={index}>{token.text}</span> : token.text), inBlockComment }
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
  let inBlockComment = false
  const lines = code.split('\n').map((line) => {
    const highlighted = highlightLine(line, lang, inBlockComment)
    inBlockComment = highlighted.inBlockComment
    return highlighted.nodes
  })
  return <div className="published-code-block">
    <div className="code-block-header">
      <span className="code-language">{language || 'Plain text'}</span>
      <button type="button" onClick={copy} className="code-copy" aria-label="Copy code">{copied ? 'Copied ✓' : 'Copy code ↗'}</button>
    </div>
    <pre><code>{lines.map((line, i) => <span className="code-line" key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</span>)}</code></pre>
  </div>}
