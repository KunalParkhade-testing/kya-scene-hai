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
}
const aliases: Record<string,string> = { js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript', py:'python', sh:'bash', shell:'bash', yml:'yaml', html:'html', xml:'html', plaintext:'text', text:'text' }
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
