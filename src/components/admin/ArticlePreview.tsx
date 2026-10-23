'use client'

import { createElement, Fragment, useEffect, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import CodeBlockDisplay from '@/components/CodeBlockDisplay'
import type { ArticleBlock } from '@/lib/types'
import ArticleContentsNav, { type ArticleSection } from '@/components/ArticleContentsNav'
import { isSafeArticleLink } from '@/lib/seo'

type PreviewSource = {
  title: string
  url: string
  publisher: string
  verified: boolean
}

type Props = {
  title: string
  dek: string
  category: string
  readingMinutes: string
  heroText: string
  heroImage: string
  editorialNote: string
  body: ArticleBlock[]
  sources: PreviewSource[]
  onClose: () => void
}

type TipNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  content?: TipNode[]
}

function textContent(node: TipNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return ' '
  return (node.content ?? []).map(textContent).join('')
}

function tiptapHeadings(value: string): { text: string; level: number }[] {
  if (!value.startsWith(TIPTAP_PREFIX)) return []
  try {
    const result: { text: string; level: number }[] = []
    const visit = (node: TipNode) => {
      if (node.type === 'heading') {
        const text = textContent(node).trim()
        if (text) result.push({ text, level: Number(node.attrs?.level) || 2 })
      }
      node.content?.forEach(visit)
    }
    visit(JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode)
    return result
  } catch {
    return []
  }
}

function createSections(body: ArticleBlock[]): ArticleSection[] {
  const headings = body.flatMap(block => {
    if (typeof block === 'string') return tiptapHeadings(block)
    if (block.type === 'source') return []
    if (block.type === 'heading') return block.text.trim() ? [{ text: block.text.trim(), level: 2 }] : []
    return tiptapHeadings(block.text ?? '')
  })
  const counts = new Map<string, number>()
  return headings.map(heading => {
    const base = heading.text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-') || 'section'
    const count = counts.get(base) ?? 0
    counts.set(base, count + 1)
    return { ...heading, id: count ? `${base}-${count + 1}` : base }
  })
}

const TIPTAP_PREFIX = '__TIPTAP_JSON__:'
const highlightClasses: Record<string, string> = {
  yellow: 'highlight-yellow',
  '#ffe36a': 'highlight-yellow',
  green: 'highlight-green',
  '#bce8c4': 'highlight-green',
  blue: 'highlight-blue',
  '#c7dcff': 'highlight-blue',
  pink: 'highlight-pink',
  '#ffc7df': 'highlight-pink',
  orange: 'highlight-orange',
  '#ffd0a3': 'highlight-orange',
  red: 'highlight-red',
  '#8b1e1e': 'highlight-red',
  '#ffb5ad': 'highlight-red',
}

function renderTipNode(node: TipNode, key: string, nextHeadingId?: () => string | undefined): ReactNode {
  if (node.type === 'text') {
    let child: ReactNode = node.text ?? ''
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === 'bold') child = <strong key={`${key}-m${index}`}>{child}</strong>
      else if (mark.type === 'italic') child = <em key={`${key}-m${index}`}>{child}</em>
      else if (mark.type === 'underline') child = <u key={`${key}-m${index}`}>{child}</u>
      else if (mark.type === 'strike') child = <del key={`${key}-m${index}`}>{child}</del>
      else if (mark.type === 'code') child = <code key={`${key}-m${index}`}>{child}</code>
      else if (mark.type === 'highlight') {
        const color = String(mark.attrs?.color ?? 'yellow').toLowerCase()
        child = <mark key={`${key}-m${index}`} className={highlightClasses[color] ?? 'highlight-yellow'}>{child}</mark>
      } else if (mark.type === 'textSize') {
        const size = String(mark.attrs?.size ?? '')
        if (['small', 'normal', 'large', 'x-large'].includes(size)) {
          child = <span key={`${key}-m${index}`} data-text-size={size}>{child}</span>
        }
      } else if (mark.type === 'link') {
        const href = String(mark.attrs?.href ?? '')
        if (isSafeArticleLink(href)) {
          const external = /^https?:\/\//i.test(href)
          child = <a key={`${key}-m${index}`} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{child}</a>
        }
      }
    }
    return <span key={key}>{child}</span>
  }

  if (node.type === 'hardBreak') return <br key={key} />
  if (node.type === 'codeBlock') {
    return <CodeBlockDisplay key={key} code={(node.content ?? []).map(child => child.text ?? '').join('')} language={String(node.attrs?.language ?? 'text')} />
  }

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level)
    const safeLevel = Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2
    const children = (node.content ?? []).map((child, index) => renderTipNode(child, `${key}-${index}`, nextHeadingId))
    return createElement(`h${safeLevel}`, { key, id: nextHeadingId?.() }, children)
  }

  const children = (node.content ?? []).map((child, index) => renderTipNode(child, `${key}-${index}`, nextHeadingId))
  if (node.type === 'doc') return <Fragment key={key}>{children}</Fragment>
  if (node.type === 'paragraph') return <p key={key}>{children}</p>
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>
  if (node.type === 'listItem') return <li key={key}>{children}</li>
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>
  return <span key={key}>{children}</span>
}

