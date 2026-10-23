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

  return (
    <aside
      className="article-sidebar"
      aria-label="Article sections"
      style={{ '--article-mobile-header-height': `${headerHeight}px` } as CSSProperties}
    >
      <nav className="article-sidebar-nav" aria-label="In this article">
        <h2>IN THIS ARTICLE</h2>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={section.id === activeId ? 'is-active' : undefined}
                aria-current={section.id === activeId ? 'location' : undefined}
              >
                <span className="article-section-number">{sectionNumber(index)}</span>
                <span>{section.text}</span>
              </a>
            </li>
          ))}
        </ol>
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
          <ol>
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={section.id === activeId ? 'is-active' : undefined}
                  aria-current={section.id === activeId ? 'location' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="article-section-number">{sectionNumber(index)}</span>
                  <span>{section.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </aside>
  )
}
