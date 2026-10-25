'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type ArticleSection = {
  id: string
  text: string
  level: number
}

type Props = {
  sections: ArticleSection[]
  headerOffset?: number
}

function sectionNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

type SectionTreeNode = {
  section: ArticleSection
  children: SectionTreeNode[]
}

function buildSectionTree(sections: ArticleSection[]) {
  const roots: SectionTreeNode[] = []
  const parents: SectionTreeNode[] = []

  for (const section of sections) {
    const node: SectionTreeNode = { section, children: [] }
    while (parents.length && parents[parents.length - 1].section.level >= section.level) {
      parents.pop()
    }

    const parent = parents[parents.length - 1]
    if (section.level <= 2 || !parent) roots.push(node)
    else parent.children.push(node)
    parents.push(node)
  }

  return roots
}

function alphabeticNumber(index: number) {
  let value = index + 1
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(97 + value % 26) + result
    value = Math.floor(value / 26)
  }
  return result
}

function romanNumber(index: number) {
  const values: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'],
    [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'],
    [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let value = index + 1
  let result = ''
  for (const [amount, numeral] of values) {
    while (value >= amount) {
      result += numeral
      value -= amount
    }
  }
  return result
}

function sectionMarker(index: number, level: number) {
  if (level <= 2) return sectionNumber(index)
  if (level === 3) return alphabeticNumber(index)
  if (level === 4) return romanNumber(index)
  return String(index + 1)
}

export default function ArticleContentsNav({ sections, headerOffset }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [observedHeaderHeight, setObservedHeaderHeight] = useState(82)
  const headerHeight = headerOffset ?? observedHeaderHeight
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (headerOffset !== undefined) return
    const header = document.querySelector('.article-site > .site-nav')
    if (!header) return

    const updateHeight = () => setObservedHeaderHeight(Math.ceil(header.getBoundingClientRect().height))
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    updateHeight()

    return () => observer.disconnect()
  }, [headerOffset])

  useEffect(() => {
    const headings = sections
      .map(section => document.getElementById(section.id))
      .filter((heading): heading is HTMLElement => heading instanceof HTMLElement)

    if (!headings.length) return

    const scrollContainer = headings[0].closest<HTMLElement>('.studio-preview-scroll')
    const selectLastSectionAtPageEnd = () => {
      const isAtEnd = scrollContainer
        ? scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (isAtEnd) {
        setActiveId(sections[sections.length - 1]?.id ?? '')
        return true
      }
      return false
    }

    const observer = new IntersectionObserver((entries) => {
      if (selectLastSectionAtPageEnd()) return

      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.25) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.25))

      if (visible[0]) setActiveId(visible[0].target.id)
    }, { root: scrollContainer, rootMargin: '-15% 0px -65% 0px', threshold: 0 })

    headings.forEach(heading => observer.observe(heading))

    const scrollTarget = scrollContainer ?? window
    scrollTarget.addEventListener('scroll', selectLastSectionAtPageEnd, { passive: true })
    selectLastSectionAtPageEnd()

    return () => {
      observer.disconnect()
      scrollTarget.removeEventListener('scroll', selectLastSectionAtPageEnd)
    }
  }, [sections])

  useEffect(() => {
    if (!isOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const activeSection = sections.find(section => section.id === activeId) ?? sections[0]
  const sectionTree = buildSectionTree(sections)
  const renderSections = (nodes: SectionTreeNode[]) => (
    <ol>
      {nodes.map((node, index) => (
        <li key={node.section.id}>
          <a
            href={`#${node.section.id}`}
            className={node.section.id === activeId ? 'is-active' : undefined}
            aria-current={node.section.id === activeId ? 'location' : undefined}
            onClick={() => setIsOpen(false)}
          >
            <span className="article-section-number">{sectionMarker(index, node.section.level)}</span>
            <span>{node.section.text}</span>
          </a>
          {node.children.length > 0 && renderSections(node.children)}
        </li>
      ))}
    </ol>
  )

  return (
    <aside
      className="article-sidebar"
      aria-label="Article sections"
      style={{ '--article-mobile-header-height': `${headerHeight}px` } as CSSProperties}
    >
      <nav className="article-sidebar-nav" aria-label="In this article">
        <h2>IN THIS ARTICLE</h2>
        {renderSections(sectionTree)}
      </nav>

      <div className="article-mobile-toc">
        <button
          ref={toggleRef}
          type="button"
          className="article-mobile-toc-toggle"
          aria-expanded={isOpen}
          aria-controls="article-mobile-toc-list"
          onClick={() => setIsOpen(open => !open)}
        >
          <span className="article-mobile-toc-label">IN THIS ARTICLE</span>
          <span className="article-mobile-toc-current">{activeSection?.text ?? 'Choose a section'}</span>
          <span className={`article-mobile-toc-chevron${isOpen ? ' is-open' : ''}`} aria-hidden="true">⌄</span>
        </button>
        <nav
          id="article-mobile-toc-list"
          className={`article-mobile-toc-list${isOpen ? ' is-open' : ''}`}
          aria-label="Article sections"
          aria-hidden={!isOpen}
          inert={!isOpen}
        >
          {renderSections(sectionTree)}
        </nav>
      </div>
    </aside>
  )
}