function parseTiptap(value: string, nextHeadingId?: () => string | undefined): ReactNode | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    return renderTipNode(JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode, 'preview', nextHeadingId)
  } catch {
    return null
  }
}

function parseInlineTiptap(value: string, nextHeadingId?: () => string | undefined): ReactNode | null {
  if (!value.startsWith(TIPTAP_PREFIX)) return null
  try {
    const parsed = JSON.parse(value.slice(TIPTAP_PREFIX.length)) as TipNode
    const nodes = parsed.type === 'doc' ? parsed.content ?? [] : [parsed]
    return nodes.flatMap((node, index) =>
      node.type === 'paragraph'
        ? (node.content ?? []).map((child, childIndex) => renderTipNode(child, `inline-${index}-${childIndex}`, nextHeadingId))
        : [renderTipNode(node, `inline-${index}`, nextHeadingId)],
    )
  } catch {
    return null
  }
}

function inlineText(value: string): ReactNode[] {
  const pattern = /(\*\*.+?\*\*|~~.+?~~|==(?:yellow|green|blue|pink|orange|red)\|.+?==|==.+?==|\*[^*\n]+\*|\x60[^\x60\n]+\x60|<u>.+?<\/u>|\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\))/g
  return value.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{inlineText(part.slice(2, -2))}</strong>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={index}>{inlineText(part.slice(2, -2))}</del>
    if (part.startsWith('==') && part.endsWith('==')) {
      const colored = part.match(/^==(yellow|green|blue|pink|orange|red)\|([\s\S]+)==$/)
      return <mark key={index} className={`highlight-${colored?.[1] ?? 'yellow'}`}>{inlineText(colored?.[2] ?? part.slice(2, -2))}</mark>
    }
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{inlineText(part.slice(1, -1))}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    const underline = part.match(/^<u>(.*?)<\/u>$/)
    if (underline) return <u key={index}>{inlineText(underline[1])}</u>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\)$/)
    if (link && isSafeArticleLink(link[2])) {
      const external = /^https?:\/\//i.test(link[2])
      return <a key={index} href={link[2]} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{inlineText(link[1])}</a>
    }
    return part
  })
}

function formatText(value: string, nextHeadingId?: () => string | undefined): ReactNode {
  const tiptap = parseTiptap(value, nextHeadingId)
  if (tiptap) return tiptap

  const output: ReactNode[] = []
  let paragraph: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let listItems: ReactNode[] = []
  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(<p key={`p-${output.length}`}>{paragraph.map((line, index) => <span key={index}>{index > 0 ? <br /> : null}{inlineText(line)}</span>)}</p>)
    }
    paragraph = []
  }
  const flushList = () => {
    if (!listType || !listItems.length) return
    output.push(listType === 'ul' ? <ul key={`ul-${output.length}`}>{listItems}</ul> : <ol key={`ol-${output.length}`}>{listItems}</ol>)
    listItems = []
    listType = null
  }

  value.split('\n').forEach((line, index) => {
    const bullet = line.match(/^\s*[•*-]\s+(.+)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    const type = bullet ? 'ul' : numbered ? 'ol' : null
    if (type) {
      flushParagraph()
      if (listType && listType !== type) flushList()
      listType = type
      listItems.push(<li key={index}>{inlineText((bullet ?? numbered)![1])}</li>)
    } else {
      flushList()
      if (line.trim()) paragraph.push(line)
      else flushParagraph()
    }
  })
  flushList()
  flushParagraph()
  return output
}

