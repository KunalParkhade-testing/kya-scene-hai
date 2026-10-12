'use client'

import * as React from 'react'
import CodeBlockDisplay from '@/components/CodeBlockDisplay'

type Props = { markdown: string }

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

function inline(value: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(!\[[^\]]*\]\([^\s)]+(?:\s+[^)]*)?\)|\[[^\]]+\]\([^\s)]+(?:\s+[^)]*)?\)|\*\*\*.+?\*\*\*|\*\*.+?\*\*|__.+?__|~~.+?~~|\*[^*\n]+\*|_[^_\n]+_|\x60[^\x60\n]+\x60)/g
  return value.split(pattern).filter(Boolean).map((part, index) => {
    const key = keyPrefix + '-' + index
    const image = part.match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/)
    if (image) {
      const src = safeUrl(image[2])
      return src ? <img key={key} src={src} alt={image[1]} title={image[3]} className="markdown-image" loading="lazy" /> : image[1]
    }
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/)
    if (link) {
      const href = safeUrl(link[2])
      return href ? <a key={key} href={href} title={link[3]} target="_blank" rel="noopener noreferrer">{inline(link[1], key + '-label')}</a> : link[1]
    }
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={key}><em>{part.slice(3, -3)}</em></strong>
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={key}>{part.slice(2, -2)}</del>
    if (part.startsWith(String.fromCharCode(96)) && part.endsWith(String.fromCharCode(96))) return <code key={key}>{part.slice(1, -1)}</code>
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) return <em key={key}>{part.slice(1, -1)}</em>
    return part
  })
}

function renderMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.replace(/<!--[\\s\\S]*?-->/g, '').replace(/\\r\\n?/g, '\\n').split('\\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0
  const tick = String.fromCharCode(96)

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const fence = line.match(new RegExp('^\\\\s*' + tick + '{3}([^\\\\s' + tick + ']*)\\\\s*$'))
    if (fence) {
      const language = fence[1] || 'text'
      const body: string[] = []
      i++
      while (i < lines.length && !new RegExp('^\\\\s*' + tick + '{3}\\\\s*$').test(lines[i])) body.push(lines[i++])
      if (i < lines.length) i++
      out.push(<CodeBlockDisplay key={'md-' + key++} code={body.join('\\n')} language={language} />)
      continue
    }

    const heading = line.match(/^\\s*(#{1,6})\\s+(.+?)\\s*#*\\s*$/)
    if (heading) {
      const level = heading[1].length
      const children = inline(heading[2], 'mh-' + key)
      const id = 'markdown-heading-' + key++
      if (level === 1) out.push(<h1 key={id}>{children}</h1>)
      else if (level === 2) out.push(<h2 key={id}>{children}</h2>)
      else if (level === 3) out.push(<h3 key={id}>{children}</h3>)
      else if (level === 4) out.push(<h4 key={id}>{children}</h4>)
      else if (level === 5) out.push(<h5 key={id}>{children}</h5>)
      else out.push(<h6 key={id}>{children}</h6>)
      i++
      continue
    }

    if (/^\\s*([-*_])(?:\\s*\\1){2,}\\s*$/.test(line)) {
      out.push(<hr key={'md-' + key++} />)
      i++
      continue
    }

    if (/^\\s*>/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^\\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\\s*>\\s?/, ''))
      out.push(<blockquote key={'md-' + key++}>{quote.map((q, j) => <p key={j}>{inline(q, 'mq-' + key + '-' + j)}</p>)}</blockquote>)
      continue
    }

    if (/^\\s*[-+*]\\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\\s*[-+*]\\s+/.test(lines[i])) items.push(lines[i++].replace(/^\\s*[-+*]\\s+/, ''))
      out.push(<ul key={'md-' + key++}>{items.map((item, j) => <li key={j}>{inline(item, 'mu-' + key + '-' + j)}</li>)}</ul>)
      continue
    }

    if (/^\\s*\\d+[.)]\\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\\s*\\d+[.)]\\s+/.test(lines[i])) items.push(lines[i++].replace(/^\\s*\\d+[.)]\\s+/, ''))
      out.push(<ol key={'md-' + key++}>{items.map((item, j) => <li key={j}>{inline(item, 'mo-' + key + '-' + j)}</li>)}</ol>)
      continue
    }

    const paragraph: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() && !/^\\s*(#{1,6}\\s+|>|[-+*]\\s+|\\d+[.)]\\s+)/.test(lines[i]) && !lines[i].trimStart().startsWith(tick.repeat(3))) paragraph.push(lines[i++])
    out.push(<p key={'md-' + key++}>{paragraph.map((part, j) => <React.Fragment key={j}>{j > 0 ? ' ' : null}{inline(part, 'mp-' + key + '-' + j)}</React.Fragment>)}</p>)
  }

  return out
}

export default function MarkdownBlockDisplay({ markdown }: Props) {
  return <div className="markdown-block-display">{renderMarkdown(markdown)}</div>
}