function getInline(value: string, nextHeadingId?: () => string | undefined) {
  const tiptap = parseInlineTiptap(value, nextHeadingId)
  return tiptap ?? inlineText(value)
}

export default function ArticlePreview({ title, dek, category, readingMinutes, heroText, heroImage, editorialNote, body, sources, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const sections = createSections(body)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = document.querySelectorAll<HTMLElement>(
        '.studio-preview-dialog a[href], .studio-preview-dialog button:not(:disabled), .studio-preview-dialog [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const verifiedSources = sources.filter(source => source.verified && source.title.trim() && source.url.trim())
  let headingIndex = 0
  const nextHeadingId = () => sections[headingIndex++]?.id

  return (
    <div className="studio-preview-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="studio-preview-dialog" role="dialog" aria-modal="true" aria-label="Article preview">
        <header className="studio-preview-toolbar">
          <div><strong>Article preview</strong><span>Previewing unsaved changes</span></div>
          <button ref={closeRef} type="button" onClick={onClose}>Close preview <span aria-hidden="true">×</span></button>
        </header>
        <div className="studio-preview-scroll">
          <div className="site article-site studio-preview-site">
            <main className="article">
              <div className="article-reading-layout" id="article-reading-content">
                {sections.length > 0 && <ArticleContentsNav sections={sections} headerOffset={0} />}
                <div className="article-main-column">
              <div className="kicker article-kicker">{category || 'Uncategorized'}</div>
              <h1>{title || 'Untitled story'}</h1>
              {dek && <p className="lede">{dek}</p>}
              <div className="meta article-byline">
                <span>{readingMinutes || '8'} min read</span>
                <span aria-hidden="true">•</span>
                <span>By Kya Scene Hai? Editorial Desk</span>
              </div>
              {editorialNote.trim() && (
                <aside className="editorial-note" aria-label="Editorial note">
                  <h2>Editorial note</h2><p>{editorialNote}</p>
                </aside>
              )}
              {heroImage
                ? <Image className="articleimage" src={heroImage} alt={title || ''} width={1200} height={800} unoptimized />
                : heroText.trim() ? <div className="articlehero yellow"><h2>{heroText}</h2></div> : null}
              <article className="prose">
                {body.map((block, index) => {
                  if (typeof block === 'string') return <div className="formatted-content" key={index}>{formatText(block, nextHeadingId)}</div>
                  if (block.type === 'paragraph') return block.text ? <div className="formatted-content" key={index}>{formatText(block.text, nextHeadingId)}</div> : null
                  if (block.type === 'heading') {
                    const id = block.text ? nextHeadingId() : undefined
                    return block.text ? <h2 id={id} key={index}>{getInline(block.text, nextHeadingId)}</h2> : null
                  }
                  if (block.type === 'quote') return block.text ? <blockquote key={index}><div className="quote-text">{getInline(block.text, nextHeadingId)}</div>{block.attribution?.trim() && <footer className="quote-attribution">— {block.attribution.trim()}</footer>}</blockquote> : null
                  if (block.type === 'callout') return block.text ? <div className="articlecallout" key={index}>{getInline(block.text, nextHeadingId)}</div> : null
                  if (block.type === 'image' && block.url) return <figure key={index}><Image className="articleimage" src={block.url} alt={block.alt || ''} width={1200} height={800} unoptimized />{block.alt && <figcaption>{block.alt}</figcaption>}</figure>
                  return null
                })}
              </article>
              {verifiedSources.length > 0 && (
                <section className="article-sources">
                  <h2>SOURCES &amp; FURTHER READING</h2>
                  <ol>
                    {verifiedSources.map((source, index) => (
                      <li key={`${source.url}-${index}`}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                        {source.publisher && <span className="source-publisher"> — {source.publisher}</span>}
                        <span className="source-verified">Verified</span>
                      </li>
                    ))}
                  </ol>
                  <p className="source-note">Sources are provided for readers to inspect. “Verified” means the editorial team checked the linked material directly; it is not an endorsement of every claim on the source website.</p>
                </section>
              )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}
